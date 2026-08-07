import { File, FileText, Maximize2, Minimize2 } from "lucide-react"

/**
 * Ported from the eshaanfrontend branch (ba3f735), markup unchanged.
 *
 * This is a placeholder: the grey bars are decorative and the file is never
 * read. It shows the filename only. Swap the block below for an <iframe> on a
 * blob URL when it should display the real document.
 *
 * One deviation from the branch: the pane is `hidden md:flex`, so narrow
 * screens keep the single-column transcript instead of a 40% column.
 */
export function DocViewer({
  filename,
  onMinimize,
}: {
  filename: string
  onMinimize: () => void
}) {
  return (
    <div className="h-full w-3/5 bg-ink text-paper hidden md:flex flex-col shrink-0">
      <div className="p-4 border-b-2 border-paper flex items-center justify-between shrink-0">
        <div className="font-bold flex items-center gap-2">
          <FileText size={18} /> Document Viewer
        </div>
        <button
          onClick={onMinimize}
          className="hover:text-royal transition-colors bg-paper text-ink p-1 rounded"
          title="Minimize document"
        >
          <Minimize2 size={18} />
        </button>
      </div>

      <div className="flex-grow p-4 md:p-8 overflow-y-auto flex flex-col items-center justify-center opacity-70">
        <File size={64} className="mb-6 opacity-50" />
        <p className="font-mono text-center mb-2 uppercase tracking-widest text-sm">
          Now Viewing
        </p>
        <p className="font-bold text-center text-2xl text-royal font-display rotate-1 mb-8">
          {filename}
        </p>

        {/* Fake PDF Content Placeholder */}
        <div className="w-full max-w-sm mt-4 p-8 bg-paper text-ink bg-opacity-10 rough-border border-paper flex flex-col gap-6 shadow-2xl">
          <div className="w-1/2 h-8 bg-paper bg-opacity-20 mb-4"></div>
          <div className="w-full h-4 bg-paper bg-opacity-20"></div>
          <div className="w-full h-4 bg-paper bg-opacity-20"></div>
          <div className="w-full h-4 bg-paper bg-opacity-20"></div>
          <div className="w-5/6 h-4 bg-paper bg-opacity-20"></div>

          <div className="w-3/4 h-6 bg-paper bg-opacity-20 mt-4 mb-2"></div>
          <div className="w-full h-4 bg-paper bg-opacity-20"></div>
          <div className="w-11/12 h-4 bg-paper bg-opacity-20"></div>
        </div>
      </div>
    </div>
  )
}

export function DocViewerTab({ onRestore }: { onRestore: () => void }) {
  return (
    <button
      onClick={onRestore}
      className="absolute top-1/2 right-0 -translate-y-1/2 bg-ink text-paper py-6 px-3 hover:text-royal transition-colors border-y-2 border-l-2 border-paper z-50 hidden md:flex flex-col items-center gap-3 font-bold shadow-lg"
    >
      <Maximize2 size={18} />
      <span
        style={{ writingMode: "vertical-rl" }}
        className="rotate-180 tracking-widest"
      >
        VIEW DOC
      </span>
    </button>
  )
}
