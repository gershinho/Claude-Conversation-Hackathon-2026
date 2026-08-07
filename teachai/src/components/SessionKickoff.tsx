import { AlertTriangle, ArrowRight, RotateCcw, ThumbsUp } from 'lucide-react'
import type { Analysis } from '@/lib/schemas'

/**
 * Post-analysis briefing: the diagnosis as a worklist, and the door into the
 * guided session. The Start button stays disabled while the hidden target
 * plan builds in the background — reading this is what hides that latency.
 */
export default function SessionKickoff({
  analysis,
  targetReady,
  targetFailed,
  onStart,
  onRetry,
}: {
  analysis: Analysis
  targetReady: boolean
  targetFailed: boolean
  onStart: () => void
  onRetry: () => void
}) {
  return (
    <div className="w-full bg-paper rough-border sketch-box-shadow p-6 md:p-8 flex flex-col gap-6">
      <header>
        <p className="font-mono text-xs uppercase tracking-widest opacity-50 mb-2">What I read</p>
        <h2 className="font-display text-3xl md:text-4xl mb-1 -rotate-1">{analysis.plan_title}</h2>
        <p className="text-sm opacity-60 mb-4">{analysis.course_and_topic}</p>
        <p className="text-lg leading-relaxed">{analysis.read_back}</p>
      </header>

      <section className="border-t-2 border-dashed border-ink pt-5">
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
      </section>

      <section className="border-t-2 border-dashed border-ink pt-5">
        <div className="flex items-center gap-2 mb-3 font-bold">
          <AlertTriangle size={18} className="text-royal" /> Our worklist
        </div>
        <div className="flex flex-col gap-3">
          {analysis.weaknesses.map((w, i) => (
            <div key={i} className="p-4 rough-border is-dashed">
              <p className="font-bold mb-1">
                <span className="font-display text-2xl text-royal mr-2">{i + 1}</span>
                {w.title}
              </p>
              <p className="text-sm leading-relaxed opacity-80 pl-4 border-l-2 border-ink">{w.evidence}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="border-t-2 border-dashed border-ink pt-5 flex flex-col items-center text-center gap-4">
        <h3 className="font-display text-3xl md:text-4xl -rotate-1">
          <span className="scribble-underline">{analysis.session_title}</span>
        </h3>
        <p className="text-base leading-relaxed opacity-80 max-w-xl">
          {analysis.session_goal} You will prompt the changes yourself — your document, live on the right — and
          Claw&rsquo;d, my teaching assistant, will work the room with you.
        </p>

        {targetFailed ? (
          <div className="flex flex-col items-center gap-3">
            <p className="text-royal font-bold">I could not finish preparing your session. One more try?</p>
            <button onClick={onRetry} className="px-6 py-3 rough-button font-bold flex items-center gap-2">
              <RotateCcw size={16} /> Retry
            </button>
          </div>
        ) : (
          <button
            onClick={onStart}
            disabled={!targetReady}
            className="px-8 py-5 rough-button-blue font-bold text-lg flex items-center gap-3 sketch-box-shadow-blue hover:-translate-y-1 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {targetReady ? (
              <>
                Start my session <ArrowRight size={20} />
              </>
            ) : (
              <>
                <span className="flex gap-1.5">
                  <span className="w-2 h-2 bg-paper rounded-full animate-bounce [animation-delay:-0.3s]" />
                  <span className="w-2 h-2 bg-paper rounded-full animate-bounce [animation-delay:-0.15s]" />
                  <span className="w-2 h-2 bg-paper rounded-full animate-bounce" />
                </span>
                Claw&rsquo;d is studying your plan...
              </>
            )}
          </button>
        )}
      </section>
    </div>
  )
}
