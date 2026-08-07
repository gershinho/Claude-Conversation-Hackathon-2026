/**
 * JSON Schemas passed to the Claude API via `output_config.format`, plus the
 * matching TypeScript types the UI renders.
 *
 * Structured-output schemas must set `additionalProperties: false` and list
 * every property in `required` — the API rejects schemas that do not.
 */

// ---------------------------------------------------------------------------
// Lesson plan analysis + personalized AI training session
// ---------------------------------------------------------------------------

export type Weakness = {
  title: string
  evidence: string
  why_it_matters: string
  access_impact: string
}

export type TrainingModule = {
  title: string
  prompting_move: string
  targets_weakness: string
  why: string
  prompt: string
  what_good_looks_like: string
  push_back_with: string
}

export type Analysis = {
  plan_title: string
  course_and_topic: string
  document_markdown: string
  read_back: string
  strengths: string[]
  weaknesses: Weakness[]
  session_title: string
  session_goal: string
  modules: TrainingModule[]
}

export const ANALYSIS_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'plan_title',
    'course_and_topic',
    'document_markdown',
    'read_back',
    'strengths',
    'weaknesses',
    'session_title',
    'session_goal',
    'modules',
  ],
  properties: {
    plan_title: { type: 'string', description: "The lesson plan's title, or one you infer from it." },
    course_and_topic: {
      type: 'string',
      description: 'Course, grade level, and specific topic. e.g. "Precalculus, 11th grade - graphing rational functions"',
    },
    document_markdown: {
      type: 'string',
      description:
        'A faithful markdown transcription of HER plan exactly as uploaded — headings, lists, and timings preserved; no improvements, no commentary, no fixes. Condense only true boilerplate. Keep under roughly 1500 words.',
    },
    read_back: {
      type: 'string',
      description:
        'Two sentences, second person, showing Melissa you actually read HER plan. Name specific things that are in it.',
    },
    strengths: {
      type: 'array',
      description: 'Two or three things that genuinely work in this plan. Specific to the plan, not generic praise.',
      items: { type: 'string' },
    },
    weaknesses: {
      type: 'array',
      description: 'Three or four real weaknesses found in this specific plan.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['title', 'evidence', 'why_it_matters', 'access_impact'],
        properties: {
          title: { type: 'string', description: 'Short name for the weakness, 6 words or fewer.' },
          evidence: {
            type: 'string',
            description: 'The exact thing in HER plan that shows this. Quote or paraphrase it closely.',
          },
          why_it_matters: { type: 'string', description: 'One or two sentences on the instructional cost.' },
          access_impact: {
            type: 'string',
            description:
              'One sentence on who this shuts out of the hard math, or whose reasoning stays invisible. Craft, not commentary.',
          },
        },
      },
    },
    session_title: { type: 'string', description: 'Name of the training session, 8 words or fewer.' },
    session_goal: {
      type: 'string',
      description: 'One sentence: what Melissa will be able to do with AI by the end of this session.',
    },
    modules: {
      type: 'array',
      description: 'One module per weakness, in the order she should work through them.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: [
          'title',
          'prompting_move',
          'targets_weakness',
          'why',
          'prompt',
          'what_good_looks_like',
          'push_back_with',
        ],
        properties: {
          title: { type: 'string', description: 'Module title, 8 words or fewer.' },
          prompting_move: {
            type: 'string',
            description: 'The named, transferable prompting technique. e.g. "Give the AI your constraints before your ask"',
          },
          targets_weakness: { type: 'string', description: 'The `title` of the weakness this module fixes.' },
          why: { type: 'string', description: 'Two sentences teaching why this move works.' },
          prompt: {
            type: 'string',
            description:
              'A complete, copy-pasteable prompt written in first person as Melissa, already filled in with the real topic, grade, and details from her plan. NEVER use [brackets] or placeholders.',
          },
          what_good_looks_like: {
            type: 'string',
            description: 'How Melissa can tell the AI response is actually usable.',
          },
          push_back_with: {
            type: 'string',
            description: 'A follow-up line she can send when the first response is too generic.',
          },
        },
      },
    },
  },
} as const

// ---------------------------------------------------------------------------
// Adaptive intake (the "no sample plans" path) — one question per turn.
// After every answer Claude re-decides: ask the single most load-bearing
// question left, or declare it has enough and build.
// ---------------------------------------------------------------------------

export type IntakeStep = {
  ready: boolean
  coach_line: string
  question: string
  why: string
  placeholder: string
  suggestions: string[]
}

export const INTAKE_STEP_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['ready', 'coach_line', 'question', 'why', 'placeholder', 'suggestions'],
  properties: {
    ready: {
      type: 'boolean',
      description:
        'true the moment you know enough to build a plan she would recognize as hers — then every field below except coach_line is an empty string or empty array.',
    },
    coach_line: {
      type: 'string',
      description:
        'One or two short sentences, second person. Acknowledge what you just learned or already know, and either lead into the question or (when ready) say what you are about to build. Plain text.',
    },
    question: {
      type: 'string',
      description: 'The ONE question whose answer would most change the plan. One sentence. Empty string when ready.',
    },
    why: { type: 'string', description: 'Short note on what this changes about the plan. Empty string when ready.' },
    placeholder: {
      type: 'string',
      description: 'A realistic example answer for a Precalculus teacher. Empty string when ready.',
    },
    suggestions: {
      type: 'array',
      description:
        'Two to four tappable one-line answers she can pick instead of typing — real, specific answers, not categories. Empty array when ready.',
      items: { type: 'string' },
    },
  },
} as const

// ---------------------------------------------------------------------------
// Lesson plan
// ---------------------------------------------------------------------------

export type PlanPhase = {
  phase: string
  minutes: number
  teacher_moves: string
  student_moves: string
}

