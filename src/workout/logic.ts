import type { WorkoutSet } from '../db/db'

/**
 * The plain rules behind workout logging, kept apart from storage and screens
 * so they can be tested.
 */

/** Reads a number typed by hand. Accepts "82.5" and "82,5"; anything else is empty. */
export function parseNumber(text: string): number | null {
  const cleaned = text.trim().replace(',', '.')
  if (cleaned === '') return null
  const value = Number(cleaned)
  return Number.isFinite(value) && value >= 0 ? value : null
}

/** A weight or rep count for an input box: no trailing ".0", empty when unknown. */
export function formatNumber(value: number | null): string {
  if (value === null) return ''
  return String(Math.round(value * 100) / 100)
}

/** "80 × 8": one set, for the "last time" line. Sets with no reps are left out. */
export function describeSet(set: WorkoutSet): string | null {
  if (set.reps === null) return null
  return set.weight === null || set.weight === 0 ? `${set.reps} reps` : `${formatNumber(set.weight)} × ${set.reps}`
}

/** "80 × 8, 80 × 8, 75 × 7" */
export function describeSets(sets: readonly WorkoutSet[]): string {
  return sets.map(describeSet).filter(Boolean).join(', ')
}

/**
 * The numbers a new set starts with: the set above it in this workout, or
 * else the matching set from last time, or else empty boxes.
 */
export function nextSet(current: readonly WorkoutSet[], lastTime: readonly WorkoutSet[] | null): WorkoutSet {
  const above = current[current.length - 1]
  const source = above ?? lastTime?.[current.length] ?? lastTime?.[lastTime.length - 1]
  return { weight: source?.weight ?? null, reps: source?.reps ?? null, done: false }
}

/** What a finished workout keeps: only ticked sets, and only exercises that have one. */
export function keepDone<T extends { sets: WorkoutSet[] }>(exercises: readonly T[]): T[] {
  return exercises
    .map((exercise) => ({ ...exercise, sets: exercise.sets.filter((s) => s.done) }))
    .filter((exercise) => exercise.sets.length > 0)
}

/** How many sets have not been ticked yet. */
export function openSets(exercises: readonly { sets: WorkoutSet[] }[]): number {
  return exercises.reduce((n, e) => n + e.sets.filter((s) => !s.done).length, 0)
}

/* ---------- Rest timer ---------- */

export const REST_DEFAULT = 90
export const REST_MIN = 15
export const REST_MAX = 600
export const REST_STEP = 15

export function clampRest(seconds: number): number {
  return Math.min(REST_MAX, Math.max(REST_MIN, Math.round(seconds)))
}

/** Whole seconds left until endsAt, never below zero. */
export function secondsLeft(endsAt: number, now: number): number {
  return Math.max(0, Math.ceil((endsAt - now) / 1000))
}

/** "1:05" */
export function clock(seconds: number): string {
  const s = Math.max(0, Math.round(seconds))
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/** "32 min", "1 h 05 min" */
export function duration(ms: number): string {
  const minutes = Math.max(0, Math.floor(ms / 60000))
  if (minutes < 60) return `${minutes} min`
  return `${Math.floor(minutes / 60)} h ${String(minutes % 60).padStart(2, '0')} min`
}
