import type { BuddyMood } from '@/lib/schemas'

/**
 * Claw'd, the pixel-crab teaching assistant. Silhouette follows the team
 * mockup (rect body, square eyes, side claws, four legs) recolored to the
 * theme, with a paper "TA" shirt band. Every part that animates is its own
 * group; the mood class on the root drives the CSS in index.css.
 */
export default function Clawd({
  mood,
  walking = false,
  width = 96,
}: {
  mood: BuddyMood
  walking?: boolean
  width?: number
}) {
  return (
    <div
      className={`clawd clawd--${mood} ${walking ? 'is-walking' : ''}`}
      style={{ width, height: (width * 72) / 128 }}
    >
      <svg viewBox="0 0 128 72" width="100%" height="100%" shapeRendering="crispEdges" aria-hidden>
        <g className="clawd-upper">
          <g className="clawd-claw clawd-claw-l">
            <rect x="8" y="24" width="16" height="8" fill="var(--color-royal)" />
            <rect x="8" y="16" width="8" height="8" fill="var(--color-royal)" />
          </g>
          <g className="clawd-claw clawd-claw-r">
            <rect x="104" y="24" width="16" height="8" fill="var(--color-royal)" />
            <rect x="112" y="16" width="8" height="8" fill="var(--color-royal)" />
          </g>
          <rect x="24" y="8" width="80" height="40" fill="var(--color-royal)" />
          {/* the TA shirt */}
          <rect x="24" y="32" width="80" height="16" fill="var(--color-paper)" />
          <text
            x="64"
            y="44"
            textAnchor="middle"
            fontFamily="'Space Mono', monospace"
            fontWeight="700"
            fontSize="12"
            fill="var(--color-ink)"
          >
            TA
          </text>
          <g className="clawd-eyes">
            <rect x="40" y="16" width="8" height="8" fill="var(--color-ink)" />
            <rect x="80" y="16" width="8" height="8" fill="var(--color-ink)" />
          </g>
        </g>
        <g className="clawd-leg clawd-leg-a">
          <rect x="32" y="48" width="8" height="16" fill="var(--color-royal)" />
        </g>
        <g className="clawd-leg clawd-leg-b">
          <rect x="48" y="48" width="8" height="16" fill="var(--color-royal)" />
        </g>
        <g className="clawd-leg clawd-leg-a">
          <rect x="72" y="48" width="8" height="16" fill="var(--color-royal)" />
        </g>
        <g className="clawd-leg clawd-leg-b">
          <rect x="88" y="48" width="8" height="16" fill="var(--color-royal)" />
        </g>
      </svg>
      {mood === 'celebrate' && (
        <div className="clawd-confetti">
          {Array.from({ length: 6 }, (_, i) => (
            <span key={i} className={`confetti confetti-${i}`} />
          ))}
        </div>
      )}
    </div>
  )
}
