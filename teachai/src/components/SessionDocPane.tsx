import { useEffect, useMemo, useRef } from 'react'
import { Check, FileText, Flag, Minimize2 } from 'lucide-react'
import { diffLines } from '@/lib/diff'
import { renderMarkdownLine } from '@/lib/markdown'
import type { RubricItem } from '@/lib/schemas'

/**
 * The live document — takes DocViewer's pane slot during the session, but
 * renders her actual plan as a readable paper page instead of the grey-bar
 * placeholder. Blocks a prompt just changed flash and the earliest one is
 * scrolled to and tagged as the buddy's pointing target.
 */
export default function SessionDocPane({
  filename,
  doc,
  prevDoc,
  version,
  rubric,
  canWrapUp,
  onWrapUp,
  onMinimize,
}: {
  filename: string
  doc: string
  prevDoc: string | null
  version: number
  rubric: RubricItem[]
  canWrapUp: boolean
  onWrapUp: () => void
  onMinimize: () => void
}) {
  const blocks = useMemo(() => diffLines(prevDoc ?? doc, doc), [doc, prevDoc])
  const firstChangeRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (version > 0) {
      firstChangeRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [version])

  const satisfied = rubric.filter((r) => r.satisfied).length
  let firstChangeMarked = false

  return (
    <div className="h-full w-3/5 bg-ink text-paper hidden md:flex flex-col shrink-0">
      <div className="p-4 border-b-2 border-paper flex items-center justify-between gap-4 shrink-0">
        <div className="font-bold flex items-center gap-2 min-w-0">
          <FileText size={18} className="shrink-0" />
          <span className="truncate">{filename}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0" data-buddy-anchor="progress">
          <span className="font-mono text-xs uppercase tracking-widest opacity-70">
            {satisfied}/{rubric.length}
          </span>
          <div className="w-28 h-3 rough-border-blue bg-paper/10 overflow-hidden">
            <div
              className="h-full bg-royal transition-all duration-700"
              style={{ width: `${rubric.length ? (satisfied / rubric.length) * 100 : 0}%` }}
            />
          </div>
        </div>
        {canWrapUp && (
          <button
            onClick={onWrapUp}
            className="px-3 py-1.5 bg-royal text-paper text-xs font-bold flex items-center gap-1.5 rough-border-blue hover:-translate-y-0.5 transition-transform shrink-0"
            title="Finish here — download your plan and see your skill report"
          >
            <Flag size={12} /> Wrap up
          </button>
        )}
        <button
          onClick={onMinimize}
          className="hover:text-royal transition-colors bg-paper text-ink p-1 rounded shrink-0"
          title="Minimize document"
        >
          <Minimize2 size={18} />
        </button>
      </div>

      <div className="px-4 py-2 border-b-2 border-dashed border-paper/40 flex gap-2 overflow-x-auto shrink-0">
        {rubric.map((r) => (
          <span
            key={r.id}
            className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-bold whitespace-nowrap rough-border-blue transition-colors ${
              r.satisfied ? 'bg-royal text-paper' : 'text-paper/70'
            }`}
            title={`Move: ${r.move}`}
          >
            {r.satisfied ? <Check size={12} /> : <span className="w-3 text-center">○</span>}
            {r.title}
          </span>
        ))}
      </div>

      <div className="flex-grow overflow-y-auto p-4 md:p-6" data-buddy-anchor="center-stage">
        <div className="bg-paper text-ink rough-border p-6 md:p-8 font-sans text-sm max-w-2xl mx-auto">
          {blocks.map((block, i) => {
            const changed = block.type !== 'same'
            const isFirst = changed && !firstChangeMarked
            if (isFirst) firstChangeMarked = true
            return (
              <div
                key={`${version}-${i}`}
                ref={isFirst ? firstChangeRef : undefined}
                data-buddy-anchor={isFirst ? 'doc-change' : undefined}
                className={
                  block.type === 'added' ? 'flash-added' : block.type === 'changed' ? 'flash-changed' : undefined
                }
              >
                {block.lines.map((line, j) => renderMarkdownLine(line, j))}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
