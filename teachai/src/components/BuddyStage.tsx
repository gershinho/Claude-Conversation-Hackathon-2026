import { useEffect, useRef, useState } from 'react'
import Clawd from '@/components/Clawd'
import type { BuddyMood } from '@/lib/schemas'

export type BuddyAnchor = 'composer' | 'divider' | 'doc-change' | 'progress' | 'center-stage'

export type BuddyState = {
  mood: BuddyMood
  anchor: BuddyAnchor
  message: string
}

const CRAB_W = 96
const CRAB_H = (CRAB_W * 72) / 128

/**
 * Full-bleed overlay across the session split. Claw'd is one absolutely
 * positioned child; anchors resolve to elements tagged with
 * `data-buddy-anchor` at render sites, so the stage needs no layout knowledge.
 * left/top transition in steps() so gliding reads as a pixel scuttle.
 */
export default function BuddyStage({ buddy }: { buddy: BuddyState }) {
  const stageRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState({ x: 24, y: 300 })
  const [walking, setWalking] = useState(false)
  const [flip, setFlip] = useState(false)
  const [bubbleRight, setBubbleRight] = useState(true)
  const walkTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    const stage = stageRef.current
    if (!stage) return

    const measure = () => {
      const s = stage.getBoundingClientRect()
      if (s.width === 0) return
      const rect = (name: string) =>
        document.querySelector(`[data-buddy-anchor="${name}"]`)?.getBoundingClientRect() ?? null

      // Fallback: parked bottom-left, above the composer area.
      let x = 24
      let y = s.height - CRAB_H - 150

      const r = rect(buddy.anchor)
      if (r) {
        switch (buddy.anchor) {
          case 'composer':
            x = r.left - s.left + 16
            y = r.top - s.top - CRAB_H - 12
            break
          case 'divider':
            x = r.right - s.left - CRAB_W / 2
            y = s.height * 0.32
            break
          case 'doc-change':
            x = r.left - s.left + 20
            y = r.bottom - s.top + 8
            break
          case 'progress':
            x = r.left - s.left + 24
            y = r.bottom - s.top + 10
            break
          case 'center-stage':
            x = r.left - s.left + r.width / 2 - CRAB_W / 2
            y = r.top - s.top + r.height / 2 - CRAB_H / 2
            break
        }
      }

      x = Math.max(8, Math.min(x, s.width - CRAB_W - 8))
      y = Math.max(8, Math.min(y, s.height - CRAB_H - 8))
      setBubbleRight(x < s.width / 2)

      setPos((p) => {
        if (Math.abs(p.x - x) + Math.abs(p.y - y) > 16) {
          setFlip(x < p.x)
          setWalking(true)
          window.clearTimeout(walkTimer.current)
          walkTimer.current = window.setTimeout(() => setWalking(false), 1200)
        }
        return { x, y }
      })
    }

    measure()
    // Second pass once the doc pane's smooth scroll has settled.
    const settle = window.setTimeout(measure, 700)
    window.addEventListener('resize', measure)
    return () => {
      window.clearTimeout(settle)
      window.removeEventListener('resize', measure)
    }
  }, [buddy.anchor, buddy.message])

  useEffect(() => () => window.clearTimeout(walkTimer.current), [])

  return (
    <div ref={stageRef} className="absolute inset-0 pointer-events-none z-40 hidden md:block">
      <div
        className="absolute"
        style={{
          left: pos.x,
          top: pos.y,
          transition: 'left 1.2s cubic-bezier(0.45, 0, 0.25, 1), top 1.2s cubic-bezier(0.45, 0, 0.25, 1)',
        }}
      >
        <div style={flip ? { transform: 'scaleX(-1)' } : undefined}>
          <Clawd mood={buddy.mood} walking={walking} width={CRAB_W} />
        </div>
        {buddy.message && !walking && (
          <div
            className={`buddy-bubble ${bubbleRight ? 'buddy-bubble-right' : 'buddy-bubble-left'} animate-in fade-in zoom-in-95 duration-300`}
          >
            {buddy.message}
          </div>
        )}
      </div>
    </div>
  )
}
