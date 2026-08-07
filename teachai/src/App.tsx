import { useEffect, useRef, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  FileText,
  Paperclip,
  RotateCcw,
  Send,
  Sparkles,
  X,
} from 'lucide-react'
import LoginGate from '@/components/LoginGate'
import { DocViewer, DocViewerTab } from '@/components/DocViewer'
import TrainingWorkspace, { type PromptRun } from '@/components/TrainingWorkspace'
import IntakePanel from '@/components/IntakePanel'
import PlanCard from '@/components/PlanCard'
import {
  analyzeLessonPlan,
  buildImprovedPlan,
  buildPlanFromIntake,
  friendlyError,
  generateIntake,
  runTrainingPrompt,
  streamCoach,
  type ChatTurn,
  type PlanSource,
} from '@/lib/claude'
import { readPlanFile } from '@/lib/file'
import type { Analysis, Intake, LessonPlan } from '@/lib/schemas'

type Phase =
  | 'landing'
  | 'coaching'
  | 'choosing'
  | 'awaiting_plan'
  | 'analyzing'
  | 'training'
  | 'intake'
  | 'building'
  | 'done'

type Item =
  | { id: number; kind: 'user'; text: string; attachment?: string }
  | { id: number; kind: 'coach'; text: string; streaming: boolean }
  | { id: number; kind: 'choice'; answered: 'yes' | 'no' | null }
  | { id: number; kind: 'working'; label: string }
  | { id: number; kind: 'error'; text: string }
  | { id: number; kind: 'analysis' }
  | { id: number; kind: 'intake' }
  | { id: number; kind: 'plan' }

type NewItem = Item extends infer T ? (T extends Item ? Omit<T, 'id'> : never) : never

// These take about a minute, so the labels walk forward once and hold on the
// last one — a looping ticker reads as stuck.
const ANALYZING_STEPS = [
  'Reading your lesson plan...',
  'Finding where the thinking actually happens...',
  'Checking which scaffolds quietly remove the math...',
  'Looking at who this reaches and who it loses...',
  'Choosing the prompting moves to teach you...',
  'Writing your prompts, filled in for this lesson...',
  'Almost there...',
]

const BUILDING_STEPS = [
  'Putting the moves together...',
  'Settling on the big idea...',
  'Writing the questions you will ask...',
  'Building scaffolds that keep the demand high...',
  'Timing the phases...',
  'Writing the exit ticket...',
  'Almost there...',
]

