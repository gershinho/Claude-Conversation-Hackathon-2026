# Teach AI — Teacher Progress Report — Requirements

Source: grill-me session, 2026-08-07
Status: COMPLETE for demo scope

## Product context

- R1: Teach AI trains teachers to use AI to improve their teaching practice.
- R2: Each teacher has an AI buddy she converses with in *sessions* (e.g. "help me improve my lesson planning"). Sessions accumulate over time.
- R3: Teach AI is **also the authoring surface** — teachers write lesson plans and other artifacts inside the product. Every artifact therefore has a timestamp and version history on file, with no upload step and no missing-artifact gaps.

## Framing

- R4: The screen is a **report to the teacher**, not a dashboard and not a report to an administrator.
  - R4.1: It has a narrative reading order, not a grid of widgets.
  - R4.2: Every claim carries its evidence adjacent to it.
  - R4.3: CTAs are secondary. She is being told what happened, not told what to do.
- R5: The report is scoped to a **school term** ("Term 2 · January – May 2026"), with prior/next terms navigable. All-time trajectory appears only as background context.

## Skill model

- R6: Two layers, presented as two parts of the report.
  - R6.1: **Part 1 — "How you work with AI."** Prompt engineering as a meta-skill scored across all sessions. Derived from chat transcripts.
  - R6.2: **Part 2 — "What it did for your teaching."** Craft skills scored separately. Derived from authored artifacts.
- R7: Prompt engineering has four sub-skills: context-setting, specificity, iterative refinement, critical evaluation. An overall level is shown as a transition (e.g. Level 3 → Level 4).
- R8: Craft skills tracked: Lesson Planning, Assessment Design, Differentiation, Student Feedback. Each shows a delta and the artifact count it is based on.
  - R8.1: A craft skill with no artifacts shows an explicit "no work yet" state rather than a zero.

## Part 1 — evidence

- R9: Sub-skill scores are shown as bars with before → after values, weakest called out.
- R10: The primary evidence for Part 1 is **her own prompts, then vs now** — her earliest prompt and a recent one, side by side, annotated with what was missing then and present now. This is the emotional peak of the report.
- R11: Cohort data appears as **context, never ranking**.
  - R11.1: No percentile, no leaderboard, no named comparison to colleagues.
  - R11.2: Cohort is used only to give scale to her own numbers (e.g. "critical evaluation is the skill most teachers stall on; you moved 1.1 points").

## Sessions

- R12: A **session ledger** sits between Part 1 and Part 2 as connective tissue.
- R13: Each ledger entry shows: date, session topic, what measurably moved after it, prompt count, and duration.
- R14: The first session is marked as the baseline.
- R15: Older sessions collapse behind a count ("… 3 earlier sessions").

## Part 2 — measurement

- R16: Every artifact is AI-scored against a named rubric. The headline % is the score trend across artifacts.
- R17: Rubric criteria for Lesson Planning: measurable objectives, assessment alignment, differentiation, pacing detail, engagement hooks. Each shown as before → after on a 5-point scale.
- R18: Each rubric section is backed by a **"what changed, concretely"** block of countable trait deltas (e.g. "exit tickets: 1 of 6 → 8 of 8 plans"). No score claim appears without this evidence layer.

## Attribution

- R19: The hero element of Part 2 is a **timeline of artifact quality over time with session markers plotted on it**.
- R20: Before/after means are shown either side of the session marker, with the artifact counts.
- R21: The report **states correlation, not causation**, in plain language — it shows when the session happened and lets the shape speak. No claim that a session caused an improvement.

## Deliberate exclusions

- R22: No student outcome data (quiz scores, engagement, completion). Not available and ethically loaded.
- R23: No peer ranking (see R11.1).
- R24: No artifact upload flow — artifacts are authored in-product (R3).

## Demo persona

- R25: Melissa Turner, Grade 3, Northbrook Elementary. An elementary generalist — her
  artifacts span maths, reading and science rather than a single subject.
- R25.1: Fractions on a number line is the running example unit across prompts and
  artifacts (a real Grade 3 standard, 3.NF.A.2).
- R25.2: Surname, school and subject spread were chosen to fill out the persona; only
  the first name and grade level were specified.

## Open Questions

- [OPEN] Whether the report is shareable/exportable to a principal or PD coordinator. Framing is teacher-only (R4); export was never discussed.
- [OPEN] What a brand-new teacher with zero sessions and zero artifacts sees. Empty state for the whole report is unspecified (R8.1 covers only a single empty skill).
- [OPEN] Mobile treatment. Desktop reading experience assumed; responsive behaviour not discussed.
- [OPEN] Whether the AI buddy is one persistent buddy or a different one per session topic.

## Next Step

→ build the demo page
