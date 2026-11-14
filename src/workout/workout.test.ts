import 'fake-indexeddb/auto'
import { beforeEach, describe, expect, it } from 'vitest'
import { SwoleDb } from '../db/db'
import { clampRest, clock, describeSets, duration, keepDone, nextSet, parseNumber, secondsLeft } from './logic'
import {
  activeSession,
  addExercise,
  addSet,
  discardSession,
  exercisesIn,
  finishSession,
  lastTime,
  removeSet,
  updateSet,
} from './store'

describe('typing numbers', () => {
  it('reads dots and commas, and treats junk as empty', () => {
    expect(parseNumber('82.5')).toBe(82.5)
    expect(parseNumber('82,5')).toBe(82.5)
    expect(parseNumber('')).toBeNull()
    expect(parseNumber('abc')).toBeNull()
    expect(parseNumber('-5')).toBeNull()
  })
})

describe('sets', () => {
  const s = (weight: number | null, reps: number | null, done = true) => ({ weight, reps, done })

  it('describes last time in short form', () => {
    expect(describeSets([s(80, 8), s(80, 8), s(75, 7)])).toBe('80 × 8, 80 × 8, 75 × 7')
    expect(describeSets([s(null, 12), s(0, 10)])).toBe('12 reps, 10 reps')
  })

  it('starts a new set from the one above it', () => {
    expect(nextSet([s(60, 10)], [s(80, 8)])).toEqual(s(60, 10, false))
  })

  it('starts the first sets from the matching set last time', () => {
    const last = [s(80, 8), s(75, 7)]
    expect(nextSet([], last)).toEqual(s(80, 8, false))
    expect(nextSet([], null)).toEqual(s(null, null, false))
  })

  it('keeps only ticked sets when a workout is finished', () => {
    const kept = keepDone([
      { id: 1, sets: [s(80, 8), s(80, 8, false)] },
      { id: 2, sets: [s(20, 10, false)] },
    ])
    expect(kept).toEqual([{ id: 1, sets: [s(80, 8)] }])
  })
})

describe('rest timer', () => {
  it('counts down in whole seconds and stops at zero', () => {
    expect(secondsLeft(10_000, 0)).toBe(10)
    expect(secondsLeft(10_000, 9_001)).toBe(1)
    expect(secondsLeft(10_000, 12_000)).toBe(0)
  })

  it('keeps the rest length between 15 seconds and 10 minutes', () => {
    expect(clampRest(5)).toBe(15)
    expect(clampRest(9999)).toBe(600)
  })

  it('shows times the way people read them', () => {
    expect(clock(65)).toBe('1:05')
    expect(duration(32 * 60_000)).toBe('32 min')
    expect(duration(65 * 60_000)).toBe('1 h 05 min')
  })
})

describe('saving workouts', () => {
  let db: SwoleDb
  let n = 0
  beforeEach(() => {
    db = new SwoleDb(`test-${n++}`)
  })

  it('starts a workout when the first exercise is added', async () => {
    expect(await activeSession(db)).toBeNull()
    const id = await addExercise('Barbell_Squat', ['quads'], db)
    const session = await activeSession(db)
    expect(session?.id).toBe(id)
    expect(session?.muscles).toEqual(['quads'])
    const [entry] = await exercisesIn(id, db)
    expect(entry.exerciseId).toBe('Barbell_Squat')
    expect(entry.sets).toHaveLength(1)
  })

  it('adds, edits, ticks and removes sets', async () => {
    const id = await addExercise('Barbell_Squat', [], db)
    const [entry] = await exercisesIn(id, db)
    await updateSet(entry.id, 0, { weight: 100, reps: 5 }, db)
    await addSet(entry.id, db)
    await updateSet(entry.id, 1, { done: true }, db)
    let [after] = await exercisesIn(id, db)
    expect(after.sets).toEqual([
      { weight: 100, reps: 5, done: false },
      { weight: 100, reps: 5, done: true },
    ])
    await removeSet(entry.id, 0, db)
    ;[after] = await exercisesIn(id, db)
    expect(after.sets).toEqual([{ weight: 100, reps: 5, done: true }])
  })

  it('remembers last time and uses it to fill in the next workout', async () => {
    const first = await addExercise('Bench', [], db)
    const [entry] = await exercisesIn(first, db)
    await updateSet(entry.id, 0, { weight: 80, reps: 8, done: true }, db)
    await finishSession(first, db)
    expect(await activeSession(db)).toBeNull()
    expect((await lastTime('Bench', db))?.sets).toEqual([{ weight: 80, reps: 8, done: true }])

    const second = await addExercise('Bench', [], db)
    expect(second).not.toBe(first)
    const [next] = await exercisesIn(second, db)
    expect(next.sets[0]).toEqual({ weight: 80, reps: 8, done: false })
  })

  it('drops unticked work when finishing, and empty workouts entirely', async () => {
    const id = await addExercise('Bench', [], db)
    await addExercise('Curl', [], db)
    const [bench] = await exercisesIn(id, db)
    await updateSet(bench.id, 0, { weight: 60, reps: 10, done: true }, db)
    await finishSession(id, db)
    const kept = await exercisesIn(id, db)
    expect(kept.map((e) => e.exerciseId)).toEqual(['Bench'])

    const empty = await addExercise('Curl', [], db)
    await finishSession(empty, db)
    expect(await db.sessions.get(empty)).toBeUndefined()
  })

  it('throws a workout away when discarded', async () => {
    const id = await addExercise('Bench', [], db)
    await discardSession(id, db)
    expect(await activeSession(db)).toBeNull()
    expect(await exercisesIn(id, db)).toEqual([])
  })
})
