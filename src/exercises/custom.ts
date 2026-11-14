import type { MuscleId } from '../bodymap/muscles'
import { db as defaultDb, type SwoleDb } from '../db/db'
import { customNumber } from './library'

/** Tidies a typed name: trimmed, single spaces. Empty means "not a name". */
export function cleanName(name: string): string {
  return name.replace(/\s+/g, ' ').trim()
}

/** Save a new exercise of the owner's own. Returns its number in storage. */
export async function addCustomExercise(
  input: { name: string; muscles: readonly MuscleId[]; equipment: string },
  db: SwoleDb = defaultDb,
): Promise<number> {
  const name = cleanName(input.name)
  if (!name) throw new Error('An exercise needs a name')
  if (input.muscles.length === 0) throw new Error('An exercise needs at least one muscle')
  return db.customExercises.add({ name, muscles: [...input.muscles], equipment: input.equipment } as never) as Promise<number>
}

/**
 * Delete one of the owner's own exercises. Workouts that used it keep their
 * sets; they show it as a removed exercise.
 */
export async function deleteCustomExercise(exerciseId: string, db: SwoleDb = defaultDb) {
  const id = customNumber(exerciseId)
  if (id !== null) await db.customExercises.delete(id)
}
