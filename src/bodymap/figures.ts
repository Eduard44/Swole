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

/** Drawn but not tappable: the kneecaps on the front view. */
const KNEE: Point[] = [[73, 277], [80, 275], [88, 277], [89, 284], [81, 288], [72, 284]]

const FOREARM: Point[] = [
  [42, 150], [48, 148], [54, 151], [55, 160], [53, 174], [50, 188], [46, 199], [39, 200], [36, 190], [35, 176], [37, 160],
]
const FOREARM_LINES: Point[][] = [[[46, 153], [45, 172], [43, 193]]]
const SIDE_DELT: Point[] = [[55, 77], [50, 80], [46, 87], [45, 96], [47, 104], [51, 106], [54, 98], [56, 88], [58, 80]]

const FRONT: MuscleDrawing[] = [
  {
    id: 'neck',
    shapes: [[[93, 55], [100, 57], [107, 55], [110, 64], [104, 70], [100, 72], [96, 70], [90, 64]]],
    details: [[[94, 58], [97, 64], [100, 69]], [[106, 58], [103, 64], [100, 69]]],
  },
  { id: 'traps', mirror: true, shapes: [[[91, 61], [90, 68], [84, 72], [74, 74], [65, 75], [72, 70], [82, 65]]] },
  { id: 'side-delts', mirror: true, shapes: [SIDE_DELT] },
  {
    id: 'front-delts',
    mirror: true,
    shapes: [[[59, 78], [66, 76], [73, 77], [75, 84], [73, 92], [68, 99], [62, 102], [57, 98], [58, 88]]],
    details: [[[67, 79], [66, 89], [63, 98]]],
  },
  {
    id: 'chest',
    mirror: true,
    shapes: [[[97, 80], [88, 78], [78, 79], [75, 86], [72, 94], [71, 101], [76, 107], [84, 110], [92, 109], [98, 105], [98, 92]]],
    details: [[[75, 95], [86, 91], [96, 90]], [[77, 103], [88, 100], [96, 99]]],
  },
  {
    id: 'biceps',
    mirror: true,
    shapes: [[[50, 106], [56, 104], [60, 108], [62, 118], [61, 130], [58, 140], [53, 146], [47, 143], [44, 134], [44, 120], [46, 110]]],
    details: [[[54, 109], [53, 126], [52, 141]]],
  },
  { id: 'forearms', mirror: true, shapes: [FOREARM], details: FOREARM_LINES },
  {
    id: 'abs',
    shapes: [[
      [89, 112], [100, 113], [111, 112], [114, 122], [114, 140], [113, 158], [110, 172], [105, 183], [100, 188],
      [95, 183], [90, 172], [87, 158], [86, 140], [86, 122],
    ]],
    details: [
      [[100, 116], [100, 150], [100, 184]],
      [[88, 127], [100, 129], [112, 127]],
      [[88, 144], [100, 146], [112, 144]],
      [[89, 161], [100, 163], [111, 161]],
    ],
  },
  {
    id: 'obliques',
    mirror: true,
    shapes: [[
      [73, 112], [80, 113], [85, 116], [84, 130], [84, 146], [85, 160], [88, 174], [91, 184], [84, 183], [76, 178],
      [71, 166], [69, 150], [69, 134], [70, 120],
    ]],
    details: [[[72, 123], [77, 126], [82, 127]], [[71, 135], [77, 138], [82, 139]], [[71, 147], [77, 150], [82, 151]]],
  },
  {
    id: 'quads',
    mirror: true,
    shapes: [[
      [68, 196], [76, 192], [86, 194], [95, 206], [97, 222], [96, 240], [93, 256], [89, 268], [82, 273], [75, 270],
      [70, 258], [66, 240], [65, 220], [66, 206],
    ]],
    details: [[[78, 197], [82, 230], [84, 267]], [[94, 244], [91, 256], [87, 265]]],
  },
  {
    id: 'calves',
    mirror: true,
    shapes: [[[73, 292], [80, 290], [88, 292], [90, 304], [90, 320], [87, 336], [83, 350], [79, 356], [75, 346], [72, 330], [71, 312]]],
    details: [[[81, 293], [82, 320], [81, 349]]],
  },
]

