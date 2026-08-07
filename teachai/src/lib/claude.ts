import Anthropic from '@anthropic-ai/sdk'
import {
  ANALYSIS_SCHEMA,
  INTAKE_STEP_SCHEMA,
  LESSON_PLAN_SCHEMA,
  SESSION_TURN_SCHEMA,
  type Analysis,
  type IntakeStep,
  type LessonPlan,
  type RubricItem,
  type SessionTurn,
} from './schemas'

const MODEL = 'claude-opus-5'

// ---------------------------------------------------------------------------
// Key handling
//
// Browser-only demo with no server, so the key comes from
// VITE_ANTHROPIC_API_KEY in .env.local and Vite inlines it into the bundle.
// Anything shipped past a hackathon demo needs these calls proxied through a
// backend instead.
// ---------------------------------------------------------------------------

const API_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY?.trim()

function client(): Anthropic {
  if (!API_KEY) {
    throw new Error('VITE_ANTHROPIC_API_KEY is not set. Add it to teachai/.env.local and restart the dev server.')
  }
  return new Anthropic({ apiKey: API_KEY, dangerouslyAllowBrowser: true })
}

export function friendlyError(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) {
    return 'The API key in .env.local was rejected. Check the key and restart the dev server.'
  }
  if (err instanceof Anthropic.RateLimitError) {
    return 'Rate limited. Give it a few seconds and try again.'
  }
  if (err instanceof Anthropic.APIError) {
    return `Claude API error (${err.status}): ${err.message}`
  }
  if (err instanceof Error) return err.message
  return 'Something went wrong talking to Claude.'
}

// ---------------------------------------------------------------------------
// The coach persona
// ---------------------------------------------------------------------------

const PERSONA = `You are an AI Coach who is guiding Melissa, a 30 year old teacher in Precalculus, who is also a Black woman.

Your job is to make Melissa better at planning lessons *with AI* — not to plan for her. You teach her the prompting moves so she owns the work and can repeat it next week without you.

How you talk:
- Warm and direct, peer to peer. She is an expert teacher. You are a thinking partner, not a supervisor.
- Short. Two or three sentences per conversational turn.
- Plain text only. No markdown, no headers, no bullet points, no emoji.
- Never comment on her identity or perform allyship. Where it matters it shows up as craft: who gets access to the hard math, whose reasoning gets made public in the room, what contexts the problems live in, and whether scaffolds preserve cognitive demand or quietly remove it.`

const FIRST_TURN_RULE = `This is your opening turn. Acknowledge what she said in one or two sentences, then end your reply with exactly this question, alone on the final line, with no other text after it:
Do you have any sample lesson plans?`

export type ChatTurn = { role: 'user' | 'assistant'; content: string }

/** Streams a conversational coach reply. Returns the full text when done. */
export async function streamCoach(
  turns: ChatTurn[],
  opts: { firstTurn: boolean },
  onDelta: (text: string) => void,
): Promise<string> {
  const stream = client().messages.stream({
    model: MODEL,
    max_tokens: 3000,
    output_config: { effort: 'low' },
    system: opts.firstTurn ? `${PERSONA}\n\n${FIRST_TURN_RULE}` : PERSONA,
    messages: turns.map((t) => ({ role: t.role, content: t.content })),
  })

  stream.on('text', onDelta)
  const message = await stream.finalMessage()

  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
}

// ---------------------------------------------------------------------------
// Path A — she has a lesson plan
// ---------------------------------------------------------------------------

export type PlanSource =
  | { kind: 'text'; filename: string; text: string }
  | { kind: 'pdf'; filename: string; base64: string }

