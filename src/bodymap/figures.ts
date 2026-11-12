import type { Point } from '../drawn/paths'
import type { MuscleId } from './muscles'

/**
 * The figure drawings, as lists of points on a 200 x 400 sheet (centre line x = 100).
 * Each shape is drawn for the left half only; "mirror" copies it to the right half.
 * The drawing code (BodyMap) turns these points into wobbly pencil shapes.
 *
 * These are first-draft figures. To reshape a muscle, move its points here.
 */

export type View = 'front' | 'back'
export type FigureKind = 'male' | 'female'

type MuscleDrawing = {
  id: MuscleId
  /** Copy each shape to the other side of the body. */
  mirror?: boolean
  shapes: Point[][]
  /** Faint inner pencil lines (for example the lines across the abs). */
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

const FOREARM: Point[] = [[41, 152], [53, 151], [52, 172], [47, 198], [38, 200], [35, 178], [37, 162]]
const SIDE_DELT: Point[] = [[49, 82], [57, 77], [57, 90], [55, 102], [48, 104], [46, 92]]

const FRONT: MuscleDrawing[] = [
  { id: 'neck', shapes: [[[93, 56], [107, 56], [109, 66], [100, 71], [91, 66]]] },
  { id: 'traps', mirror: true, shapes: [[[90, 62], [89, 69], [76, 73], [64, 74], [78, 67]]] },
  { id: 'side-delts', mirror: true, shapes: [SIDE_DELT] },
  { id: 'front-delts', mirror: true, shapes: [[[62, 77], [73, 76], [74, 88], [69, 98], [62, 97], [59, 88]]] },
  { id: 'chest', mirror: true, shapes: [[[76, 78], [98, 80], [98, 104], [90, 111], [78, 110], [71, 102], [72, 88]]] },
  { id: 'biceps', mirror: true, shapes: [[[47, 107], [58, 104], [61, 120], [59, 138], [52, 146], [44, 140], [43, 122]]] },
  { id: 'forearms', mirror: true, shapes: [FOREARM] },
  {
    id: 'abs',
    shapes: [[[88, 113], [112, 113], [114, 140], [112, 166], [106, 184], [100, 190], [94, 184], [88, 166], [86, 140]]],
    details: [
      [[100, 117], [100, 150], [100, 185]],
      [[89, 131], [100, 133], [111, 131]],
      [[89, 149], [100, 151], [111, 149]],
      [[90, 167], [100, 169], [110, 167]],
    ],
  },
  { id: 'obliques', mirror: true, shapes: [[[72, 113], [84, 115], [84, 150], [86, 172], [90, 185], [78, 181], [70, 164], [68, 138]]] },
  { id: 'quads', mirror: true, shapes: [[[68, 197], [82, 193], [96, 211], [95, 240], [91, 268], [80, 272], [71, 262], [66, 230]]] },
  { id: 'calves', mirror: true, shapes: [[[73, 290], [88, 290], [90, 315], [87, 345], [80, 356], [75, 345], [71, 315]]] },
]

const BACK: MuscleDrawing[] = [
  { id: 'neck', shapes: [[[93, 55], [107, 55], [108, 63], [100, 66], [92, 63]]] },
  {
    id: 'traps',
    shapes: [[[100, 64], [108, 67], [124, 72], [136, 76], [120, 84], [108, 104], [100, 124], [92, 104], [80, 84], [64, 76], [76, 72], [92, 67]]],
    details: [[[100, 68], [100, 95], [100, 120]]],
  },
  { id: 'side-delts', mirror: true, shapes: [SIDE_DELT] },
  { id: 'rear-delts', mirror: true, shapes: [[[59, 79], [70, 81], [73, 92], [67, 100], [59, 98], [56, 88]]] },
  { id: 'triceps', mirror: true, shapes: [[[46, 108], [58, 105], [61, 122], [58, 140], [51, 147], [44, 140], [42, 122]]] },
  { id: 'forearms', mirror: true, shapes: [FOREARM] },
  { id: 'lats', mirror: true, shapes: [[[66, 102], [78, 93], [88, 106], [93, 128], [93, 150], [84, 158], [74, 150], [68, 128]]] },
  {
    id: 'lower-back',
    shapes: [[[90, 155], [110, 155], [114, 170], [110, 186], [100, 190], [90, 186], [86, 170]]],
    details: [[[100, 158], [100, 172], [100, 187]]],
  },
  { id: 'glutes', mirror: true, shapes: [[[68, 193], [84, 189], [98, 195], [98, 214], [90, 224], [76, 224], [66, 212]]] },
  { id: 'hamstrings', mirror: true, shapes: [[[68, 231], [80, 229], [94, 231], [93, 254], [89, 272], [78, 274], [70, 262]]] },
  { id: 'calves', mirror: true, shapes: [[[71, 287], [80, 283], [90, 287], [92, 308], [88, 334], [81, 346], [75, 334], [70, 308]]] },
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
      details: (drawing.details ?? []).map((line) => reshape(kind, line)),
    })),
  }
}

/** Which muscle groups can be seen in a view. */
export function musclesInView(view: View): MuscleId[] {
  return (view === 'front' ? FRONT : BACK).map((d) => d.id)
}
