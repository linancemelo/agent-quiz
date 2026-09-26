import { useEffect, useMemo, useRef, useState } from 'react'

const COLORS = ['#a855f7', '#22d3ee', '#f472b6', '#fbbf24', '#4ade80', '#fb923c', '#e879f9']

export function ConfettiBurst({
  count = 36,
  onDone,
}: {
  count?: number
  onDone?: () => void
}) {
  const reduced = useMemo(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }, [])

  const [show, setShow] = useState(!reduced)
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone

  const bits = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: `${(i * 37 + 11) % 100}%`,
        delay: `${(i % 12) * 0.05}s`,
        duration: `${1.2 + (i % 5) * 0.15}s`,
        color: COLORS[i % COLORS.length],
        size: 6 + (i % 5) * 2,
        rotate: (i * 47) % 360,
      })),
    [count],
  )

  useEffect(() => {
    if (reduced) {
      onDoneRef.current?.()
      return
    }
    const t = window.setTimeout(() => {
      setShow(false)
      onDoneRef.current?.()
    }, 2000)
    return () => window.clearTimeout(t)
  }, [reduced])

  if (!show || reduced) return null

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[60] overflow-hidden confetti-burst"
      aria-hidden="true"
    >
      {bits.map((b) => (
        <span
          key={b.id}
          className="confetti-burst-bit"
          style={{
            left: b.left,
            width: b.size,
            height: b.size,
            background: b.color,
            animationDelay: b.delay,
            animationDuration: b.duration,
            transform: `rotate(${b.rotate}deg)`,
          }}
        />
      ))}
    </div>
  )
}
