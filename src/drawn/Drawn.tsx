import { useLayoutEffect, useRef, useState } from 'react'
import { hashString, wobblyLine } from './paths'

/** The id of the shared pencil-grain filter. Put <PencilDefs /> once near the top of the app. */
export const PENCIL_FILTER = 'swole-pencil'

/** The pencil grain: a noise filter that cuts lines and fills into a fine speckle. */
export function PencilFilter({ id, seed = 7 }: { id: string; seed?: number }) {
  return (
    <filter id={id} x="-5%" y="-5%" width="110%" height="110%">
      <feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="2" seed={seed} result="noise" />
      <feColorMatrix in="noise" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.4 0 0 0 -0.4" result="mask" />
      <feComposite in="SourceGraphic" in2="mask" operator="in" />
    </filter>
  )
}

export function PencilDefs() {
  return (
    <svg width="0" height="0" aria-hidden="true" style={{ position: 'absolute' }}>
      <defs>
        <PencilFilter id={PENCIL_FILTER} />
      </defs>
    </svg>
  )
}

type FrameProps = {
  /** Any text. The same seed always gives the same wobble. */
  seed: string
  /** Fill the box with a color token class: "surface", "accent" or "secondary". */
  fill?: 'surface' | 'accent' | 'secondary'
}

/**
 * A hand-drawn box behind its parent element. Put it as the first child of any
 * element with the class "drawn". It measures the parent and redraws on resize.
 */
export function DrawnFrame({ seed, fill }: FrameProps) {
  const ref = useRef<SVGSVGElement>(null)
  const [size, setSize] = useState({ w: 0, h: 0 })

  useLayoutEffect(() => {
    const parent = ref.current?.parentElement
    if (!parent) return
    const measure = () => setSize({ w: parent.offsetWidth, h: parent.offsetHeight })
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(parent)
    return () => observer.disconnect()
  }, [])

  const { w, h } = size
  const s = hashString(seed)
  const pad = 6
  const over = 3
  const amp = 1.1
  const sides =
    w && h
      ? [
          wobblyLine(-over, 0, w + over, 0, s + 1, amp),
          wobblyLine(w, -over, w, h + over, s + 2, amp),
          wobblyLine(w + over, h, -over, h, s + 3, amp),
          wobblyLine(0, h + over, 0, -over, s + 4, amp),
        ]
      : []

  return (
    <svg
      ref={ref}
      className="drawn-frame"
      width={w + pad * 2}
      height={h + pad * 2}
      viewBox={`${-pad} ${-pad} ${w + pad * 2} ${h + pad * 2}`}
      aria-hidden="true"
    >
      {fill && w > 0 && (
        <path className={`drawn-fill drawn-fill-${fill}`} d={`M0.5 1 L${w - 0.5} 0.5 L${w} ${h - 0.5} L1 ${h}Z`} />
      )}
      <g className="drawn-lines" filter={`url(#${PENCIL_FILTER})`}>
        {sides.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>
    </svg>
  )
}
