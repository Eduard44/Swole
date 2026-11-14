import 'fake-indexeddb/auto'
import { describe, expect, it } from 'vitest'
import { MUSCLES } from '../bodymap/muscles'
import data from './data.json'
import { SwoleDb } from '../db/db'
import { addCustomExercise, cleanName, deleteCustomExercise } from './custom'
import { countByMuscle, customId, customNumber, filterExercises, fromCustom, normalize, toExercise, type RawExercise } from './library'
import { deltsFor, mapMuscles } from './mapping'

const all = (data as RawExercise[]).map(toExercise)
const byName = (name: string) => all.find((e) => e.name === name)!
const filters = { query: '', muscles: [], equipment: [] }

describe('muscle mapping', () => {
  it('splits shoulder exercises into the right delts', () => {
    expect(deltsFor('Face Pull')).toEqual(['rear-delts'])
    expect(deltsFor('Bent Over Low-Pulley Side Lateral')).toEqual(['rear-delts'])
    expect(deltsFor('Side Lateral Raise')).toEqual(['side-delts'])
    expect(deltsFor('Upright Barbell Row')).toEqual(['side-delts'])
    expect(deltsFor('Front Dumbbell Raise')).toEqual(['front-delts'])
    expect(deltsFor('Standing Military Press')).toEqual(['front-delts', 'side-delts'])
  })

  it('moves twisting core work to the obliques', () => {
    expect(mapMuscles(['abdominals'], 'Russian Twist')).toEqual(['obliques'])
    expect(mapMuscles(['abdominals'], 'Crunches')).toEqual(['abs'])
  })

  it('maps groups the body map does not draw onto the nearest one', () => {
    expect(mapMuscles(['middle back', 'adductors', 'abductors'], 'Anything')).toEqual(['lats', 'quads', 'glutes'])
  })

  it('gives every exercise at least one main muscle', () => {
    expect(all.filter((e) => e.primary.length === 0)).toEqual([])
  })

  it('has exercises for every one of the 17 muscle groups', () => {
    const counts = countByMuscle(all)
    for (const muscle of MUSCLES) expect(counts.get(muscle.id) ?? 0).toBeGreaterThan(0)
  })

  it('never lists a muscle as both main and secondary', () => {
    for (const e of all) expect(e.secondary.some((m) => e.primary.includes(m))).toBe(false)
  })
})

describe('search and filters', () => {
  it('ignores case, hyphens and word order', () => {
    expect(normalize('Push-Ups')).toBe('push ups')
    const names = filterExercises(all, { ...filters, query: 'PRESS bench' }).map((e) => e.name)
    expect(names).toContain('Barbell Bench Press - Medium Grip')
  })

  it('filters by the muscles picked on the body map', () => {
    const chest = filterExercises(all, { ...filters, muscles: ['chest'] })
    expect(chest.length).toBeGreaterThan(20)
    for (const e of chest) expect(e.primary).toContain('chest')
  })

  it('filters by equipment', () => {
    const result = filterExercises(all, { ...filters, muscles: ['biceps'], equipment: ['dumbbell'] })
    expect(result.length).toBeGreaterThan(0)
    for (const e of result) expect(e.equipment).toBe('dumbbell')
  })

  it('lists lifts before stretches', () => {
    const result = filterExercises(all, { ...filters, muscles: ['hamstrings'] })
    const firstStretch = result.findIndex((e) => e.category === 'stretching')
    const lastLift = result.map((e) => e.category).lastIndexOf('strength')
    expect(firstStretch).toBeGreaterThan(lastLift)
  })

  it('finds a well-known exercise', () => {
    expect(byName('Barbell Squat').primary).toContain('quads')
  })
})

describe('your own exercises', () => {
  it('tidies names', () => {
    expect(cleanName('  Cable   Y-Raise ')).toBe('Cable Y-Raise')
  })

  it('saves one and shows it like any other exercise', async () => {
    const db = new SwoleDb('custom-test-1')
    const id = await addCustomExercise({ name: ' Cable  Y-Raise', muscles: ['side-delts'], equipment: 'cable' }, db)
    const [row] = await db.customExercises.toArray()
    const exercise = fromCustom(row)
    expect(exercise).toMatchObject({ id: customId(id), name: 'Cable Y-Raise', primary: ['side-delts'], equipment: 'cable', custom: true })
    const found = filterExercises([exercise, ...all], { query: 'y raise', muscles: ['side-delts'], equipment: ['cable'] })
    expect(found[0].id).toBe(customId(id))
  })

  it('refuses an exercise with no name or no muscle', async () => {
    const db = new SwoleDb('custom-test-2')
    await expect(addCustomExercise({ name: '  ', muscles: ['chest'], equipment: 'other' }, db)).rejects.toThrow()
    await expect(addCustomExercise({ name: 'Thing', muscles: [], equipment: 'other' }, db)).rejects.toThrow()
  })

  it('deletes only custom exercises', async () => {
    const db = new SwoleDb('custom-test-3')
    const id = await addCustomExercise({ name: 'Thing', muscles: ['chest'], equipment: 'other' }, db)
    expect(customNumber('Barbell_Squat')).toBeNull()
    await deleteCustomExercise('Barbell_Squat', db)
    expect(await db.customExercises.count()).toBe(1)
    await deleteCustomExercise(customId(id), db)
    expect(await db.customExercises.count()).toBe(0)
  })
})
