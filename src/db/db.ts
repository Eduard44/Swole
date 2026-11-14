import Dexie, { type EntityTable } from 'dexie'
import type { MuscleId } from '../bodymap/muscles'

/**
 * Everything Swole saves lives here, in the phone's own storage (IndexedDB).
 * Nothing is sent anywhere.
 *
 * Weights are always saved in kilograms; the units setting only changes how
 * they are shown and typed.
 */

export type WorkoutSet = {
  /** Kilograms, or null while the box is empty. */
  weight: number | null
  reps: number | null
  done: boolean
}

export type Session = {
  id: number
  startedAt: number
  /** Null while the workout is still running. */
  finishedAt: number | null
  /** The muscles picked on the body map when the workout started. */
  muscles: MuscleId[]
}

/** One exercise inside a workout, with its sets. */
export type SessionExercise = {
  id: number
  sessionId: number
  exerciseId: string
  /** Position in the workout, smallest first. */
  order: number
  sets: WorkoutSet[]
}

/** The version of the saved data. Raise it, and add an upgrade, when the shape changes. */
export const SCHEMA_VERSION = 1

export class SwoleDb extends Dexie {
  sessions!: EntityTable<Session, 'id'>
  sessionExercises!: EntityTable<SessionExercise, 'id'>

  constructor(name = 'swole') {
    super(name)
    this.version(SCHEMA_VERSION).stores({
      sessions: '++id, startedAt, finishedAt',
      sessionExercises: '++id, sessionId, exerciseId',
    })
  }
}

export const db = new SwoleDb()
