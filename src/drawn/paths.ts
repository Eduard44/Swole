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
