import type { MuscleId } from '../bodymap/muscles'
import { db as defaultDb, type Session, type SessionExercise, type SwoleDb, type WorkoutSet } from '../db/db'
import { keepDone, nextSet } from './logic'

/**
 * Reading and changing saved workouts. Every function takes the database as
 * its last argument so tests can use a fresh one.
 */

/** The workout that is still running, if there is one. */
export async function activeSession(db: SwoleDb = defaultDb) {
  const running = await db.sessions.filter((s) => s.finishedAt === null).toArray()
  return running.sort((a, b) => b.startedAt - a.startedAt)[0] ?? null
}

export async function startSession(muscles: readonly MuscleId[], db: SwoleDb = defaultDb): Promise<number> {
  const running = await activeSession(db)
  if (running) return running.id
  return db.sessions.add({ startedAt: Date.now(), finishedAt: null, muscles: [...muscles] }) as Promise<number>
}

export async function exercisesIn(sessionId: number, db: SwoleDb = defaultDb): Promise<SessionExercise[]> {
  const list = await db.sessionExercises.where('sessionId').equals(sessionId).toArray()
  return list.sort((a, b) => a.order - b.order)
}

/** The sets done for this exercise in the most recent finished workout, or null. */
export async function lastTime(exerciseId: string, db: SwoleDb = defaultDb): Promise<{ sets: WorkoutSet[]; at: number } | null> {
  const entries = await db.sessionExercises.where('exerciseId').equals(exerciseId).toArray()
  let best: { sets: WorkoutSet[]; at: number } | null = null
  for (const entry of entries) {
    const session = await db.sessions.get(entry.sessionId)
    if (!session?.finishedAt) continue
    if (!best || session.finishedAt > best.at) best = { sets: entry.sets, at: session.finishedAt }
  }
  return best
}

/**
 * Add an exercise to the running workout (starting one if needed), with one
 * set ready to fill in. Returns the workout's id.
 */
export async function addExercise(exerciseId: string, muscles: readonly MuscleId[], db: SwoleDb = defaultDb): Promise<number> {
  const sessionId = await startSession(muscles, db)
  const current = await exercisesIn(sessionId, db)
  const previous = await lastTime(exerciseId, db)
  await db.sessionExercises.add({
    sessionId,
    exerciseId,
    order: current.length ? current[current.length - 1].order + 1 : 0,
    sets: [nextSet([], previous?.sets ?? null)],
  } as SessionExercise)
  return sessionId
}

export async function addSet(entryId: number, db: SwoleDb = defaultDb) {
  const entry = await db.sessionExercises.get(entryId)
  if (!entry) return
  const previous = await lastTime(entry.exerciseId, db)
  await db.sessionExercises.update(entryId, { sets: [...entry.sets, nextSet(entry.sets, previous?.sets ?? null)] })
}

export async function updateSet(entryId: number, index: number, change: Partial<WorkoutSet>, db: SwoleDb = defaultDb) {
  const entry = await db.sessionExercises.get(entryId)
  if (!entry || !entry.sets[index]) return
  const sets = entry.sets.map((set, i) => (i === index ? { ...set, ...change } : set))
  await db.sessionExercises.update(entryId, { sets })
}

export async function removeSet(entryId: number, index: number, db: SwoleDb = defaultDb) {
  const entry = await db.sessionExercises.get(entryId)
  if (!entry) return
  await db.sessionExercises.update(entryId, { sets: entry.sets.filter((_, i) => i !== index) })
}

export async function removeExercise(entryId: number, db: SwoleDb = defaultDb) {
  await db.sessionExercises.delete(entryId)
}

/**
 * Finish the running workout. Only ticked sets are kept; an exercise with no
 * ticked sets is dropped, and a workout with nothing ticked is not kept at all.
 */
export async function finishSession(sessionId: number, db: SwoleDb = defaultDb) {
  await db.transaction('rw', db.sessions, db.sessionExercises, async () => {
    const entries = await exercisesIn(sessionId, db)
    const kept = keepDone(entries)
    const keptIds = new Set(kept.map((e) => e.id))
    await db.sessionExercises.bulkDelete(entries.filter((e) => !keptIds.has(e.id)).map((e) => e.id))
    for (const entry of kept) await db.sessionExercises.update(entry.id, { sets: entry.sets })
    if (kept.length === 0) await db.sessions.delete(sessionId)
    else await db.sessions.update(sessionId, { finishedAt: Date.now() })
  })
}

/** Throw the running workout away. */
export async function discardSession(sessionId: number, db: SwoleDb = defaultDb) {
  await db.transaction('rw', db.sessions, db.sessionExercises, async () => {
    await db.sessionExercises.where('sessionId').equals(sessionId).delete()
    await db.sessions.delete(sessionId)
  })
}

/** A finished workout with what was done in it. */
export type PastWorkout = { session: Session; entries: SessionExercise[] }

/** Finished workouts, newest first. */
export async function pastWorkouts(db: SwoleDb = defaultDb): Promise<PastWorkout[]> {
  const sessions = (await db.sessions.toArray())
    .filter((s) => s.finishedAt !== null)
    .sort((a, b) => (b.finishedAt ?? 0) - (a.finishedAt ?? 0))
  return Promise.all(sessions.map(async (session) => ({ session, entries: await exercisesIn(session.id, db) })))
}

/** Delete one finished workout and its sets. */
export async function deleteWorkout(sessionId: number, db: SwoleDb = defaultDb) {
  await discardSession(sessionId, db)
}