export default function App() {
  const [signedIn, setSignedIn] = useState(false)
  const [phase, setPhase] = useState<Phase>('landing')
  // Name of the plan she attached, kept so the document pane has something to
  // show after `attachment` is cleared on submit.
  const [docName, setDocName] = useState<string | null>(null)
  const [docMinimized, setDocMinimized] = useState(false)
  const [items, setItems] = useState<Item[]>([])
  const [turns, setTurns] = useState<ChatTurn[]>([])

  const [input, setInput] = useState('')
  const [attachment, setAttachment] = useState<{ name: string; source: PlanSource } | null>(null)

  const [analysis, setAnalysis] = useState<Analysis | null>(null)
  const [runs, setRuns] = useState<Record<number, PromptRun>>({})
  const [intake, setIntake] = useState<Intake | null>(null)
  const [plan, setPlan] = useState<LessonPlan | null>(null)

  const nextId = useRef(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const busy = phase === 'analyzing' || phase === 'building' || items.some((i) => i.kind === 'working')
  const streaming = items.some((i) => i.kind === 'coach' && i.streaming)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [items, analysis, intake, plan])

  // -- transcript helpers ---------------------------------------------------

  // Omit/Partial over a union collapse to the shared keys, so distribute first.
  const add = (item: NewItem) => {
    const id = nextId.current++
    setItems((prev) => [...prev, { ...item, id } as Item])
    return id
  }

  const patch = (id: number, update: Record<string, unknown>) => {
    setItems((prev) => prev.map((i) => (i.id === id ? ({ ...i, ...update } as Item) : i)))
  }

  const drop = (id: number) => setItems((prev) => prev.filter((i) => i.id !== id))

  /** Walks a working item through its labels, holding on the last one. */
  const advance = (id: number, steps: string[]) => {
    let step = 0
    return setInterval(() => {
      if (step >= steps.length - 1) return
      step += 1
      patch(id, { label: steps[step] })
    }, 9000)
  }

  const fail = (err: unknown) => {
    add({ kind: 'error', text: friendlyError(err) })
  }

  // -- the coach turn -------------------------------------------------------

  const sendToCoach = async (text: string, firstTurn: boolean) => {
    const history: ChatTurn[] = [...turns, { role: 'user', content: text }]
    setTurns(history)

    const coachId = add({ kind: 'coach', text: '', streaming: true })

    try {
      const full = await streamCoach(history, { firstTurn }, (delta) => {
        setItems((prev) =>
          prev.map((i) => (i.id === coachId && i.kind === 'coach' ? { ...i, text: i.text + delta } : i)),
        )
      })
      patch(coachId, { text: full, streaming: false })
      setTurns([...history, { role: 'assistant', content: full }])
      return true
    } catch (err) {
      drop(coachId)
      fail(err)
      return false
    }
  }

  // -- composer -------------------------------------------------------------

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (busy || streaming) return

    // The lesson plan hand-off: an attachment is the message.
    if (phase === 'awaiting_plan') {
      if (!attachment) return
      const note = input.trim()
      setInput('')
      const source = attachment.source
      add({ kind: 'user', text: note, attachment: attachment.name })
      setDocName(attachment.name)
      setDocMinimized(false)
      setAttachment(null)
      await analyze(source)
      return
    }

    const text = input.trim()
    if (!text) return
    setInput('')
    add({ kind: 'user', text })

    if (phase === 'landing') {
      setPhase('coaching')
      const ok = await sendToCoach(text, true)
      if (ok) {
        add({ kind: 'choice', answered: null })
        setPhase('choosing')
      } else {
        setPhase('landing')
      }
      return
    }

    await sendToCoach(text, false)
  }

  // -- yes / no -------------------------------------------------------------

  const answerChoice = async (choiceId: number, answer: 'yes' | 'no') => {
    patch(choiceId, { answered: answer })

    if (answer === 'yes') {
      add({ kind: 'user', text: 'Yes, I have one.' })
      setTurns((t) => [...t, { role: 'user', content: 'Yes, I have a sample lesson plan.' }])
      add({
        kind: 'coach',
        text: 'Good. Attach it below and hit enter. I want to read the real thing, not a description of it.',
        streaming: false,
      })
      setPhase('awaiting_plan')
      return
    }

    add({ kind: 'user', text: "No, I don't have one to share." })
    setPhase('intake')
    const workingId = add({ kind: 'working', label: 'Thinking about what I need to ask you...' })

    try {
      const result = await generateIntake(turns)
      drop(workingId)
      setIntake(result)
      add({ kind: 'intake' })
    } catch (err) {
      drop(workingId)
      fail(err)
      setPhase('choosing')
    }
  }

  // -- path A: analyze an uploaded plan -------------------------------------

  const analyze = async (source: PlanSource) => {
    setPhase('analyzing')
    const workingId = add({ kind: 'working', label: ANALYZING_STEPS[0] })

    const ticker = advance(workingId, ANALYZING_STEPS)

    try {
      const result = await analyzeLessonPlan(source)
      setAnalysis(result)
      add({ kind: 'analysis' })
      setPhase('training')
    } catch (err) {
      fail(err)
      setPhase('awaiting_plan')
    } finally {
      clearInterval(ticker)
      drop(workingId)
    }
  }

  const handleRunPrompt = async (index: number, prompt: string) => {
    setRuns((r) => ({ ...r, [index]: { text: '', running: true } }))
    try {
      const full = await runTrainingPrompt(prompt, (delta) => {
        setRuns((r) => ({ ...r, [index]: { text: (r[index]?.text ?? '') + delta, running: true } }))
      })
      setRuns((r) => ({ ...r, [index]: { text: full, running: false } }))
    } catch (err) {
      setRuns((r) => {
        const next = { ...r }
        delete next[index]
        return next
      })
      fail(err)
    }
  }

  const handleBuildImproved = async () => {
    if (!analysis) return
    setPhase('building')
    const workingId = add({ kind: 'working', label: BUILDING_STEPS[0] })

    const ticker = advance(workingId, BUILDING_STEPS)

    try {
      const result = await buildImprovedPlan(analysis)
      setPlan(result)
      add({ kind: 'plan' })
      setPhase('done')
    } catch (err) {
      fail(err)
      setPhase('training')
    } finally {
      clearInterval(ticker)
      drop(workingId)
    }
  }

  // -- path B: build from intake answers ------------------------------------

  const handleIntakeSubmit = async (answers: Record<string, string>) => {
    if (!intake) return
    setPhase('building')
    const workingId = add({ kind: 'working', label: BUILDING_STEPS[0] })

    const ticker = advance(workingId, BUILDING_STEPS)

    try {
      const result = await buildPlanFromIntake(intake, answers)
      setPlan(result)
      add({ kind: 'plan' })
      setPhase('done')
    } catch (err) {
      fail(err)
      setPhase('intake')
    } finally {
      clearInterval(ticker)
      drop(workingId)
    }
  }

  // -- attachments ----------------------------------------------------------

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    try {
      const source = await readPlanFile(file)
      setAttachment({ name: file.name, source })
    } catch (err) {
      fail(err)
    }
  }

  const restart = () => {
    setPhase('landing')
    setDocName(null)
    setDocMinimized(false)
    setItems([])
    setTurns([])
    setInput('')
    setAttachment(null)
    setAnalysis(null)
    setRuns({})
    setIntake(null)
    setPlan(null)
  }

  if (!signedIn) return <LoginGate onSignIn={() => setSignedIn(true)} />

  // -------------------------------------------------------------------------
  // Landing
  // -------------------------------------------------------------------------

  if (phase === 'landing' && items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-paper text-ink font-sans selection:bg-royal selection:text-paper relative">
        <div className="absolute top-12 left-12 text-royal opacity-20 -rotate-12 pointer-events-none">
          <Sparkles size={48} strokeWidth={1} />
        </div>
        <div className="absolute bottom-56 right-16 text-ink opacity-10 rotate-12 pointer-events-none">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M10 50 C 30 10, 70 10, 90 50 C 70 90, 30 90, 10 50"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </div>

        <main className="flex-grow flex flex-col items-center justify-center px-4 md:px-8 pb-40">
          <div className="max-w-4xl w-full text-center z-10">
            <p className="font-mono text-xs uppercase tracking-widest opacity-40 mb-8">
              TeachAI &middot; your lesson planning coach
            </p>
            <h1 className="text-5xl md:text-7xl lg:text-8xl font-display text-ink mb-10 -rotate-2 leading-[0.95]">
              how can i help you <span className="text-royal scribble-underline">Melissa?</span>
            </h1>
            <p className="text-lg md:text-xl opacity-70 leading-relaxed max-w-2xl mx-auto">
              Tell me what you are working on and I will teach you how to plan it with AI &mdash; so you can do it again
              next week without me.
            </p>
          </div>
        </main>

        <Composer
          value={input}
          onChange={setInput}
          onSubmit={handleSubmit}
          placeholder="I'm teaching rational functions on Thursday and it fell flat last year..."
          disabled={streaming}
          allowAttach={false}
          attachment={attachment}
          onAttachClick={() => fileInputRef.current?.click()}
          onClearAttachment={() => setAttachment(null)}
          autoFocus
        />
        <input type="file" ref={fileInputRef} onChange={handleFile} className="hidden" />
      </div>
    )
  }

  // -------------------------------------------------------------------------
  // Session
  // -------------------------------------------------------------------------

  const canType = !busy && !streaming
  const docOpen = Boolean(docName) && !docMinimized
  const placeholder =
    phase === 'awaiting_plan'
      ? attachment
        ? 'Add a note if you want, then hit enter'
        : 'Attach your lesson plan with the clip, or paste it here'
      : phase === 'training'
        ? 'Ask me anything about these moves...'
        : phase === 'done'
          ? 'What else do you want to work on?'
          : 'Say more...'

  return (
    <div className="h-screen overflow-hidden flex flex-col bg-paper text-ink font-sans selection:bg-royal selection:text-paper">
      <header className="sticky top-0 z-40 bg-paper border-b-2 border-dashed border-ink px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Sparkles size={20} className="text-royal" />
          <span className="font-display text-2xl -rotate-1">TeachAI</span>
          <span className="hidden sm:inline text-sm opacity-50">coaching Melissa &middot; Precalculus</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={restart}
            className="px-3 py-2 text-sm font-bold flex items-center gap-2 hover:text-royal transition-colors"
          >
            <RotateCcw size={16} /> <span className="hidden sm:inline">Start over</span>
          </button>
        </div>
      </header>

      <div className="flex flex-grow overflow-hidden relative">
        <div
          className={`flex flex-col h-full relative shrink-0 ${
            docOpen ? 'w-full md:w-2/5 md:border-r-2 md:border-ink md:border-dashed' : 'w-full'
          }`}
        >
      <main className="flex-grow overflow-y-auto px-4 md:px-8 pt-8 pb-56 scroll-smooth">
        <div className={`${docOpen ? '' : 'max-w-4xl mx-auto'} flex flex-col gap-6`}>
          {items.map((item) => {
            switch (item.kind) {
              case 'user':
                return (
                  <div key={item.id} className="flex justify-end">
                    <div className="max-w-[85%] md:max-w-[75%] flex flex-col items-end gap-2 animate-in fade-in slide-in-from-bottom-2 duration-300">
                      {item.attachment && (
                        <div className="px-3 py-2 bg-ink text-paper text-sm font-mono flex items-center gap-2 rough-border">
                          <FileText size={14} /> {item.attachment}
                        </div>
                      )}
                      {item.text && (
                        <div className="p-5 bg-royal text-paper rough-border-blue leading-relaxed text-lg">
                          {item.text}
                        </div>
                      )}
                    </div>
                  </div>
                )

              case 'coach':
                return (
                  <div key={item.id} className="flex justify-start">
                    <div className="max-w-[85%] md:max-w-[75%] p-5 md:p-6 bg-paper rough-border sketch-box-shadow leading-relaxed text-lg whitespace-pre-wrap animate-in fade-in slide-in-from-bottom-2 duration-300">
                      {item.text}
                      {item.streaming && (
                        <span className="inline-block w-2 h-5 bg-royal align-middle ml-0.5 animate-pulse" />
                      )}
                    </div>
                  </div>
                )

              case 'choice':
                return (
                  <div key={item.id} className="flex flex-wrap gap-3 pl-1 animate-in fade-in duration-500">
                    <button
                      onClick={() => answerChoice(item.id, 'yes')}
                      disabled={item.answered !== null || busy}
                      className={`px-6 py-4 font-bold flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                        item.answered === 'yes' ? 'bg-royal text-paper rough-border-blue' : 'rough-button-blue sketch-box-shadow-blue hover:-translate-y-1 hover:shadow-none'
                      }`}
                    >
                      Yes, I have one <ArrowRight size={18} />
                    </button>
                    <button
                      onClick={() => answerChoice(item.id, 'no')}
                      disabled={item.answered !== null || busy}
                      className={`px-6 py-4 font-bold flex items-center gap-2 transition-all disabled:opacity-40 disabled:cursor-not-allowed ${
                        item.answered === 'no' ? 'bg-ink text-paper rough-border' : 'rough-button sketch-box-shadow hover:-translate-y-1 hover:shadow-none'
                      }`}
                    >
                      No, not right now
                    </button>
                  </div>
                )

              case 'working':
                return (
                  <div key={item.id} className="flex justify-start animate-in fade-in duration-300">
                    <div className="p-5 md:p-6 bg-paper rough-border sketch-box-shadow flex items-center gap-4">
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 bg-royal rounded-full animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-2 h-2 bg-royal rounded-full animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-2 h-2 bg-royal rounded-full animate-bounce" />
                      </div>
                      <span className="text-lg opacity-70">{item.label}</span>
                      <Elapsed />
                    </div>
                  </div>
                )

              case 'error':
                return (
                  <div
                    key={item.id}
                    className="flex items-start gap-3 p-5 rough-border is-royal bg-royal/5 animate-in fade-in duration-300"
                  >
                    <AlertCircle size={20} className="text-royal shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{item.text}</p>
                  </div>
                )

              case 'analysis':
                return analysis ? (
                  <div key={item.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <TrainingWorkspace
                      analysis={analysis}
                      runs={runs}
                      onRunPrompt={handleRunPrompt}
                      onBuildImproved={handleBuildImproved}
                      buildingPlan={phase === 'building'}
                      planBuilt={Boolean(plan)}
                    />
                  </div>
                ) : null

              case 'intake':
                return intake ? (
                  <div key={item.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <IntakePanel
                      intake={intake}
                      onSubmit={handleIntakeSubmit}
                      submitting={phase === 'building'}
                      locked={Boolean(plan)}
                    />
                  </div>
                ) : null

              case 'plan':
                return plan ? (
                  <div key={item.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <PlanCard plan={plan} />
                  </div>
                ) : null
            }
          })}
          <div ref={bottomRef} className="h-2" />
        </div>
      </main>

      {phase === 'awaiting_plan' && !attachment && (
        <div className="absolute bottom-32 left-0 w-full px-4 md:px-8 z-40 pointer-events-none">
          <div className="max-w-4xl mx-auto">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="pointer-events-auto w-full p-6 rough-border is-dashed is-royal text-royal bg-paper flex items-center justify-center gap-3 font-bold hover:bg-royal/5 transition-colors"
            >
              <Paperclip size={20} /> Attach your lesson plan &mdash; PDF or plain text
            </button>
          </div>
        </div>
      )}

      <Composer
        value={input}
        onChange={setInput}
        onSubmit={handleSubmit}
        placeholder={placeholder}
        disabled={!canType}
        allowAttach={phase === 'awaiting_plan'}
        attachment={attachment}
        onAttachClick={() => fileInputRef.current?.click()}
        onClearAttachment={() => setAttachment(null)}
      />
        </div>

        {docName && !docMinimized && (
          <DocViewer filename={docName} onMinimize={() => setDocMinimized(true)} />
        )}
        {docName && docMinimized && <DocViewerTab onRestore={() => setDocMinimized(false)} />}
      </div>

      <input type="file" ref={fileInputRef} onChange={handleFile} className="hidden" />
    </div>
  )
}

// ---------------------------------------------------------------------------

type ComposerProps = {
  value: string
  onChange: (value: string) => void
  onSubmit: (e: React.FormEvent) => void
  placeholder: string
  disabled: boolean
  allowAttach: boolean
  attachment: { name: string } | null
  onAttachClick: () => void
  onClearAttachment: () => void
  autoFocus?: boolean
}

function Composer({
  value,
  onChange,
  onSubmit,
  placeholder,
  disabled,
  allowAttach,
  attachment,
  onAttachClick,
  onClearAttachment,
  autoFocus,
}: ComposerProps) {
  const canSend = !disabled && (value.trim().length > 0 || Boolean(attachment))

  return (
    <div className="absolute bottom-0 left-0 w-full p-4 md:p-8 bg-gradient-to-t from-paper via-paper to-transparent z-50">
      <div className="max-w-4xl mx-auto flex flex-col gap-2">
        {attachment && (
          <div className="flex animate-in fade-in slide-in-from-bottom-2 duration-300">
            <div className="px-3 py-2 bg-ink text-paper text-sm font-mono flex items-center gap-2 rough-border">
              <FileText size={14} /> {attachment.name}
              <button onClick={onClearAttachment} className="ml-1 opacity-70 hover:opacity-100">
                <X size={14} />
              </button>
            </div>
          </div>
        )}

        <form
          onSubmit={onSubmit}
          className="flex gap-2 p-2 bg-paper rough-border sketch-box-shadow-blue items-center focus-within:-translate-y-1 focus-within:-translate-x-1 focus-within:shadow-none transition-transform"
        >
          {allowAttach && (
            <button
              type="button"
              onClick={onAttachClick}
              className="p-4 text-ink hover:text-royal transition-colors shrink-0"
              title="Attach a lesson plan"
            >
              <Paperclip size={22} />
            </button>
          )}
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            disabled={disabled}
            autoFocus={autoFocus}
            className="flex-grow bg-transparent outline-none p-4 font-sans text-base md:text-lg placeholder-ink placeholder-opacity-40 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!canSend}
            className="p-4 md:px-8 rough-button-blue font-bold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <span className="hidden sm:inline">Send</span>
            <Send size={20} className="sm:ml-2" />
          </button>
        </form>
      </div>
    </div>
  )
}

/** Counts up during the long structured-output calls so the wait looks alive. */
function Elapsed() {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const timer = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(timer)
  }, [])

  if (seconds < 5) return null
  return <span className="font-mono text-sm opacity-40 tabular-nums">{seconds}s</span>
}
