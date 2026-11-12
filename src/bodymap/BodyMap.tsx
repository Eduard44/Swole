import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { PencilFilter } from '../drawn/Drawn'
import { boundsOf, closedShape, hashString, hatchLines, penLine, penShape, ringPath, type Box } from '../drawn/paths'
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

/** The grain filter for muscle fills. app.css refers to this id. */
const GRAIN = 'swole-bodymap-grain'
const ZOOM_MS = 380
const boxText = (b: Box) => `${b.x.toFixed(2)} ${b.y.toFixed(2)} ${b.width.toFixed(2)} ${b.height.toFixed(2)}`
const easeInOut = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2)
const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches

/** The body, inked as a pen sketch. Tap a muscle to zoom in on it; it is ringed in red pencil. */
export function BodyMap({ view, figure, selected, focus, onTapMuscle, onTapPaper }: Props) {
  const svgRef = useRef<SVGSVGElement>(null)
  const artRef = useRef<SVGGElement>(null)
  const current = useRef<Box>(FULL_VIEW)
  const [ringUnit, setRingUnit] = useState(1)
  const [ringsOn, setRingsOn] = useState(false)

  const drawing = useMemo(() => buildFigure(view, figure), [view, figure])
  const key = `${view}-${figure}`

  const focusShapes = useMemo(
    () => drawing.muscles.find((m) => m.id === focus)?.shapes ?? null,
    [drawing, focus],
  )
  const target = useMemo(() => (focusShapes ? zoomTarget(focusShapes) : FULL_VIEW), [focusShapes])

  // Move the view smoothly to the target. The fill grain is switched off while
  // moving so the zoom stays smooth on phones, and comes back when it settles.
  useLayoutEffect(() => {
    const svg = svgRef.current
    const art = artRef.current
    if (!svg || !art) return
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
    svg.classList.add('is-moving')
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
      else svg.classList.remove('is-moving')
    }
    frame = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(frame)
      svg.classList.remove('is-moving')
    }
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
      <defs>
        <PencilFilter id={GRAIN} seed={11} />
      </defs>
      <g ref={artRef} key={key} className="bodymap-art">
        <path className="bodymap-outline" d={closedShape(drawing.outline, hashString(`${key}-outline`), 1.2)} />
        <path className="bodymap-outline" d={closedShape(drawing.head, hashString('head'), 1.2)} />
        {drawing.extras.map((shape, i) => (
          <path key={`x${i}`} className="bodymap-extra" d={penShape(shape, hashString(`extra-${i}`), 0.6).ink} />
        ))}
        {drawing.muscles.map((muscle) => {
          const isSelected = selected.includes(muscle.id)
          const classes = ['muscle', isSelected && 'is-selected', focus === muscle.id && 'is-focus']
            .filter(Boolean)
            .join(' ')
          return (
            <g
              key={muscle.id}
              className={classes}
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
                const name = `${view}-${muscle.id}-${i}`
                const seed = hashString(name)
                const pen = penShape(shape, seed)
                const clip = `clip-${figure}-${name}`
                return (
                  <g key={i}>
                    <clipPath id={clip}>
                      <path d={pen.fill} />
                    </clipPath>
                    <path className="muscle-fill" d={pen.fill} />
                    <g className="muscle-hatch" clipPath={`url(#${clip})`}>
                      {hatchLines(shape, seed).map((d, k) => (
                        <path key={k} d={d} />
                      ))}
                    </g>
                    <path className="muscle-sketch" d={closedShape(shape, seed + 500, 2)} />
                    <path className="muscle-ink" d={pen.ink} />
                    <path className="muscle-hit" d={pen.fill} />
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
