import { MessageCircleQuestion, Wand2 } from 'lucide-react'
import type { IntakeStep } from '@/lib/schemas'

type Props = {
  step: IntakeStep
  answered: string | null
  onAnswer: (answer: string) => void
  onSkip: () => void
  disabled: boolean
}

/**
 * One adaptive intake question, rendered inline in the transcript. She can tap
 * a chip, type in the main composer, or bail out and let the coach build with
 * what it has.
 */
export default function AskCard({ step, answered, onAnswer, onSkip, disabled }: Props) {
  const locked = disabled || answered !== null

  return (
    <div className="flex justify-start">
      <div className="max-w-[85%] md:max-w-[75%] w-full p-5 md:p-6 bg-paper rough-border sketch-box-shadow-blue animate-in fade-in slide-in-from-bottom-2 duration-300">
        <div className="flex items-center gap-2 mb-3 text-royal">
          <MessageCircleQuestion size={18} />
          <p className="font-mono text-xs uppercase tracking-widest opacity-70">Quick one</p>
        </div>

        {step.coach_line && <p className="leading-relaxed mb-3">{step.coach_line}</p>}
        <h3 className="text-lg md:text-xl font-bold mb-1">{step.question}</h3>
        {step.why && <p className="text-sm opacity-60 mb-4">{step.why}</p>}

        {step.suggestions.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {step.suggestions.map((s, si) => (
              <button
                key={si}
                type="button"
                disabled={locked}
                onClick={() => onAnswer(s)}
                className={`px-3 py-1.5 text-sm rough-border transition-all disabled:cursor-not-allowed ${
                  answered === s
                    ? 'bg-royal text-paper border-royal'
                    : locked
                      ? 'opacity-40'
                      : 'hover:-translate-y-0.5'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        {answered === null ? (
          <div className="flex items-center justify-between gap-3 pt-1">
            <p className="text-sm opacity-50">...or type your answer below.</p>
            <button
              type="button"
              disabled={disabled}
              onClick={onSkip}
              className="shrink-0 px-3 py-1.5 text-sm font-bold flex items-center gap-2 opacity-60 hover:opacity-100 hover:text-royal transition-all disabled:cursor-not-allowed"
            >
              <Wand2 size={14} /> You decide &mdash; just build it
            </button>
          </div>
        ) : (
          !step.suggestions.includes(answered) && <p className="text-sm opacity-50 italic">You answered below.</p>
        )}
      </div>
    </div>
  )
}
