import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { boundsOf, closedShape, hashString, penLine, penShape, ringPath, type Box } from '../drawn/paths'
import { buildFigure, type FigureKind, type View } from './figures'
import { muscleName, type MuscleId } from './muscles'
import { FULL_VIEW, zoomTarget } from './zoom'

type Props = {
  view: View
  figure: FigureKind
  selected: readonly MuscleId[]
  /** The muscle zoomed in on, if any. */
  focus: MuscleId | null
  onTapMuscle: (id: MuscleId) => void
  /** Tapping the paper around the figure. */
  onTapPaper: () => void
}

const ZOOM_MS = 380
const boxText = (b: Box) => `${b.x.toFixed(2)} ${b.y.toFixed(2)} ${b.width.toFixed(2)} ${b.height.toFixed(2)}`
const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2)
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** The body, inked as a pen sketch. Tap a muscle to zoom in on it; it is ringed in red pencil. */
export function BodyMap({ view, figure, selected, focus, onTapMuscle, onTapPaper }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const current = useRef<Box>(FULL_VIEW)
  const [ringUnit, setRingUnit] = useState(1)
  const [ringsOn, setRingsOn] = useState(false)

  const drawing = useMemo(() => buildFigure(view, figure), [view, figure])
  const key = `${view}-${figure}`
  const bodyClip = `body-${key}`
  const body = useMemo(() => penShape(drawing.outline, hashString(`${figure}-outline`), 1.25, 0.5), [drawing, figure])
  const head = useMemo(() => penShape(drawing.head, hashString('head'), 1.25, 0.5), [drawing])

  const focusShapes = useMemo(
    () => drawing.muscles.find((m) => m.id === focus)?.shapes ?? null,
    [drawing, focus],
  )
  const target = useMemo(() => (focusShapes ? zoomTarget(focusShapes) : FULL_VIEW), [focusShapes])

  // Move the view smoothly to the target.
  useLayoutEffect(() => {
    const svg = svgRef.current
    if (!svg) return
    const scale = Math.min(svg.clientWidth / target.width, svg.clientHeight / target.height) || 1
    setRingUnit(1 / scale)

    const from = current.current
    if (prefersReducedMotion() || boxText(from) === boxText(target)) {
      current.current = target
      svg.setAttribute('viewBox', boxText(target))
      return
    }
    let frame = 0
    let start: number | null = null
    const step = (now: number) => {
      if (start === null) start = now
      const k = Math.min(1, (now - start) / ZOOM_MS)
      const e = easeInOut(k)
      const box = {
        x: from.x + (target.x - from.x) * e,
        y: from.y + (target.y - from.y) * e,
        width: from.width + (target.width - from.width) * e,
        height: from.height + (target.height - from.height) * e,
      }
      current.current = box
      svg.setAttribute('viewBox', boxText(box))
      if (k < 1) frame = requestAnimationFrame(step)
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [target])

  // Let the red ring draw itself in after the zoom has started.
  useEffect(() => {
    setRingsOn(false)
    if (!focusShapes) return
    const frame = requestAnimationFrame(() => requestAnimationFrame(() => setRingsOn(true)))
    return () => cancelAnimationFrame(frame)
  }, [focusShapes])

  return (
    <svg
      ref={svgRef}
      className="bodymap"
      viewBox={boxText(FULL_VIEW)}
      preserveAspectRatio="xMidYMid meet"
      role="group"
      aria-label={`Body map, ${view} view`}
      onClick={onTapPaper}
    >
      <g key={key} className="bodymap-art">
        <clipPath id={bodyClip}>
          <path d={body.fill} />
        </clipPath>
        <path className="body-fill" d={body.fill} />
        <path className="body-fill" d={head.fill} />
        {/* Muscles are trimmed to the body outline, so they read as parts of one body. */}
        <g clipPath={`url(#${bodyClip})`}>
          {drawing.muscles.map((muscle) => {
            const isSelected = selected.includes(muscle.id)
            return (
              <g
                key={muscle.id}
                className={isSelected ? 'muscle is-selected' : 'muscle'}
                role="button"
                tabIndex={0}
                aria-label={muscleName(muscle.id)}
                aria-pressed={isSelected}
                onClick={(event) => {
                  event.stopPropagation()
                  onTapMuscle(muscle.id)
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault()
                    onTapMuscle(muscle.id)
                  }
                }}
              >
                {muscle.shapes.map((shape, i) => {
                  const seed = hashString(`${view}-${muscle.id}-${i}`)
                  const pen = penShape(shape, seed, 0.75)
                  return (
                    <g key={i}>
                      <path className="muscle-fill" d={pen.fill} />
                      <path className="muscle-sketch" d={closedShape(shape, seed + 500, 2)} />
                      <path className="muscle-ink" d={pen.ink} />
                    </g>
                  )
                })}
                {muscle.details.map((line, i) => (
                  <path key={`d${i}`} className="muscle-detail" d={penLine(line, hashString(`${muscle.id}-d${i}`))} />
                ))}
              </g>
            )
          })}
        </g>
        <path className="body-sketch" d={closedShape(drawing.outline, hashString(`${key}-sketch`), 2.2)} />
        <path className="body-ink" d={body.ink} />
        <path className="body-ink" d={head.ink} />
      </g>
      <g className="bodymap-rings">
        {focusShapes?.map((shape, i) => {
          const b = boundsOf(shape)
          return (
            <path
              key={`${focus}-${i}`}
              className={ringsOn ? 'ring is-on' : 'ring'}
              pathLength={1}
              strokeWidth={2.6 * ringUnit}
              d={ringPath(b.x + b.width / 2, b.y + b.height / 2, b.width / 2 + 5, b.height / 2 + 5, 40 + i)}
            />
          )
        })}
      </g>
    </svg>
  )
}
