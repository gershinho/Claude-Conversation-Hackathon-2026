import { useState } from 'react'
import { Hammer, MessageCircleQuestion } from 'lucide-react'
import type { Intake } from '@/lib/schemas'

type Props = {
  intake: Intake
  onSubmit: (answers: Record<string, string>) => void
  submitting: boolean
  locked: boolean
}

export default function IntakePanel({ intake, onSubmit, submitting, locked }: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({})

  const set = (id: string, value: string) => setAnswers((a) => ({ ...a, [id]: value }))
  const answered = intake.questions.filter((q) => answers[q.id]?.trim()).length

  return (
    <div className="w-full flex flex-col gap-6">
      <section className="p-6 md:p-8 bg-paper rough-border sketch-box-shadow">
        <div className="flex items-center gap-2 mb-3 text-royal">
          <MessageCircleQuestion size={20} />
          <p className="font-mono text-xs uppercase tracking-widest opacity-70">
            Before I build anything &middot; {answered}/{intake.questions.length} answered
          </p>
        </div>
        <p className="text-lg leading-relaxed">{intake.intro}</p>
      </section>

      <div className="flex flex-col gap-4">
        {intake.questions.map((q, i) => (
          <div key={q.id} className="p-5 md:p-6 bg-paper rough-border sketch-box-shadow-blue">
            <div className="flex items-baseline gap-3 mb-2">
              <span className="font-display text-3xl text-royal shrink-0">{i + 1}</span>
              <h3 className="text-lg md:text-xl font-bold">{q.question}</h3>
            </div>
            <p className="text-sm opacity-60 mb-4 pl-11">{q.why}</p>

            <div className="pl-0 md:pl-11 flex flex-col gap-3">
              {q.suggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {q.suggestions.map((s, si) => (
                    <button
                      key={si}
                      type="button"
                      disabled={locked}
                      onClick={() => set(q.id, s)}
                      className={`px-3 py-1.5 text-sm rough-border transition-all disabled:opacity-50 ${
                        answers[q.id] === s ? 'bg-royal text-paper border-royal' : 'hover:-translate-y-0.5'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
              <textarea
                value={answers[q.id] ?? ''}
                onChange={(e) => set(q.id, e.target.value)}
                placeholder={q.placeholder}
                disabled={locked}
                rows={2}
                className="w-full p-4 rough-border bg-transparent outline-none text-base leading-relaxed resize-y placeholder-ink placeholder-opacity-40 focus:border-royal disabled:opacity-60"
              />
            </div>
          </div>
        ))}
      </div>

      {!locked && (
        <div className="flex flex-col items-center gap-3 py-2">
          <button
            onClick={() => onSubmit(answers)}
            disabled={submitting || answered === 0}
            className="px-8 py-5 rough-button-blue font-bold text-lg flex items-center gap-3 sketch-box-shadow-blue hover:-translate-y-1 hover:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Hammer size={22} />
            {submitting ? 'Building your lesson plan...' : 'Build my lesson plan'}
          </button>
          {answered === 0 && <p className="text-sm opacity-50">Answer at least one to get started.</p>}
        </div>
      )}
    </div>
  )
}