const BACK: MuscleDrawing[] = [
  { id: 'neck', shapes: [[[93, 54], [100, 53], [107, 54], [108, 62], [104, 66], [100, 67], [96, 66], [92, 62]]] },
  {
    id: 'traps',
    shapes: [[
      [100, 62], [106, 65], [114, 68], [126, 72], [137, 76], [128, 81], [118, 86], [110, 98], [104, 112], [100, 126],
      [96, 112], [90, 98], [82, 86], [72, 81], [63, 76], [74, 72], [86, 68], [94, 65],
    ]],
    details: [
      [[100, 66], [100, 96], [100, 122]],
      [[101, 84], [112, 82], [124, 77]],
      [[99, 84], [88, 82], [76, 77]],
    ],
  },
  { id: 'side-delts', mirror: true, shapes: [SIDE_DELT] },
  {
    id: 'rear-delts',
    mirror: true,
    shapes: [[[58, 79], [65, 79], [72, 82], [75, 89], [72, 96], [66, 101], [60, 102], [56, 97], [56, 87]]],
    details: [[[66, 81], [66, 90], [63, 99]]],
  },
  {
    id: 'triceps',
    mirror: true,
    shapes: [[[47, 107], [53, 105], [59, 107], [62, 116], [62, 128], [59, 140], [54, 147], [48, 145], [44, 136], [43, 122], [44, 112]]],
    details: [[[53, 108], [53, 116], [53, 124]], [[53, 124], [50, 133], [48, 141]], [[53, 124], [56, 132], [58, 139]]],
  },
  { id: 'forearms', mirror: true, shapes: [FOREARM], details: FOREARM_LINES },
  {
    id: 'lats',
    mirror: true,
    shapes: [[[66, 103], [72, 98], [80, 95], [87, 103], [92, 116], [95, 132], [95, 148], [90, 156], [82, 157], [75, 150], [70, 138], [67, 122]]],
    details: [[[71, 106], [82, 121], [92, 140]], [[69, 121], [78, 135], [88, 152]]],
  },
  {
    id: 'lower-back',
    shapes: [[[90, 154], [100, 152], [110, 154], [114, 166], [113, 180], [108, 188], [100, 191], [92, 188], [87, 180], [86, 166]]],
    details: [[[100, 155], [100, 172], [100, 188]], [[94, 158], [93, 172], [94, 185]], [[106, 158], [107, 172], [106, 185]]],
  },
  {
    id: 'glutes',
    mirror: true,
    shapes: [[[69, 193], [78, 189], [88, 190], [97, 195], [99, 206], [98, 217], [92, 224], [82, 226], [73, 223], [67, 214], [66, 202]]],
    details: [[[72, 211], [83, 220], [95, 217]]],
  },
  {
    id: 'hamstrings',
    mirror: true,
    shapes: [[[69, 231], [78, 229], [88, 229], [95, 232], [95, 246], [93, 260], [89, 271], [82, 275], [75, 272], [70, 262], [67, 246]]],
    details: [[[81, 232], [82, 252], [81, 271]]],
  },
  {
    id: 'calves',
    mirror: true,
    shapes: [[
      [71, 288], [78, 283], [85, 283], [91, 288], [93, 302], [92, 316], [88, 330], [84, 342], [80, 347], [76, 340],
      [72, 326], [70, 310], [70, 296],
    ]],
    details: [[[81, 286], [81, 312], [81, 339]]],
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
export type Figure = { outline: Point[]; head: Point[]; extras: Point[][]; muscles: FigureMuscle[] }

/** Everything needed to draw one figure: outline, head and every muscle in that view. */
export function buildFigure(view: View, kind: FigureKind): Figure {
  const drawings = view === 'front' ? FRONT : BACK
  const outline = [...OUTLINE_HALF, ...OUTLINE_HALF.map(mirrorPoint).reverse()]
  return {
    outline: reshape(kind, outline),
    head: HEAD,
    extras: view === 'front' ? [KNEE, KNEE.map(mirrorPoint)].map((shape) => reshape(kind, shape)) : [],
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
