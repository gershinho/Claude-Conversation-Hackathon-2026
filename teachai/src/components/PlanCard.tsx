import { Clock, Download, GraduationCap, Target } from 'lucide-react'
import type { LessonPlan } from '@/lib/schemas'

export default function PlanCard({ plan }: { plan: LessonPlan }) {
  const download = () => {
    const blob = new Blob([toMarkdown(plan)], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slug(plan.title)}.md`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="w-full bg-paper rough-border sketch-box-shadow p-6 md:p-10 flex flex-col gap-8">
      <header className="border-b-2 border-dashed border-ink pb-6">
        <p className="font-mono text-xs uppercase tracking-widest opacity-50 mb-2">Your lesson plan</p>
        <h2 className="font-display text-4xl md:text-5xl mb-4 -rotate-1">{plan.title}</h2>
        <div className="flex flex-wrap gap-4 text-sm opacity-70 mb-5">
          <span className="flex items-center gap-1.5">
            <GraduationCap size={16} /> {plan.course}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock size={16} /> {plan.duration_minutes} minutes
          </span>
        </div>
        <div className="flex items-start gap-3 p-4 rough-border-blue">
          <Target size={20} className="text-royal shrink-0 mt-0.5" />
          <p className="text-lg leading-relaxed">{plan.big_idea}</p>
        </div>
      </header>

      <div className="grid md:grid-cols-2 gap-8">
        <Block title="Objectives" items={plan.objectives} />
        <Block title="They come in knowing" items={plan.prior_knowledge} />
      </div>

      <section>
        <h3 className="font-display text-3xl mb-4 -rotate-1">How it runs</h3>
        <div className="flex flex-col gap-4">
          {plan.sequence.map((phase, i) => (
            <div key={i} className="rough-border p-5">
              <div className="flex items-baseline justify-between gap-4 mb-4 pb-3 border-b-2 border-dashed border-ink">
                <h4 className="text-xl font-bold">
                  <span className="font-display text-3xl text-royal mr-2">{i + 1}</span>
                  {phase.phase}
                </h4>
                <span className="font-mono text-sm opacity-60 shrink-0">{phase.minutes} min</span>
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                <div>
                  <p className="font-mono text-xs uppercase tracking-widest opacity-50 mb-2">You</p>
                  <p className="text-base leading-relaxed whitespace-pre-wrap">{phase.teacher_moves}</p>
                </div>
                <div className="md:border-l-2 md:border-dashed md:border-ink md:pl-5">
                  <p className="font-mono text-xs uppercase tracking-widest opacity-50 mb-2">Them</p>
                  <p className="text-base leading-relaxed whitespace-pre-wrap">{phase.student_moves}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="grid md:grid-cols-2 gap-8">
        <Block title="Keeping everyone in the hard math" items={plan.support_moves} />
        <Block title="If they get there early" items={plan.extension_moves} />
        <Block title="Checking as you go" items={plan.formative_checks} />
        <Block title="Materials" items={plan.materials} />
      </div>

      <section className="p-5 rough-border-blue">
        <p className="font-mono text-xs uppercase tracking-widest opacity-50 mb-2">Exit ticket</p>
        <p className="text-base leading-relaxed whitespace-pre-wrap">{plan.exit_ticket}</p>
      </section>

      <section className="border-t-2 border-dashed border-ink pt-6">
        <p className="font-display text-2xl text-royal mb-2 -rotate-1">From your coach</p>
        <p className="text-lg leading-relaxed">{plan.coach_note}</p>
      </section>

      <button
        onClick={download}
        className="self-start px-6 py-4 rough-button font-bold flex items-center gap-2 hover:-translate-y-0.5 transition-transform"
      >
        <Download size={18} /> Download as Markdown
      </button>
    </div>
  )
}

function Block({ title, items }: { title: string; items: string[] }) {
  if (items.length === 0) return null
  return (
    <section>
      <p className="font-mono text-xs uppercase tracking-widest opacity-50 mb-3">{title}</p>
      <ul className="flex flex-col gap-2.5">
        {items.map((item, i) => (
          <li key={i} className="text-base leading-relaxed pl-4 border-l-2 border-royal">
            {item}
          </li>
        ))}
      </ul>
    </section>
  )
}

function slug(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'lesson-plan'
}

function toMarkdown(plan: LessonPlan): string {
  const list = (heading: string, items: string[]) =>
    items.length ? `## ${heading}\n${items.map((i) => `- ${i}`).join('\n')}\n` : ''

  return [
    `# ${plan.title}`,
    `${plan.course} · ${plan.duration_minutes} minutes`,
    ``,
    `**Big idea:** ${plan.big_idea}`,
    ``,
    list('Objectives', plan.objectives),
    list('Prior knowledge', plan.prior_knowledge),
    list('Materials', plan.materials),
    `## How it runs`,
    plan.sequence
      .map(
        (p, i) =>
          `### ${i + 1}. ${p.phase} (${p.minutes} min)\n**You:** ${p.teacher_moves}\n\n**Them:** ${p.student_moves}\n`,
      )
      .join('\n'),
    list('Keeping everyone in the hard math', plan.support_moves),
    list('If they get there early', plan.extension_moves),
    list('Checking as you go', plan.formative_checks),
    `## Exit ticket\n${plan.exit_ticket}\n`,
    `## From your coach\n${plan.coach_note}\n`,
  ].join('\n')
}