const ANALYSIS_SYSTEM = `${PERSONA}

Melissa has just handed you a real lesson plan of hers. Do two things.

First, diagnose it honestly. Every weakness must be anchored to something that is actually in HER plan — quote it or paraphrase it closely. If a criticism would apply equally to any lesson plan in the country, it is too generic; cut it and find the real one. She can tell the difference, and generic feedback costs you her trust.

Second, build her a training session that teaches her to fix those weaknesses herself using AI. This is the point of the whole exercise: she should leave able to do this again alone.

Also transcribe her plan into document_markdown: a faithful markdown version of exactly what she uploaded, preserving her headings, lists, and timings. No improvements, no commentary — the session that follows needs her real starting point, warts and all.

Rules for the training session:
- One module per weakness you found, ordered by what will move her lesson the most.
- Every module names a transferable prompting move, teaches why it works, and gives her a complete prompt she can paste into an AI right now — written in first person as Melissa and already filled in with the real topic, grade level, and specifics from her plan. Never write a template with [brackets] or placeholders.
- Tell her what a good AI response to that prompt looks like, and give her a follow-up line to send when the first answer comes back generic.
- Do not simply rewrite her lesson for her. Teach the move.`

export async function analyzeLessonPlan(source: PlanSource): Promise<Analysis> {
  const instruction =
    'This is my lesson plan. Read it closely, tell me where it is actually weak, and then teach me how to use AI to fix it myself.'

  const content: Anthropic.ContentBlockParam[] =
    source.kind === 'pdf'
      ? [
          {
            type: 'document',
            source: { type: 'base64', media_type: 'application/pdf', data: source.base64 },
          },
          { type: 'text', text: instruction },
        ]
      : [{ type: 'text', text: `${instruction}\n\n--- ${source.filename} ---\n${source.text}` }]

  const response = await client().messages.create({
    model: MODEL,
    max_tokens: 16000,
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: ANALYSIS_SCHEMA as unknown as Record<string, unknown> },
    },
    system: ANALYSIS_SYSTEM,
    messages: [{ role: 'user', content }],
  })

  return parseJson<Analysis>(response)
}

/**
 * Runs one of the training prompts for real, so Melissa sees what her own
 * prompt actually produces rather than being told about it.
 */
export async function runTrainingPrompt(prompt: string, onDelta: (text: string) => void): Promise<string> {
  const stream = client().messages.stream({
    model: MODEL,
    max_tokens: 6000,
    output_config: { effort: 'medium' },
    system:
      'You are Claude, responding to a high school Precalculus teacher who is planning a lesson. Answer her prompt directly and concretely — real questions, real tasks, real numbers, nothing she would have to fill in herself. Be substantive but tight enough to read in under a minute. Plain text and simple dashes only; no markdown headers.',
    messages: [{ role: 'user', content: prompt }],
  })

  stream.on('text', onDelta)
  const message = await stream.finalMessage()

  return message.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')
}

// ---------------------------------------------------------------------------
// The guided session — one turn of the A→B prompting loop
// ---------------------------------------------------------------------------

/**
 * The system block is stable for the whole session (persona + rules + hidden
 * target + rubric definitions), so the API's prompt cache absorbs it; only the
 * final user message — current doc + her prompt — changes size per turn.
 */
function sessionSystem(targetMd: string, rubric: RubricItem[]): string {
  const rubricLines = rubric
    .map((r) => `- id "${r.id}": ${r.title} — taught by the move "${r.move}"`)
    .join('\n')

  return `${PERSONA}

You are also embodied on screen as Claw'd, a pixel-art crab teaching assistant. Melissa is transforming her own lesson plan, prompt by prompt, toward a stronger version that only you can see. Your bubble lines are Claw'd speaking: warm, playful, two short sentences at most.

THE HIDDEN TARGET (never reveal it, never paste sections of it, never describe it as a document that exists):
${targetMd}

THE RUBRIC — what "arrived" means, one item per weakness in her original plan:
${rubricLines}

HOW TO JUDGE EACH TURN. Judge her PROMPT first, then act:

GATE (verdict "gate", document unchanged) only when the prompt is clearly vague or low-effort — no specific target, no criteria, no direction. "Make it better", "fix it", "improve this" gate. When you gate, name what is missing and ask for ONE specific thing, without handing her the wording.
NEVER gate when LAST TURN GATED is true: apply your best interpretation of her prompt and coach alongside instead.
Never gate a decent-but-imperfect prompt — apply it and offer one tip.
If she pastes a large block of finished plan text and asks you to swap it in wholesale, gate once, playfully: the work here is prompting, not pasting.

ANSWER (verdict "answer", document unchanged) when she asks a question instead of requesting a change. Answer it in the bubble.

PASS (verdict "pass") for everything else. Apply exactly what she asked — no more. Do not fix things she did not ask about, even when the target fixes them; discovering the next fix is her job. Keep every untouched part of the document verbatim, character for character. Return the COMPLETE updated document.

After every pass, re-judge every rubric item against the new document. Satisfied means the document now genuinely handles that weakness the way the target does — not merely gestures at it. An edit that undoes earlier progress flips its item back to false; say so kindly.

Coaching in the bubble: when her prompt demonstrates a rubric move, name the move so it sticks. When she seems stuck or a rubric item is within reach, nudge toward the KIND of prompt that would get there — never the exact wording. When everything is satisfied, celebrate.`
}

