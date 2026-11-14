import type { MuscleId } from '../bodymap/muscles'

/**
 * free-exercise-db names muscles differently from Swole. This file turns its
 * names into the 17 groups drawn on the body map.
 *
 * Two of its names need the exercise name to decide:
 * - "shoulders" covers all three delts, so the name says which ones.
 * - "abdominals" covers the obliques too, so twisting and side-bending
 *   exercises are moved to the obliques.
 */

/** Dataset names that map straight onto one Swole group. */
const DIRECT: Record<string, MuscleId> = {
  abdominals: 'abs',
  biceps: 'biceps',
  calves: 'calves',
  chest: 'chest',
  forearms: 'forearms',
  glutes: 'glutes',
  hamstrings: 'hamstrings',
  lats: 'lats',
  'lower back': 'lower-back',
  neck: 'neck',
  quadriceps: 'quads',
  traps: 'traps',
  triceps: 'triceps',
  // Not drawn on the body map, so they go to the nearest group that is.
  'middle back': 'lats',
  adductors: 'quads',
  abductors: 'glutes',
}

const has = (name: string, words: readonly string[]) => words.some((w) => name.includes(w))

const REAR = ['rear', 'reverse fly', 'reverse flye', 'reverse machine fly', 'face pull', 'pull apart', 'back fly', 'bent over', 'bent-over']
const SIDE = ['lateral', 'upright', 'side raise']
const FRONT = ['front']
const OBLIQUE = ['oblique', 'twist', 'side bend', 'windmill', 'wood chop', 'woodchop', 'rotation', 'side bridge', 'side jackknife']

/** Which delts a "shoulders" exercise works, judged from its name. */
export function deltsFor(exerciseName: string): MuscleId[] {
  const name = exerciseName.toLowerCase()
  if (has(name, REAR)) return ['rear-delts']
  const side = has(name, SIDE)
  const front = has(name, FRONT)
  if (side && front) return ['side-delts', 'front-delts']
  if (side) return ['side-delts']
  if (front) return ['front-delts']
  // Presses and everything else work the front and side together.
  return ['front-delts', 'side-delts']
}

/** Swole groups for a list of dataset muscle names, in order, without repeats. */
export function mapMuscles(datasetNames: readonly string[], exerciseName: string): MuscleId[] {
  const out: MuscleId[] = []
  const add = (id: MuscleId) => {
    if (!out.includes(id)) out.push(id)
  }
  const twisting = has(exerciseName.toLowerCase(), OBLIQUE)
  for (const raw of datasetNames) {
    if (raw === 'shoulders') deltsFor(exerciseName).forEach(add)
    else if (raw === 'abdominals' && twisting) add('obliques')
    else if (DIRECT[raw]) add(DIRECT[raw])
  }
  return out
}
