import Anthropic from '@anthropic-ai/sdk'
import {
  ANALYSIS_SCHEMA,
  INTAKE_SCHEMA,
  LESSON_PLAN_SCHEMA,
  type Analysis,
  type Intake,
  type LessonPlan,
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
    max_tokens: 12000,
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
// Path B — no lesson plan yet
// ---------------------------------------------------------------------------

export async function generateIntake(turns: ChatTurn[]): Promise<Intake> {
  const response = await client().messages.create({
    model: MODEL,
    max_tokens: 4000,
    output_config: {
      effort: 'medium',
      format: { type: 'json_schema', schema: INTAKE_SCHEMA as unknown as Record<string, unknown> },
    },
    system: `${PERSONA}

Melissa does not have a lesson plan to show you, so you are going to build one together from scratch. Before you write anything, ask her the four questions whose answers would most change what the lesson looks like. Ask about the mathematics and the room — the topic and where it sits in the unit, what her students already carry in, what she wants them actually doing, and what has gone wrong when she taught something like this before. Do not ask about anything you can reasonably assume.`,
    messages: [
      ...turns.map((t) => ({ role: t.role, content: t.content })),
      { role: 'user' as const, content: 'I do not have a sample lesson plan to share. Ask me what you need to know.' },
    ],
  })

  return parseJson<Intake>(response)
}

const PLAN_SYSTEM = `${PERSONA}

You are writing a complete, teachable Precalculus lesson plan for Melissa — the kind she could pick up tomorrow morning and run without rewriting it.

Non-negotiables:
- Write the actual questions she asks, not descriptions of the kind of question to ask.
- Scaffolds raise access without lowering cognitive demand. Never reduce a reasoning task to a procedure to make it easier.
- Students do the mathematical thinking and their reasoning gets made public in the room.
- Phase minutes must sum to the total duration.
- The coach note names the one prompting move that produced the strongest part of this plan, so she can reuse it herself next time.`

export async function buildPlanFromIntake(
  intake: Intake,
  answers: Record<string, string>,
): Promise<LessonPlan> {
  const transcript = intake.questions
    .map((q) => `Q: ${q.question}\nA: ${answers[q.id]?.trim() || '(no answer given — use your judgment)'}`)
    .join('\n\n')

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
        content: `Here is what I told you about my class and what I want out of this lesson. Build me the plan.\n\n${transcript}`,
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
