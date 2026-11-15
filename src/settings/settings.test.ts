import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { SwoleDb } from '../db/db'
import { addCustomExercise } from '../exercises/custom'
import { describeSet } from '../workout/logic'
import { addExercise, exercisesIn, finishSession, pastWorkouts, updateSet } from '../workout/store'
import { backupFileName, backupSummary, deleteEverything, makeBackup, parseBackup, restoreBackup } from './backup'
import { cleanSettings, DEFAULT_SETTINGS } from './settings'
import { fromDisplay, toDisplay } from './units'

describe('units', () => {
  it('shows kilograms as they are and converts pounds', () => {
    expect(toDisplay(82.5, 'kg')).toBe(82.5)
    expect(toDisplay(100, 'lb')).toBe(220.5)
    expect(toDisplay(null, 'lb')).toBeNull()
  })

  it('gives back the number that was typed in pounds', () => {
    for (const typed of [45, 135, 185, 225.5, 2.5]) expect(toDisplay(fromDisplay(typed, 'lb'), 'lb')).toBe(typed)
  })

  it('describes a set in the chosen units', () => {
    const set = { weight: 100, reps: 5, done: true }
    expect(describeSet(set, 'kg')).toBe('100 × 5')
    expect(describeSet(set, 'lb')).toBe('220.5 × 5')
  })
})

describe('settings', () => {
  it('falls back to the defaults for anything odd', () => {
    expect(cleanSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(cleanSettings({ units: 'stone', figure: 'robot', restLength: 'long' })).toEqual(DEFAULT_SETTINGS)
    expect(cleanSettings({ units: 'lb', figure: 'female', restLength: 5000 })).toEqual({ units: 'lb', figure: 'female', restLength: 600 })
  })
})

describe('backup', () => {
  async function filled(name: string) {
    const db = new SwoleDb(name)
    const id = await addExercise('Bench', ['chest'], db)
    const [entry] = await exercisesIn(id, db)
    await updateSet(entry.id, 0, { weight: 80, reps: 8, done: true }, db)
    await finishSession(id, db)
    await addCustomExercise({ name: 'Cable Y-Raise', muscles: ['side-delts'], equipment: 'cable' }, db)
    return db
  }

  it('names the file by date', () => {
    expect(backupFileName(new Date(2026, 10, 5))).toBe('swole-backup-2026-11-05.json')
  })

  it('comes back exactly as it went out, on another device', async () => {
    const from = await filled('backup-from')
    const settings = { units: 'lb', figure: 'female', restLength: 120 } as const
    const text = JSON.stringify(await makeBackup(settings, 'dark', from))

    const to = new SwoleDb('backup-to')
    await addExercise('Old thing', [], to)
    const backup = parseBackup(text)
    expect(backup.settings).toEqual(settings)
    expect(backup.theme).toBe('dark')
    expect(backupSummary(backup)).toBe('1 workout and 1 exercise of your own')
    await restoreBackup(backup, to)

    expect(await to.sessions.toArray()).toEqual(await from.sessions.toArray())
    expect(await to.sessionExercises.toArray()).toEqual(await from.sessionExercises.toArray())
    expect(await to.customExercises.toArray()).toEqual(await from.customExercises.toArray())
    expect((await pastWorkouts(to))[0].entries[0].sets).toEqual([{ weight: 80, reps: 8, done: true }])
  })

  it('refuses files that are not Swole backups, are damaged, or are too new', () => {
    expect(() => parseBackup('hello')).toThrow('not a Swole backup')
    expect(() => parseBackup('{"app":"other"}')).toThrow('not a Swole backup')
    expect(() => parseBackup('{"app":"swole","schema":1,"sessions":"x","sessionExercises":[]}')).toThrow('damaged')
    expect(() => parseBackup('{"app":"swole","schema":1,"sessions":[{"id":"a"}],"sessionExercises":[]}')).toThrow('damaged')
    expect(() => parseBackup('{"app":"swole","schema":999,"sessions":[],"sessionExercises":[]}')).toThrow('newer version')
  })

  it('reads a backup from before your own exercises existed', () => {
    const backup = parseBackup('{"app":"swole","schema":1,"sessions":[],"sessionExercises":[]}')
    expect(backup.customExercises).toEqual([])
    expect(backup.settings).toEqual(DEFAULT_SETTINGS)
  })

  it('deletes everything', async () => {
    const db = await filled('backup-delete')
    await deleteEverything(db)
    expect(await db.sessions.count()).toBe(0)
    expect(await db.sessionExercises.count()).toBe(0)
    expect(await db.customExercises.count()).toBe(0)
  })
})
