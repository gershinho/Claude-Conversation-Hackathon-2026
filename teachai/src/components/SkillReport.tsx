import { Award, Download, Lightbulb, TrendingUp } from 'lucide-react'
import type { PromptFeedback, RubricItem } from '@/lib/schemas'

export type FeedbackRecord = PromptFeedback & { prompt: string }

/**
 * End-of-session summary, computed purely from the per-turn feedback — the
 * proof that she leveled up, not just the document. Downloads HER final
 * document: the one she prompted into existence, not the hidden target.
 */
export default function SkillReport({
  records,
  rubric,
  doc,
  filename,
}: {
  records: FeedbackRecord[]
  rubric: RubricItem[]
  doc: string
  filename: string
}) {
  const download = () => {
    const blob = new Blob([doc], { type: 'text/markdown' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename.replace(/\.(pdf|txt|md)$/i, '') + '-improved.md'
    a.click()
    URL.revokeObjectURL(url)
  }
  const unique = (values: string[]) => [...new Set(values.filter(Boolean))]

  const used = unique(records.map((r) => r.move_used))
  const coached = unique(records.map((r) => r.coached_move)).filter((m) => !used.includes(m))
  const tips = unique(records.map((r) => r.tip)).slice(0, 3)

  const fixed = rubric.filter((r) => r.satisfied).length
  const worklist = rubric.filter((r) => !r.satisfied)

  const firstPrompt = records[0]
  const bestPrompt =
    [...records].reverse().find((r) => r.quality === 'strong') ?? records[records.length - 1]
  const showTrajectory = Boolean(firstPrompt && bestPrompt && firstPrompt.prompt !== bestPrompt.prompt)

  return (
    <div className="w-full bg-paper rough-border sketch-box-shadow-blue p-6 md:p-8 flex flex-col gap-6">
      <header>
        <p className="font-mono text-xs uppercase tracking-widest opacity-50 mb-2">Your skill report</p>
        <h2 className="font-display text-3xl md:text-4xl -rotate-1">
          The document got better. <span className="text-royal scribble-underline">So did you.</span>
        </h2>
      </header>

      <div className="grid md:grid-cols-2 gap-5">
        {used.length > 0 && (
          <section className="p-4 rough-border">
            <div className="flex items-center gap-2 mb-3 font-bold">
              <Award size={18} className="text-royal" /> Moves you pulled off yourself
            </div>
            <ul className="flex flex-col gap-2">
              {used.map((m, i) => (
                <li key={i} className="text-sm leading-relaxed pl-4 border-l-2 border-royal">
                  {m}
                </li>
              ))}
            </ul>
          </section>
        )}

        {coached.length > 0 && (
          <section className="p-4 rough-border is-dashed">
            <div className="flex items-center gap-2 mb-3 font-bold">
              <Lightbulb size={18} className="text-royal" /> Moves Claw&rsquo;d walked you into
            </div>
            <ul className="flex flex-col gap-2">
              {coached.map((m, i) => (
                <li key={i} className="text-sm leading-relaxed pl-4 border-l-2 border-ink opacity-90">
                  {m}
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>

      {showTrajectory && (
        <section>
          <div className="flex items-center gap-2 mb-3 font-bold">
            <TrendingUp size={18} className="text-royal" /> Your prompting, then vs. now
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="p-4 rough-border is-dashed">
              <p className="font-mono text-xs uppercase tracking-widest opacity-50 mb-2">Where you started</p>
              <p className="text-sm leading-relaxed italic">&ldquo;{firstPrompt.prompt}&rdquo;</p>
            </div>
            <div className="p-4 rough-border-blue">
              <p className="font-mono text-xs uppercase tracking-widest opacity-50 mb-2">Where you got to</p>
              <p className="text-sm leading-relaxed italic">&ldquo;{bestPrompt.prompt}&rdquo;</p>
            </div>
          </div>
        </section>
      )}

      {tips.length > 0 && (
        <section className="border-t-2 border-dashed border-ink pt-4">
          <p className="font-mono text-xs uppercase tracking-widest opacity-50 mb-2">Take these with you</p>
          <ul className="flex flex-col gap-1.5">
            {tips.map((t, i) => (
              <li key={i} className="text-sm leading-relaxed">
                &mdash; {t}
              </li>
            ))}
          </ul>
        </section>
      )}

      {worklist.length > 0 && (
        <section className="border-t-2 border-dashed border-ink pt-4">
          <p className="font-mono text-xs uppercase tracking-widest opacity-50 mb-2">Still on the worklist</p>
          <ul className="flex flex-col gap-1.5">
            {worklist.map((r) => (
              <li key={r.id} className="text-sm leading-relaxed">
                &mdash; {r.title} &middot; try: <span className="italic">{r.move}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="flex flex-wrap items-center justify-between gap-4 border-t-2 border-dashed border-ink pt-5">
        <p className="text-sm opacity-60">
          {fixed} of {rubric.length} weaknesses fixed, by you, with {records.length} prompts. Same moves work
          on next week&rsquo;s lesson &mdash; no Claw&rsquo;d required.
        </p>
        <button
          onClick={download}
          className="px-6 py-4 rough-button-blue font-bold flex items-center gap-2 hover:-translate-y-0.5 transition-transform"
        >
          <Download size={18} /> Download your plan
        </button>
      </div>
    </div>
  )
}
