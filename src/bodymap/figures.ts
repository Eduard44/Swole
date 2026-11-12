import type { Point } from '../drawn/paths'
import type { MuscleId } from './muscles'

/**
 * The figure drawings, as lists of points on a 200 x 400 sheet (centre line x = 100).
 * Each shape is drawn for the left half only; "mirror" copies it to the right half.
 * The drawing code (BodyMap) inks these points as pen shapes that pass through
 * every point, so moving a point moves the line. "details" are the small pen
 * lines inside a muscle.
 */

export type View = 'front' | 'back'
export type FigureKind = 'male' | 'female'

type MuscleDrawing = {
  id: MuscleId
  /** Copy each shape to the other side of the body. */
  mirror?: boolean
  shapes: Point[][]
  /** Small pen lines inside the muscle (for example the lines across the abs). */
  details?: Point[][]
}

export const CENTER_X = 100

/** Left half of the body outline, from the neck down the outside and back up the inside leg. */
const OUTLINE_HALF: Point[] = [
  [92, 54], [91, 64], [78, 70], [58, 75], [48, 85], [43, 104], [40, 128], [37, 150], [33, 178],
  [31, 204], [28, 218], [31, 231], [39, 231], [43, 218], [45, 204], [50, 178], [53, 152],
  [58, 128], [63, 107], [66, 130], [70, 158], [67, 186], [65, 214], [66, 246], [69, 276],
  [71, 304], [74, 340], [77, 362], [71, 377], [76, 383], [90, 383], [91, 372], [89, 362],
  [91, 330], [91, 300], [90, 276], [93, 246], [97, 213],
]

const HEAD: Point[] = [
  [100, 14], [110, 18], [115, 30], [113, 43], [107, 52], [100, 55], [93, 52], [87, 43], [85, 30], [90, 18],
]

/*
 * The muscles are drawn generously so that neighbours meet and the outer ones
 * run past the body outline. BodyMap trims them to the outline, so the figure
 * reads as one body with muscle lines inside it, not as separate pieces.
 */

const SIDE_DELT: Point[] = [[58, 76], [52, 74], [44, 78], [40, 88], [40, 100], [44, 108], [50, 108], [54, 100], [57, 90]]
const UPPER_ARM: Point[] = [
  [44, 106], [52, 104], [60, 105], [64, 110], [62, 122], [59, 136], [55, 148], [46, 150], [38, 146], [38, 130], [40, 116],
]
const FOREARM: Point[] = [
  [40, 151], [48, 149], [56, 151], [55, 164], [52, 180], [48, 196], [46, 206], [36, 206], [30, 204], [31, 188], [34, 170], [37, 158],
]

const FRONT: MuscleDrawing[] = [
  { id: 'neck', shapes: [[[88, 52], [112, 52], [112, 64], [105, 70], [100, 72], [95, 70], [88, 64]]] },
  { id: 'traps', mirror: true, shapes: [[[92, 60], [91, 68], [84, 73], [72, 76], [60, 77], [56, 72], [70, 68], [80, 66]]] },
  { id: 'side-delts', mirror: true, shapes: [SIDE_DELT] },
  { id: 'front-delts', mirror: true, shapes: [[[58, 77], [66, 76], [74, 78], [76, 86], [74, 95], [68, 102], [62, 104], [56, 100], [57, 90]]] },
  { id: 'chest', mirror: true, shapes: [[[99, 79], [88, 77], [77, 78], [75, 86], [72, 95], [70, 103], [75, 109], [84, 112], [93, 111], [99, 107]]] },
  { id: 'biceps', mirror: true, shapes: [UPPER_ARM] },
  { id: 'forearms', mirror: true, shapes: [FOREARM] },
  {
    id: 'obliques',
    mirror: true,
    shapes: [[
      [70, 106], [76, 111], [85, 114], [85, 130], [85, 150], [86, 166], [89, 180], [92, 190], [80, 190], [68, 188],
      [64, 178], [66, 160], [64, 140], [62, 120], [63, 108],
    ]],
  },
  {
    id: 'abs',
    shapes: [[
      [88, 113], [100, 114], [112, 113], [114, 125], [114, 145], [113, 162], [110, 176], [105, 186], [100, 191],
      [95, 186], [90, 176], [87, 162], [86, 145], [86, 125],
    ]],
    details: [
      [[100, 117], [100, 150], [100, 186]],
      [[88, 129], [100, 131], [112, 129]],
      [[88, 146], [100, 148], [112, 146]],
      [[89, 163], [100, 165], [111, 163]],
    ],
  },
  {
    id: 'quads',
    mirror: true,
    shapes: [[
      [63, 196], [72, 192], [84, 192], [94, 200], [98, 214], [97, 232], [95, 250], [92, 264], [88, 274], [80, 277],
      [72, 275], [66, 262], [62, 240], [61, 218],
    ]],
    details: [[[76, 196], [81, 232], [83, 270]]],
  },
  {
    id: 'calves',
    mirror: true,
    shapes: [[[69, 290], [80, 288], [91, 290], [93, 304], [93, 322], [91, 340], [89, 356], [78, 358], [74, 350], [70, 330], [68, 310]]],
  },
]

