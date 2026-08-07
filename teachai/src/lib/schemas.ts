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
// Intake questions (the "no sample plans" path)
// ---------------------------------------------------------------------------

export type IntakeQuestion = {
  id: string
  question: string
  why: string
  placeholder: string
  suggestions: string[]
}

export type Intake = {
  intro: string
  questions: IntakeQuestion[]
}

export const INTAKE_SCHEMA = {
  type: 'object',
  additionalProperties: false,
  required: ['intro', 'questions'],
  properties: {
    intro: {
      type: 'string',
      description: 'Two sentences, second person, framing why you are asking before you build anything.',
    },
    questions: {
      type: 'array',
      description: 'Exactly four questions. Each one must change what the lesson plan looks like.',
      items: {
        type: 'object',
        additionalProperties: false,
        required: ['id', 'question', 'why', 'placeholder', 'suggestions'],
        properties: {
          id: { type: 'string', description: 'snake_case identifier' },
          question: { type: 'string', description: 'The question, one sentence.' },
          why: { type: 'string', description: 'Short note on what this changes about the plan.' },
          placeholder: { type: 'string', description: 'A realistic example answer for a Precalculus teacher.' },
          suggestions: {
            type: 'array',
            description: 'Two or three tappable one-line answers she can pick instead of typing.',
            items: { type: 'string' },
          },
        },
      },
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
