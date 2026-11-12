/**
 * The hand-drawn look: paths that wobble slightly, the same way every time.
 * Everything here is plain maths that returns SVG path text, so it can be tested.
 */

export type Point = readonly [number, number]
export type Box = { x: number; y: number; width: number; height: number }

/** A random number generator with a memory: the same seed gives the same numbers. */
export function makeRandom(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Turns any text (like "front-chest-0") into a seed number. */
export function hashString(text: string): number {
  let h = 2166136261
  for (let i = 0; i < text.length; i++) {
    h ^= text.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

const f = (n: number) => n.toFixed(1)
const mid = (a: Point, b: Point): Point => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2]

function jitter(points: readonly Point[], seed: number, amp: number): Point[] {
  const rand = makeRandom(seed)
  return points.map(([x, y]) => [x + (rand() - 0.5) * amp, y + (rand() - 0.5) * amp])
}

/** A closed, smooth, slightly wobbly shape that passes near the given points. */
export function closedShape(points: readonly Point[], seed: number, amp: number): string {
  const p = jitter(points, seed, amp)
  const n = p.length
  const start = mid(p[n - 1], p[0])
  let d = `M${f(start[0])} ${f(start[1])}`
  for (let i = 0; i < n; i++) {
    const m = mid(p[i], p[(i + 1) % n])
    d += ` Q${f(p[i][0])} ${f(p[i][1])} ${f(m[0])} ${f(m[1])}`
  }
  return `${d}Z`
}

/** An open, smooth, slightly wobbly line through the given points. */
export function openLine(points: readonly Point[], seed: number, amp: number): string {
  const p = jitter(points, seed, amp)
  let d = `M${f(p[0][0])} ${f(p[0][1])}`
  for (let i = 1; i < p.length - 1; i++) {
    const m = mid(p[i], p[i + 1])
    d += ` Q${f(p[i][0])} ${f(p[i][1])} ${f(m[0])} ${f(m[1])}`
  }
  const last = p[p.length - 1]
  return `${d} L${f(last[0])} ${f(last[1])}`
}

/** A straight-ish pencil line from one point to another, wobbling sideways. */
export function wobblyLine(x1: number, y1: number, x2: number, y2: number, seed: number, amp: number): string {
  const length = Math.hypot(x2 - x1, y2 - y1)
  if (length < 0.5) return ''
  const rand = makeRandom(seed)
  const steps = Math.max(2, Math.round(length / 36))
  const nx = -(y2 - y1) / length
  const ny = (x2 - x1) / length
  const points: Point[] = []
  for (let i = 0; i <= steps; i++) {
    const t = i / steps
    const edge = i === 0 || i === steps ? 0.4 : 1
    const off = (rand() - 0.5) * 2 * amp * edge
    points.push([x1 + (x2 - x1) * t + nx * off, y1 + (y2 - y1) * t + ny * off])
  }
  return openLine(points, seed + 1, 0)
}

/** An oval drawn a little more than once round, so the ends overlap like a pencil ring. */
export function ringPath(cx: number, cy: number, rx: number, ry: number, seed: number): string {
  const rand = makeRandom(seed)
  const total = 22
  const sweep = Math.PI * 2 * 1.07
  const points: Point[] = []
  for (let i = 0; i <= total; i++) {
    const angle = -2.2 + (sweep * i) / total
    const stretch = 1 + (rand() - 0.5) * 0.09 + (i / total) * 0.05
    points.push([cx + Math.cos(angle) * rx * stretch, cy + Math.sin(angle) * ry * stretch])
  }
  return openLine(points, seed + 1, 0)
}

/** The smallest box that holds all the points. */
export function boundsOf(points: readonly Point[]): Box {
  let x0 = Infinity
  let y0 = Infinity
  let x1 = -Infinity
  let y1 = -Infinity
  for (const [x, y] of points) {
    x0 = Math.min(x0, x)
    y0 = Math.min(y0, y)
    x1 = Math.max(x1, x)
    y1 = Math.max(y1, y)
  }
  return { x: x0, y: y0, width: x1 - x0, height: y1 - y0 }
}

/* ---------- Pen drawing: lines that pass through their points, with a varying weight ---------- */

const spline = (p0: Point, p1: Point, p2: Point, p3: Point, t: number): Point => {
  const t2 = t * t
  const t3 = t2 * t
  const axis = (k: 0 | 1) =>
    0.5 *
    (2 * p1[k] +
      (-p0[k] + p2[k]) * t +
      (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 +
      (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)
  return [axis(0), axis(1)]
}

/** Many points along a smooth closed curve that passes through every given point. */
export function sampleClosed(points: readonly Point[], perSegment = 8): Point[] {
  const n = points.length
  const out: Point[] = []
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n]
    const p1 = points[i]
    const p2 = points[(i + 1) % n]
    const p3 = points[(i + 2) % n]
    for (let s = 0; s < perSegment; s++) out.push(spline(p0, p1, p2, p3, s / perSegment))
  }
  return out
}

/** Many points along a smooth open curve that passes through every given point. */
export function sampleOpen(points: readonly Point[], perSegment = 8): Point[] {
  const n = points.length
  const out: Point[] = []
  for (let i = 0; i < n - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]
    const p1 = points[i]
    const p2 = points[i + 1]
    const p3 = points[Math.min(n - 1, i + 2)]
    for (let s = 0; s < perSegment; s++) out.push(spline(p0, p1, p2, p3, s / perSegment))
  }
  out.push(points[n - 1])
  return out
}

/** Path text for a run of points joined by straight steps (smooth when the points are close). */
export function polyPath(samples: readonly Point[], closed: boolean): string {
  let d = ''
  samples.forEach(([x, y], i) => {
    d += `${i ? 'L' : 'M'}${x.toFixed(2)} ${y.toFixed(2)}`
  })
  return closed ? `${d}Z` : d
}

export type PenShape = {
  /** The inside of the shape, for filling and tapping. */
  fill: string
  /** The pen outline itself, as a filled ribbon that is heavier on the shadow side. */
  ink: string
}

/** The shadow falls down and to the right, so lines are heavier there. */
const SHADOW: Point = [0.6, 0.8]

/**
 * A closed shape drawn the way a pen draws it: the line swells on the shadow
 * side and thins on the lit side, with a little unevenness along the way.
 */
export function penShape(points: readonly Point[], seed: number, weight = 0.9, amp = 0.7): PenShape {
  const samples = sampleClosed(jitter(points, seed, amp))
  const n = samples.length
  let area = 0
  for (let i = 0; i < n; i++) {
    const [x1, y1] = samples[i]
    const [x2, y2] = samples[(i + 1) % n]
    area += x1 * y2 - x2 * y1
  }
  const outward = area > 0 ? 1 : -1
  const rand = makeRandom(seed + 77)
  const phase = rand() * 6.28
  const speed = 0.25 + rand() * 0.2
  const outer: Point[] = []
  const inner: Point[] = []
  for (let i = 0; i < n; i++) {
    const prev = samples[(i - 1 + n) % n]
    const next = samples[(i + 1) % n]
    const tx = next[0] - prev[0]
    const ty = next[1] - prev[1]
    const len = Math.hypot(tx, ty) || 1
    const nx = (ty / len) * outward
    const ny = (-tx / len) * outward
    const facing = Math.max(0, nx * SHADOW[0] + ny * SHADOW[1])
    const uneven = 1 + 0.22 * Math.sin(i * speed + phase)
    const half = (weight * (0.5 + 1.15 * facing) * uneven) / 2
    outer.push([samples[i][0] + nx * half, samples[i][1] + ny * half])
    inner.push([samples[i][0] - nx * half, samples[i][1] - ny * half])
  }
  return { fill: polyPath(samples, true), ink: polyPath(outer, true) + polyPath(inner.reverse(), true) }
}

/** A pen line through the given points (for the small lines inside a muscle). */
export function penLine(points: readonly Point[], seed: number, amp = 0.6): string {
  return polyPath(sampleOpen(jitter(points, seed, amp)), false)
}

/**
 * Short hatching strokes for the shadow side of a shape. They are drawn across
 * the lower right of the shape's box; the caller clips them to the shape.
 */
export function hatchLines(points: readonly Point[], seed: number, count = 5): string[] {
  const box = boundsOf(points)
  const size = Math.min(box.width, box.height)
  const cx = box.x + box.width / 2
  const cy = box.y + box.height / 2
  const rand = makeRandom(seed + 31)
  const lines: string[] = []
  for (let i = 0; i < count; i++) {
    const along = 0.12 + i * 0.1 + (rand() - 0.5) * 0.03
    const mx = cx + SHADOW[0] * along * box.width
    const my = cy + SHADOW[1] * along * box.height
    const half = size * (0.42 - i * 0.03) * (0.85 + rand() * 0.3)
    const x1 = mx + 0.72 * half
    const y1 = my - 0.7 * half
    const x2 = mx - 0.72 * half
    const y2 = my + 0.7 * half
    lines.push(`M${x1.toFixed(2)} ${y1.toFixed(2)}L${x2.toFixed(2)} ${y2.toFixed(2)}`)
  }
  return lines
}