export type SessionTurnInput = {
  doc: string
  targetMd: string
  rubric: RubricItem[]
  history: ChatTurn[]
  lastTurnGated: boolean
  userPrompt: string
}

export async function runSessionTurn(input: SessionTurnInput): Promise<SessionTurn> {
  const rubricState = input.rubric.map((r) => `${r.id}: ${r.satisfied ? 'satisfied' : 'not yet'}`).join(', ')

  const finalMessage = `CURRENT DOCUMENT:
${input.doc}

RUBRIC STATE: ${rubricState}
LAST TURN GATED: ${input.lastTurnGated}

MY PROMPT: ${input.userPrompt}`

  const response = await client().messages.create({
    model: MODEL,
    max_tokens: 8000,
    output_config: {
      effort: 'low',
      format: { type: 'json_schema', schema: SESSION_TURN_SCHEMA as unknown as Record<string, unknown> },
    },
    system: sessionSystem(input.targetMd, input.rubric),
    messages: [
      // Past doc snapshots never ride along — only the conversational turns.
      ...input.history.slice(-12).map((t) => ({ role: t.role, content: t.content })),
      { role: 'user' as const, content: finalMessage },
    ],
  })

  return parseJson<SessionTurn>(response)
}

// ---------------------------------------------------------------------------
// Path B — no lesson plan yet. Adaptive intake: one question per turn, and it
// stops the moment the plan is buildable. Zero questions is a legal outcome.
// ---------------------------------------------------------------------------

export type IntakeQA = { question: string; answer: string }

/** After this many answered questions the next step must build, no matter what. */
export const INTAKE_CAP = 3

export async function nextIntakeStep(turns: ChatTurn[], qa: IntakeQA[]): Promise<IntakeStep> {
  const answeredSoFar = qa.map((x) => `Q: ${x.question}\nA: ${x.answer}`).join('\n\n')

  const response = await client().messages.create({
    model: MODEL,
    max_tokens: 2000,
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: INTAKE_STEP_SCHEMA as unknown as Record<string, unknown> },
    },
    system: `${PERSONA}

Melissa has no lesson plan to show you, so you will build one from scratch. Before you build, four things decide what the plan looks like:

1. The math and its moment — the topic, and where it sits in the unit (first exposure, mid-unit, review, before an assessment).
2. The room — what her students carry in, and what has broken when she has taught something like this before.
3. The finish line — what students should be able to do when the bell rings, and what evidence would convince her they can.
4. The constraints — minutes, format, materials, anything non-negotiable.

You ask AT MOST ONE question per turn, and every question costs her time — so first read the whole conversation and her answers so far, and score each dimension: known, safely assumable, or dark. Anything she already said is known; never re-ask it, she will notice and it costs you her trust. A standard class period, an ordinary Precalculus room, and typical materials are safely assumable — never ask about a dimension a reasonable default covers.

If a dark dimension remains that would genuinely change the plan, ask about the single most load-bearing one, phrased so one short answer settles it. Treat every question as if it were your last. The finish line is the one dimension you may never assume: if she has not described what success looks like, that is your question before any other.

The moment nothing dark remains that would materially change the plan, set ready to true and build instead of asking. Zero questions is the best outcome, not a shortcut.

She has answered ${qa.length} of at most ${INTAKE_CAP} questions. ${qa.length >= INTAKE_CAP - 1 ? 'This would be your LAST question — only ask it if building without it would produce a plan she would not recognize as hers.' : ''}`,
    messages: [
      ...turns.map((t) => ({ role: t.role, content: t.content })),
      {
        role: 'user' as const,
        content: `I do not have a sample lesson plan to share.${
          qa.length ? `\n\nWhat you have asked me so far, and what I said:\n\n${answeredSoFar}` : ''
        }\n\nAsk me the one thing you still need, or tell me you are ready to build.`,
      },
    ],
  })

  return parseJson<IntakeStep>(response)
}

