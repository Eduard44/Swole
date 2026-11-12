import { describe, expect, it } from 'vitest'
import { closedShape, hashString, hatchLines, makeRandom, penShape, sampleClosed } from '../drawn/paths'
import { buildFigure, musclesInView, widthScale, CENTER_X } from './figures'
import { MUSCLES } from './muscles'
import { EMPTY_SELECTION, tapMuscle, unselectMuscle, zoomOut } from './selection'
import { FULL_VIEW, zoomTarget } from './zoom'

describe('hand-drawn paths', () => {
  it('draws the same wobble for the same seed', () => {
    const square = [[0, 0], [10, 0], [10, 10], [0, 10]] as const
    expect(closedShape(square, 5, 2)).toBe(closedShape(square, 5, 2))
    expect(closedShape(square, 5, 2)).not.toBe(closedShape(square, 6, 2))
  })

  it('gives repeatable random numbers between 0 and 1', () => {
    const a = makeRandom(hashString('chest'))
    const b = makeRandom(hashString('chest'))
    for (let i = 0; i < 20; i++) {
      const n = a()
      expect(n).toBe(b())
      expect(n).toBeGreaterThanOrEqual(0)
      expect(n).toBeLessThan(1)
    }
  })
})

describe('pen drawing', () => {
  const square = [[0, 0], [10, 0], [10, 10], [0, 10]] as const

  it('draws a curve that passes through every given point', () => {
    const samples = sampleClosed(square, 4)
    for (const [x, y] of square) {
      expect(samples.some(([sx, sy]) => Math.abs(sx - x) < 1e-9 && Math.abs(sy - y) < 1e-9)).toBe(true)
    }
  })

  it('inks the same shape the same way every time', () => {
    expect(penShape(square, 9)).toEqual(penShape(square, 9))
    expect(penShape(square, 9).ink).not.toBe(penShape(square, 10).ink)
  })

  it('returns the requested number of hatching strokes', () => {
    expect(hatchLines(square, 3, 5)).toHaveLength(5)
  })
})

describe('figures', () => {
  it('shows every one of the 17 muscle groups on the front or the back', () => {
    const drawn = new Set([...musclesInView('front'), ...musclesInView('back')])
    expect(MUSCLES).toHaveLength(17)
    for (const muscle of MUSCLES) expect(drawn.has(muscle.id)).toBe(true)
  })

  it('keeps every figure inside the sheet', () => {
    for (const view of ['front', 'back'] as const) {
      for (const kind of ['male', 'female'] as const) {
        const figure = buildFigure(view, kind)
        const points = [...figure.outline, ...figure.muscles.flatMap((m) => m.shapes.flat())]
        for (const [x, y] of points) {
          expect(x).toBeGreaterThan(FULL_VIEW.x)
          expect(x).toBeLessThan(FULL_VIEW.x + FULL_VIEW.width)
          expect(y).toBeGreaterThan(FULL_VIEW.y)
          expect(y).toBeLessThan(FULL_VIEW.y + FULL_VIEW.height)
        }
      }
    }
  })

  it('draws paired muscles on both sides of the body', () => {
    const chest = buildFigure('front', 'male').muscles.find((m) => m.id === 'chest')!
    expect(chest.shapes).toHaveLength(2)
    const [left, right] = chest.shapes
    expect(right[0][0]).toBeCloseTo(CENTER_X * 2 - left[0][0])
    expect(chest.details.length % 2).toBe(0)
  })

  it('gives the female figure narrower shoulders and wider hips', () => {
    expect(widthScale('male', 90)).toBe(1)
    expect(widthScale('female', 90)).toBeLessThan(1)
    expect(widthScale('female', 196)).toBeGreaterThan(1)
  })
})

describe('zoom', () => {
  it('keeps the proportions of the full view and holds the whole muscle', () => {
    const chest = buildFigure('front', 'male').muscles.find((m) => m.id === 'chest')!
    const box = zoomTarget(chest.shapes)
    expect(box.width / box.height).toBeCloseTo(FULL_VIEW.width / FULL_VIEW.height)
    for (const [x, y] of chest.shapes.flat()) {
      expect(x).toBeGreaterThan(box.x)
      expect(x).toBeLessThan(box.x + box.width)
      expect(y).toBeGreaterThan(box.y)
      expect(y).toBeLessThan(box.y + box.height)
    }
    expect(box.width).toBeLessThan(FULL_VIEW.width)
  })
})

describe('selection', () => {
  it('selects and zooms in on a tapped muscle', () => {
    expect(tapMuscle(EMPTY_SELECTION, 'chest')).toEqual({ selected: ['chest'], focus: 'chest' })
  })

  it('zooms out but stays selected when the same muscle is tapped again', () => {
    const state = tapMuscle(tapMuscle(EMPTY_SELECTION, 'chest'), 'chest')
    expect(state).toEqual({ selected: ['chest'], focus: null })
  })

  it('keeps earlier picks when another muscle is tapped', () => {
    const state = tapMuscle(tapMuscle(EMPTY_SELECTION, 'chest'), 'biceps')
    expect(state).toEqual({ selected: ['chest', 'biceps'], focus: 'biceps' })
  })

  it('does not list a muscle twice', () => {
    const state = tapMuscle(zoomOut(tapMuscle(EMPTY_SELECTION, 'chest')), 'chest')
    expect(state.selected).toEqual(['chest'])
  })

  it('unselects and zooms out', () => {
    const state = unselectMuscle(tapMuscle(EMPTY_SELECTION, 'chest'), 'chest')
    expect(state).toEqual({ selected: [], focus: null })
  })
})
