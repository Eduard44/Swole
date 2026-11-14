import { MUSCLES, type MuscleId } from '../bodymap/muscles'

/**
 * Recovery rules: how rested each muscle is, worked out from finished
 * workouts. Plain rules on the device, no online service.
 *
 * - Just trained: for the first 24 hours after a workout that worked it.
 * - Recovering: until 48 hours, or 72 hours for the bigger muscles.
 * - Fresh: after that, or if it has never been trained.
 *
 * A workout counts for the muscles its exercises mainly work.
 */

export type RecoveryState = 'fresh' | 'recovering' | 'trained'

export const HOUR = 3_600_000
export const TRAINED_HOURS = 24
export const RECOVERY_HOURS = 48
export const BIG_MUSCLE_RECOVERY_HOURS = 72

/** The bigger muscles, which take longer to recover. */
export const BIG_MUSCLES: readonly MuscleId[] = ['quads', 'hamstrings', 'glutes', 'lats', 'chest']

export function recoveryHours(muscle: MuscleId): number {
  return BIG_MUSCLES.includes(muscle) ? BIG_MUSCLE_RECOVERY_HOURS : RECOVERY_HOURS
}

/** The state of one muscle, given when it was last trained (null = never). */
export function stateOf(muscle: MuscleId, lastTrainedAt: number | null, now: number): RecoveryState {
  if (lastTrainedAt === null) return 'fresh'
  const hours = (now - lastTrainedAt) / HOUR
  if (hours < TRAINED_HOURS) return 'trained'
  if (hours < recoveryHours(muscle)) return 'recovering'
  return 'fresh'
}

/** A finished workout, reduced to what the rules need. */
export type TrainedWorkout = { finishedAt: number; muscles: readonly MuscleId[] }

/** When each muscle was last trained. Muscles never trained are missing. */
export function lastTrained(workouts: readonly TrainedWorkout[]): Map<MuscleId, number> {
  const out = new Map<MuscleId, number>()
  for (const workout of workouts)
    for (const muscle of workout.muscles)
      if ((out.get(muscle) ?? 0) < workout.finishedAt) out.set(muscle, workout.finishedAt)
  return out
}

/** The state of every muscle right now. */
export function recoveryStates(workouts: readonly TrainedWorkout[], now: number): Record<MuscleId, RecoveryState> {
  const last = lastTrained(workouts)
  const out = {} as Record<MuscleId, RecoveryState>
  for (const { id } of MUSCLES) out[id] = stateOf(id, last.get(id) ?? null, now)
  return out
}

/* ---------- What to train today ---------- */

/** Muscles that are usually trained together. */
export const GROUPS: readonly { id: string; name: string; muscles: readonly MuscleId[] }[] = [
  { id: 'push', name: 'Push', muscles: ['chest', 'front-delts', 'side-delts', 'triceps'] },
  { id: 'pull', name: 'Pull', muscles: ['lats', 'traps', 'rear-delts', 'biceps', 'forearms'] },
  { id: 'legs', name: 'Legs', muscles: ['quads', 'hamstrings', 'glutes', 'calves'] },
  { id: 'core', name: 'Core', muscles: ['abs', 'obliques', 'lower-back', 'neck'] },
]

export type Suggestion =
  | { kind: 'train'; group: string; muscles: MuscleId[] }
  /** Nothing is rested enough: every group still has muscles recovering. */
  | { kind: 'rest' }

/**
 * Today's focus: the group that is fully fresh and has waited longest.
 * A group never trained counts as having waited longest of all. If no group
 * is fully fresh, the suggestion is to rest.
 */
export function suggest(workouts: readonly TrainedWorkout[], now: number): Suggestion {
  const last = lastTrained(workouts)
  const states = recoveryStates(workouts, now)
  let best: { group: (typeof GROUPS)[number]; waited: number } | null = null
  for (const group of GROUPS) {
    if (!group.muscles.every((m) => states[m] === 'fresh')) continue
    // How long since any muscle in the group was trained (never = forever).
    const latest = Math.max(...group.muscles.map((m) => last.get(m) ?? -Infinity))
    const waited = now - latest
    if (!best || waited > best.waited) best = { group, waited }
  }
  return best ? { kind: 'train', group: best.group.name, muscles: [...best.group.muscles] } : { kind: 'rest' }
}
