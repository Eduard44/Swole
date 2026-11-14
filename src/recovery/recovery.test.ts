import { describe, expect, it } from 'vitest'
import { HOUR, lastTrained, recoveryStates, stateOf, suggest } from './recovery'

const now = 1_000 * HOUR
const ago = (hours: number) => now - hours * HOUR

describe('recovery state', () => {
  it('is fresh for a muscle never trained', () => {
    expect(stateOf('biceps', null, now)).toBe('fresh')
  })

  it('moves from just trained to recovering to fresh', () => {
    expect(stateOf('biceps', ago(2), now)).toBe('trained')
    expect(stateOf('biceps', ago(23.9), now)).toBe('trained')
    expect(stateOf('biceps', ago(24), now)).toBe('recovering')
    expect(stateOf('biceps', ago(47.9), now)).toBe('recovering')
    expect(stateOf('biceps', ago(48), now)).toBe('fresh')
  })

  it('gives the bigger muscles 72 hours', () => {
    expect(stateOf('quads', ago(60), now)).toBe('recovering')
    expect(stateOf('quads', ago(72), now)).toBe('fresh')
  })

  it('uses the most recent workout for each muscle', () => {
    const workouts = [
      { finishedAt: ago(100), muscles: ['chest', 'triceps'] as const },
      { finishedAt: ago(30), muscles: ['chest'] as const },
    ]
    expect(lastTrained(workouts).get('chest')).toBe(ago(30))
    const states = recoveryStates(workouts, now)
    expect(states.chest).toBe('recovering')
    expect(states.triceps).toBe('fresh')
    expect(states.calves).toBe('fresh')
  })
})

describe('what to train today', () => {
  it('suggests something when nothing has been logged', () => {
    expect(suggest([], now).kind).toBe('train')
  })

  it('skips groups that are still recovering and picks the one that waited longest', () => {
    const workouts = [
      { finishedAt: ago(10), muscles: ['chest', 'front-delts', 'triceps'] as const },
      { finishedAt: ago(80), muscles: ['quads', 'hamstrings', 'glutes', 'calves'] as const },
      { finishedAt: ago(200), muscles: ['lats', 'biceps', 'traps', 'rear-delts', 'forearms'] as const },
      { finishedAt: ago(90), muscles: ['abs', 'obliques', 'lower-back', 'neck'] as const },
    ]
    const suggestion = suggest(workouts, now)
    expect(suggestion).toMatchObject({ kind: 'train', group: 'Pull' })
  })

  it('suggests rest when every group has something recovering', () => {
    const workouts = [
      { finishedAt: ago(5), muscles: ['chest', 'lats', 'quads', 'abs'] as const },
    ]
    expect(suggest(workouts, now)).toEqual({ kind: 'rest' })
  })
})