const BACK: MuscleDrawing[] = [
  { id: 'neck', shapes: [[[88, 52], [112, 52], [112, 62], [106, 66], [100, 67], [94, 66], [88, 62]]] },
  { id: 'side-delts', mirror: true, shapes: [SIDE_DELT] },
  { id: 'rear-delts', mirror: true, shapes: [[[58, 77], [66, 78], [73, 82], [76, 89], [73, 97], [67, 103], [61, 105], [56, 100], [57, 90]]] },
  { id: 'triceps', mirror: true, shapes: [UPPER_ARM] },
  { id: 'forearms', mirror: true, shapes: [FOREARM] },
  {
    id: 'lats',
    mirror: true,
    shapes: [[[64, 104], [70, 99], [79, 95], [87, 103], [92, 116], [96, 132], [96, 150], [91, 158], [82, 160], [73, 156], [66, 146], [63, 130], [62, 114]]],
  },
  {
    id: 'traps',
    shapes: [[
      [100, 60], [108, 64], [118, 67], [130, 71], [142, 75], [132, 81], [120, 86], [111, 99], [105, 113], [100, 128],
      [95, 113], [89, 99], [80, 86], [68, 81], [58, 75], [70, 71], [82, 67], [92, 64],
    ]],
    details: [[[100, 64], [100, 96], [100, 124]]],
  },
  { id: 'obliques', mirror: true, shapes: [[[66, 150], [74, 157], [82, 162], [83, 176], [85, 188], [76, 190], [66, 188], [64, 176], [66, 162]]] },
  {
    id: 'lower-back',
    shapes: [[[86, 152], [100, 150], [114, 152], [117, 166], [116, 180], [110, 190], [100, 193], [90, 190], [84, 180], [83, 166]]],
    details: [[[100, 154], [100, 172], [100, 190]]],
  },
  { id: 'glutes', mirror: true, shapes: [[[64, 196], [72, 190], [86, 190], [97, 194], [99, 206], [99, 218], [94, 226], [84, 229], [72, 227], [64, 220], [62, 208]]] },
  {
    id: 'hamstrings',
    mirror: true,
    shapes: [[[64, 232], [74, 230], [88, 230], [96, 233], [96, 248], [94, 262], [90, 274], [82, 278], [73, 276], [66, 264], [62, 246]]],
    details: [[[80, 233], [81, 254], [80, 274]]],
  },
  {
    id: 'calves',
    mirror: true,
    shapes: [[
      [69, 288], [78, 283], [86, 283], [93, 288], [95, 302], [94, 318], [90, 334], [86, 346], [80, 350], [75, 344],
      [70, 328], [67, 310], [67, 296],
    ]],
    details: [[[81, 286], [81, 312], [81, 344]]],
  },
]

const mirrorPoint = ([x, y]: Point): Point => [CENTER_X * 2 - x, y]

/**
 * The female figure is the same drawing reshaped: narrower shoulders and waist,
 * wider hips. This table says how wide the body is at each height (1 = unchanged).
 */
const FEMALE_WIDTH: Point[] = [
  [60, 1], [80, 0.9], [120, 0.9], [152, 0.86], [196, 1.07], [240, 1.04], [300, 1],
]

export function widthScale(kind: FigureKind, y: number): number {
  if (kind === 'male') return 1
  const table = FEMALE_WIDTH
  if (y <= table[0][0]) return table[0][1]
  for (let i = 1; i < table.length; i++) {
    if (y <= table[i][0]) {
      const [y0, s0] = table[i - 1]
      const [y1, s1] = table[i]
      return s0 + ((s1 - s0) * (y - y0)) / (y1 - y0)
    }
  }
  return table[table.length - 1][1]
}

function reshape(kind: FigureKind, points: readonly Point[]): Point[] {
  return points.map(([x, y]) => [CENTER_X + (x - CENTER_X) * widthScale(kind, y), y])
}

export type FigureMuscle = { id: MuscleId; shapes: Point[][]; details: Point[][] }
export type Figure = { outline: Point[]; head: Point[]; muscles: FigureMuscle[] }

/** Everything needed to draw one figure: outline, head and every muscle in that view. */
export function buildFigure(view: View, kind: FigureKind): Figure {
  const drawings = view === 'front' ? FRONT : BACK
  const outline = [...OUTLINE_HALF, ...OUTLINE_HALF.map(mirrorPoint).reverse()]
  return {
    outline: reshape(kind, outline),
    head: HEAD,
    muscles: drawings.map((drawing) => ({
      id: drawing.id,
      shapes: drawing.shapes
        .flatMap((shape) => (drawing.mirror ? [shape, shape.map(mirrorPoint)] : [shape]))
        .map((shape) => reshape(kind, shape)),
      details: (drawing.details ?? [])
        .flatMap((line) => (drawing.mirror ? [line, line.map(mirrorPoint)] : [line]))
        .map((line) => reshape(kind, line)),
    })),
  }
}

/** Which muscle groups can be seen in a view. */
export function musclesInView(view: View): MuscleId[] {
  return (view === 'front' ? FRONT : BACK).map((d) => d.id)
}