export type LessonPlan = {
  title: string
  course: string
  duration_minutes: number
  big_idea: string
  objectives: string[]
  prior_knowledge: string[]
  materials: string[]
  sequence: PlanPhase[]
  support_moves: string[]
  extension_moves: string[]
  formative_checks: string[]
  exit_ticket: string
  coach_note: string
}

export const LESSON_PLAN_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: [
    'title',
    'course',
    'duration_minutes',
    'big_idea',
    'objectives',
    'prior_knowledge',
    'materials',
    'sequence',
    'support_moves',
    'extension_moves',
    'formative_checks',
    'exit_ticket',
    'coach_note',
  ],
  properties: {
    title: { type: 'string' },
    course: { type: 'string', description: 'Course and grade level.' },
    duration_minutes: { type: 'integer' },
    big_idea: { type: 'string', description: 'The one mathematical idea students should leave holding.' },
    objectives: { type: 'array', items: { type: 'string' }, description: 'Two or three observable objectives.' },
    prior_knowledge: { type: 'array', items: { type: 'string' } },
    materials: { type: 'array', items: { type: 'string' } },
    sequence: {
      type: 'array',
      description: 'The lesson, phase by phase, with minutes that sum to duration_minutes.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['phase', 'minutes', 'teacher_moves', 'student_moves'],
        properties: {
          phase: { type: 'string', description: 'e.g. "Launch", "Explore", "Discuss", "Synthesize"' },
          minutes: { type: 'integer' },
          teacher_moves: { type: 'string', description: 'What Melissa does and says. Include the actual questions she asks.' },
          student_moves: { type: 'string', description: 'What students are doing, and what their thinking looks like.' },
        },
      },
    },
    support_moves: {
      type: 'array',
      items: { type: 'string' },
      description: 'Scaffolds that keep the cognitive demand high instead of lowering it.',
    },
    extension_moves: { type: 'array', items: { type: 'string' } },
    formative_checks: { type: 'array', items: { type: 'string' } },
    exit_ticket: { type: 'string', description: 'The actual exit ticket task, written out.' },
    coach_note: {
      type: 'string',
      description:
        'Two sentences from the coach to Melissa: the one prompting move that produced the strongest part of this plan, so she can reuse it.',
    },
  },
} as const

// ---------------------------------------------------------------------------
// Guided session — one turn of the A→B prompting loop, split into two calls:
// a fast judge/chat call (small model) and, only on pass, the document edit
// (big model). Gates and questions never pay for a full-document response.
// ---------------------------------------------------------------------------

export type BuddyMood = 'idle' | 'thinking' | 'excited' | 'nudge' | 'celebrate'

export type PromptFeedback = {
  quality: 'vague' | 'decent' | 'strong'
  move_used: string
  coached_move: string
  tip: string
}

export type TurnJudgement = {
  verdict: 'pass' | 'gate' | 'answer'
  buddy_message: string
  buddy_mood: BuddyMood
  prompt_feedback: PromptFeedback
}

export type DocEdit = {
  updated_document: string
  rubric: { id: string; satisfied: boolean }[]
  first_change_hint: string
}

export type RubricItem = {
  id: string
  title: string
  move: string
  satisfied: boolean
}

/** The session curriculum comes straight from the analysis: one rubric item
 *  per training module, pairing the weakness with its prompting move. */
export function buildRubric(analysis: Analysis): RubricItem[] {
  return analysis.modules.map((m) => ({
    id: m.targets_weakness
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, ''),
    title: m.targets_weakness,
    move: m.prompting_move,
    satisfied: false,
  }))
}

export const TURN_JUDGE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['verdict', 'buddy_message', 'buddy_mood', 'prompt_feedback'],
  properties: {
    verdict: {
      type: 'string',
      enum: ['pass', 'gate', 'answer'],
      description:
        'pass = her edit should be applied to the document. gate = intercept a clearly vague prompt, document unchanged. answer = she asked a question; reply in the bubble, document unchanged.',
    },
    buddy_message: {
      type: 'string',
      description:
        "Claw'd's speech bubble. One or two short sentences, playful teaching-assistant voice. Plain text, no markdown.",
    },
    buddy_mood: {
      type: 'string',
      enum: ['idle', 'thinking', 'excited', 'nudge', 'celebrate'],
      description:
        'excited when she lands a move, nudge when gating or coaching, celebrate only when every rubric item in RUBRIC STATE is already satisfied.',
    },
    prompt_feedback: {
      type: 'object',
      additionalProperties: false,
      required: ['quality', 'move_used', 'coached_move', 'tip'],
      properties: {
        quality: { type: 'string', enum: ['vague', 'decent', 'strong'] },
        move_used: {
          type: 'string',
          description: 'The named rubric prompting move she just demonstrated unprompted, or "" if none.',
        },
        coached_move: {
          type: 'string',
          description: 'The named move the buddy is nudging her toward this turn, or "" if none.',
        },
        tip: { type: 'string', description: 'One-line transferable prompting tip, or "".' },
      },
    },
  },
} as const

export const DOC_EDIT_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['updated_document', 'rubric', 'first_change_hint'],
  properties: {
    updated_document: {
      type: 'string',
      description:
        'The COMPLETE document markdown after applying exactly what she asked — nothing more.',
    },
    rubric: {
      type: 'array',
      description:
        'The complete rubric state, every item re-judged against the new document. An edit that undoes progress flips its item back to false.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'satisfied'],
        properties: {
          id: { type: 'string' },
          satisfied: { type: 'boolean' },
        },
      },
    },
    first_change_hint: {
      type: 'string',
      description: 'The exact first line of the earliest section you changed, so the UI can scroll to it.',
    },
  },
} as const