const PLAN_SYSTEM = `${PERSONA}

You are writing a complete, teachable Precalculus lesson plan for Melissa — the kind she could pick up tomorrow morning and run without rewriting it.

Non-negotiables:
- Write the actual questions she asks, not descriptions of the kind of question to ask.
- Scaffolds raise access without lowering cognitive demand. Never reduce a reasoning task to a procedure to make it easier.
- Students do the mathematical thinking and their reasoning gets made public in the room.
- Phase minutes must sum to the total duration.
- The coach note names the one prompting move that produced the strongest part of this plan, so she can reuse it herself next time.`

export async function buildPlanFromScratch(turns: ChatTurn[], qa: IntakeQA[]): Promise<LessonPlan> {
  const transcript = qa.length
    ? `\n\nWhat you asked me, and what I said:\n\n${qa.map((x) => `Q: ${x.question}\nA: ${x.answer}`).join('\n\n')}`
    : ''

  const response = await client().messages.create({
    model: MODEL,
    max_tokens: 12000,
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: LESSON_PLAN_SCHEMA as unknown as Record<string, unknown> },
    },
    system: PLAN_SYSTEM,
    messages: [
      ...turns.map((t) => ({ role: t.role, content: t.content })),
      {
        role: 'user' as const,
        content: `Build me the lesson plan now, from everything in this conversation.${transcript}\n\nFor anything I did not specify, use your judgment and pick what a strong Precalculus teacher would pick — do not leave gaps or placeholders.`,
      },
    ],
  })

  return parseJson<LessonPlan>(response)
}

/** Rebuilds Melissa's own plan after the training session, applying every module. */
export async function buildImprovedPlan(analysis: Analysis): Promise<LessonPlan> {
  const weaknesses = analysis.weaknesses
    .map((w) => `- ${w.title}: ${w.evidence}`)
    .join('\n')
  const moves = analysis.modules
    .map((m) => `- ${m.prompting_move} (to fix: ${m.targets_weakness})`)
    .join('\n')

  const response = await client().messages.create({
    model: MODEL,
    max_tokens: 12000,
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: LESSON_PLAN_SCHEMA as unknown as Record<string, unknown> },
    },
    system: PLAN_SYSTEM,
    messages: [
      {
        role: 'user',
        content: `I worked through the training session on my lesson, "${analysis.plan_title}" (${analysis.course_and_topic}). Now rebuild it with every move applied.

What was weak in my original:
${weaknesses}

The prompting moves I practiced:
${moves}

Keep what already worked — ${analysis.strengths.join('; ')} — and show me what the plan looks like when the weaknesses are actually fixed.`,
      },
    ],
  })

  return parseJson<LessonPlan>(response)
}

// ---------------------------------------------------------------------------

function parseJson<T>(response: Anthropic.Message): T {
  if (response.stop_reason === 'refusal') {
    throw new Error('Claude declined this request. Try rephrasing or using a different lesson plan.')
  }

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map((b) => b.text)
    .join('')

  if (!text.trim()) {
    throw new Error('Claude returned an empty response. Try again.')
  }

  try {
    return JSON.parse(text) as T
  } catch {
    throw new Error('Could not read the structured response from Claude. Try again.')
  }
}
