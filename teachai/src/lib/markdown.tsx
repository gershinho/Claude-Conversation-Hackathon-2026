/**
 * Just enough markdown for the session document — the subset PlanCard's
 * toMarkdown emits and Claude returns for lesson plans: #/##/### headings,
 * `- ` bullets, **bold**, and paragraphs. Not a general renderer on purpose;
 * react-markdown would be a dependency for four cases.
 */

import type { ReactNode } from 'react'

function bold(text: string, key: number): ReactNode {
  const parts = text.split(/\*\*(.+?)\*\*/g)
  if (parts.length === 1) return text
  return (
    <span key={key}>
      {parts.map((part, i) => (i % 2 === 1 ? <strong key={i}>{part}</strong> : part))}
    </span>
  )
}

export function renderMarkdownLine(line: string, key: number): ReactNode {
  if (line.startsWith('### ')) {
    return (
      <h4 key={key} className="font-bold text-base mt-4 mb-1">
        {bold(line.slice(4), key)}
      </h4>
    )
  }
  if (line.startsWith('## ')) {
    return (
      <h3 key={key} className="font-display text-2xl text-royal mt-5 mb-1 -rotate-[0.5deg]">
        {bold(line.slice(3), key)}
      </h3>
    )
  }
  if (line.startsWith('# ')) {
    return (
      <h2 key={key} className="font-display text-3xl mt-1 mb-2 -rotate-1">
        {bold(line.slice(2), key)}
      </h2>
    )
  }
  if (line.startsWith('- ')) {
    return (
      <p key={key} className="pl-4 border-l-2 border-royal my-1 leading-relaxed">
        {bold(line.slice(2), key)}
      </p>
    )
  }
  if (!line.trim()) {
    return <div key={key} className="h-2" />
  }
  return (
    <p key={key} className="my-1 leading-relaxed">
      {bold(line, key)}
    </p>
  )
}
