import { useState } from 'react'
import {
  AlertTriangle,
  Check,
  ChevronDown,
  Copy,
  Hammer,
  Lightbulb,
  Play,
  Sparkles,
  ThumbsUp,
} from 'lucide-react'
import type { Analysis } from '@/lib/schemas'

export type PromptRun = { text: string; running: boolean }

type Props = {
  analysis: Analysis
  runs: Record<number, PromptRun>
  onRunPrompt: (index: number, prompt: string) => void
  onBuildImproved: () => void
  buildingPlan: boolean
  planBuilt: boolean
}

export default function TrainingWorkspace({
  analysis,
  runs,
  onRunPrompt,
  onBuildImproved,
  buildingPlan,
  planBuilt,
}: Props) {
  const [open, setOpen] = useState<number>(0)
  const [copied, setCopied] = useState<number | null>(null)

  const copy = (index: number, text: string) => {
    navigator.clipboard.writeText(text)
    setCopied(index)
    setTimeout(() => setCopied((c) => (c === index ? null : c)), 1600)
  }

  const completed = analysis.modules.filter((_, i) => runs[i]?.text && !runs[i]?.running).length

  return (
    <div className="w-full flex flex-col gap-8">
      {/* ---- Diagnosis ------------------------------------------------- */}
      <section className="p-6 md:p-8 bg-paper rough-border sketch-box-shadow">
        <p className="font-mono text-xs uppercase tracking-widest opacity-50 mb-2">What I read</p>
        <h2 className="font-display text-3xl md:text-4xl mb-1 -rotate-1">{analysis.plan_title}</h2>
        <p className="text-sm opacity-60 mb-5">{analysis.course_and_topic}</p>
        <p className="text-lg leading-relaxed mb-6">{analysis.read_back}</p>

        <div className="border-t-2 border-dashed border-ink pt-5">
          <div className="flex items-center gap-2 mb-3 font-bold">
            <ThumbsUp size={18} className="text-royal" /> Keep doing this
          </div>
          <ul className="flex flex-col gap-2">
            {analysis.strengths.map((s, i) => (
              <li key={i} className="text-base leading-relaxed pl-4 border-l-2 border-royal opacity-90">
                {s}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* ---- Weaknesses ------------------------------------------------ */}
      <section>
        <div className="flex items-center gap-2 mb-4">
          <AlertTriangle size={20} className="text-royal" />
          <h2 className="font-display text-3xl -rotate-1">Where it is actually weak</h2>
        </div>
        <div className="grid gap-4">
          {analysis.weaknesses.map((w, i) => (
            <div key={i} className={`p-5 md:p-6 bg-paper rough-border sketch-box-shadow ${i % 2 === 0 ? 'rotate-[0.4deg]' : '-rotate-[0.4deg]'}`}>
              <div className="flex items-baseline gap-3 mb-3">
                <span className="font-display text-3xl text-royal shrink-0">{i + 1}</span>
                <h3 className="text-xl font-bold">{w.title}</h3>
              </div>
              <p className="font-mono text-xs uppercase tracking-widest opacity-50 mb-1">In your plan</p>
              <p className="text-base leading-relaxed mb-4 pl-4 border-l-2 border-ink opacity-90">{w.evidence}</p>
              <p className="text-base leading-relaxed mb-3">{w.why_it_matters}</p>
              <p className="text-sm leading-relaxed text-royal font-bold">{w.access_impact}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Training session ------------------------------------------ */}
      <section>
        <div className="flex items-center gap-2 mb-2">
          <Sparkles size={20} className="text-royal" />
          <p className="font-mono text-xs uppercase tracking-widest opacity-50">
            Your training session &middot; {completed}/{analysis.modules.length} tried
          </p>
        </div>
        <h2 className="font-display text-4xl md:text-5xl mb-3 -rotate-1">
          <span className="scribble-underline">{analysis.session_title}</span>
        </h2>
        <p className="text-lg leading-relaxed opacity-80 mb-6 max-w-3xl">{analysis.session_goal}</p>

        <div className="flex flex-col gap-4">
          {analysis.modules.map((m, i) => {
            const isOpen = open === i
            const run = runs[i]
            const done = Boolean(run?.text) && !run?.running

            return (
              <div key={i} className="bg-paper rough-border sketch-box-shadow-blue overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? -1 : i)}
                  className="w-full flex items-center gap-4 p-5 md:p-6 text-left hover:bg-royal/5 transition-colors"
                >
                  <span
                    className={`shrink-0 w-10 h-10 flex items-center justify-center rough-border-blue font-bold ${
                      done ? 'bg-royal text-paper' : 'text-royal'
                    }`}
                  >
                    {done ? <Check size={20} /> : i + 1}
                  </span>
                  <span className="flex-grow">
                    <span className="block text-lg md:text-xl font-bold">{m.title}</span>
                    <span className="block text-sm opacity-60 mt-1">Fixes: {m.targets_weakness}</span>
                  </span>
                  <ChevronDown
                    size={22}
                    className={`shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                  />
                </button>

                {isOpen && (
                  <div className="px-5 md:px-6 pb-6 flex flex-col gap-5 animate-in fade-in slide-in-from-top-2 duration-300">
                    <div className="border-t-2 border-dashed border-ink pt-5">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 rough-border-blue text-royal text-sm font-bold mb-3">
                        <Lightbulb size={15} /> {m.prompting_move}
                      </div>
                      <p className="text-base leading-relaxed opacity-90">{m.why}</p>
                    </div>

                    <div>
                      <p className="font-mono text-xs uppercase tracking-widest opacity-50 mb-2">
                        Your prompt &mdash; already filled in for this lesson
                      </p>
                      <div className="p-4 md:p-5 bg-ink text-paper font-mono text-sm leading-relaxed whitespace-pre-wrap rough-border">
                        {m.prompt}
                      </div>
                      <div className="flex flex-wrap gap-3 mt-3">
                        <button
                          onClick={() => copy(i, m.prompt)}
                          className="px-4 py-2.5 rough-button font-bold text-sm flex items-center gap-2"
                        >
                          {copied === i ? <Check size={16} /> : <Copy size={16} />}
                          {copied === i ? 'Copied' : 'Copy prompt'}
                        </button>
                        <button
                          onClick={() => onRunPrompt(i, m.prompt)}
                          disabled={run?.running}
                          className="px-4 py-2.5 rough-button-blue font-bold text-sm flex items-center gap-2 disabled:opacity-50"
                        >
                          <Play size={16} />
                          {run?.running ? 'Running...' : done ? 'Run again' : 'Run it here'}
                        </button>
                      </div>
                    </div>

                    {run && (
                      <div>
                        <p className="font-mono text-xs uppercase tracking-widest opacity-50 mb-2">
                          What that prompt gets you
                        </p>
                        <div className="p-4 md:p-5 rough-border bg-paper text-base leading-relaxed whitespace-pre-wrap">
                          {run.text}
                          {run.running && <span className="inline-block w-2 h-5 bg-royal align-middle ml-0.5 animate-pulse" />}
                        </div>
                      </div>
                    )}

                    <div className="grid md:grid-cols-2 gap-4">
                      <div className="p-4 rough-border is-dashed">
                        <p className="font-mono text-xs uppercase tracking-widest opacity-50 mb-2">
                          A good answer looks like
                        </p>
                        <p className="text-sm leading-relaxed">{m.what_good_looks_like}</p>
                      </div>
                      <div className="p-4 rough-border is-dashed">
                        <p className="font-mono text-xs uppercase tracking-widest opacity-50 mb-2">
                          If it comes back generic, send
                        </p>
                        <p className="text-sm leading-relaxed italic">&ldquo;{m.push_back_with}&rdquo;</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* ---- Payoff ----------------------------------------------------- */}
      {!planBuilt && (
        <div className="flex flex-col items-center text-center gap-4 py-4">
          <p className="text-lg opacity-70 max-w-xl leading-relaxed">
            When you have worked the moves you want, put them all together and see your lesson rebuilt.
          </p>
          <button
            onClick={onBuildImproved}
            disabled={buildingPlan}
            className="px-8 py-5 rough-button-blue font-bold text-lg flex items-center gap-3 sketch-box-shadow-blue hover:-translate-y-1 hover:shadow-none transition-all disabled:opacity-60"
          >
            <Hammer size={22} />
            {buildingPlan ? 'Rebuilding your lesson...' : 'Rebuild my lesson with all of this'}
          </button>
        </div>
      )}
    </div>
  )
}
