import type { MuscleId } from '../bodymap/muscles'
import { mapMuscles } from './mapping'

/** One exercise as it comes from data.json (see scripts/import-exercises.mjs). */
export type RawExercise = {
  id: string
  name: string
  category: string
  equipment: string | null
  level: string
  primary: string[]
  secondary: string[]
  instructions: string[]
}

export type Equipment =
  | 'barbell'
  | 'dumbbell'
  | 'cable'
  | 'machine'
  | 'body only'
  | 'kettlebells'
  | 'bands'
  | 'e-z curl bar'
  | 'medicine ball'
  | 'exercise ball'
  | 'foam roll'
  | 'other'

/** Equipment in the order it appears in the filter, with the label shown. */
export const EQUIPMENT: readonly { id: Equipment; label: string }[] = [
  { id: 'barbell', label: 'Barbell' },
  { id: 'dumbbell', label: 'Dumbbell' },
  { id: 'cable', label: 'Cable' },
  { id: 'machine', label: 'Machine' },
  { id: 'body only', label: 'Bodyweight' },
  { id: 'kettlebells', label: 'Kettlebell' },
  { id: 'bands', label: 'Bands' },
  { id: 'e-z curl bar', label: 'EZ bar' },
  { id: 'medicine ball', label: 'Medicine ball' },
  { id: 'exercise ball', label: 'Exercise ball' },
  { id: 'foam roll', label: 'Foam roller' },
  { id: 'other', label: 'Other' },
]

export function equipmentLabel(id: Equipment): string {
  return EQUIPMENT.find((e) => e.id === id)?.label ?? 'Other'
}

export type Exercise = {
  id: string
  name: string
  category: string
  equipment: Equipment
  level: string
  /** Swole muscle groups this exercise mainly works. */
  primary: MuscleId[]
  /** Swole muscle groups it also works (never repeats a primary one). */
  secondary: MuscleId[]
  instructions: string[]
  /** The name in lower case with punctuation removed, for searching. */
  searchText: string
}

const KNOWN_EQUIPMENT = new Set<string>(EQUIPMENT.map((e) => e.id))

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

export function toExercise(raw: RawExercise): Exercise {
  const primary = mapMuscles(raw.primary, raw.name)
  const secondary = mapMuscles(raw.secondary, raw.name).filter((m) => !primary.includes(m))
  const equipment = (raw.equipment && KNOWN_EQUIPMENT.has(raw.equipment) ? raw.equipment : 'other') as Equipment
  return {
    id: raw.id,
    name: raw.name,
    category: raw.category,
    equipment,
    level: raw.level,
    primary,
    secondary,
    instructions: raw.instructions,
    searchText: normalize(raw.name),
  }
}

/** Gym lifts first, warm-ups and stretches last. */
const CATEGORY_ORDER = ['strength', 'powerlifting', 'olympic weightlifting', 'strongman', 'plyometrics', 'cardio', 'stretching']
const categoryRank = (category: string) => {
  const i = CATEGORY_ORDER.indexOf(category)
  return i === -1 ? CATEGORY_ORDER.length : i
}

export type Filters = {
  query: string
  /** Show exercises that mainly work any of these. Empty means all muscles. */
  muscles: readonly MuscleId[]
  /** Show exercises that use any of these. Empty means all equipment. */
  equipment: readonly Equipment[]
}

/** The exercises that match the search and filters, in the order to show them. */
export function filterExercises(all: readonly Exercise[], filters: Filters): Exercise[] {
  const words = normalize(filters.query).split(' ').filter(Boolean)
  return all
    .filter((e) => words.every((w) => e.searchText.includes(w)))
    .filter((e) => filters.muscles.length === 0 || e.primary.some((m) => filters.muscles.includes(m)))
    .filter((e) => filters.equipment.length === 0 || filters.equipment.includes(e.equipment))
    .sort((a, b) => categoryRank(a.category) - categoryRank(b.category) || a.name.localeCompare(b.name))
}

/** How many exercises mainly work each muscle group. */
export function countByMuscle(all: readonly Exercise[]): Map<MuscleId, number> {
  const counts = new Map<MuscleId, number>()
  for (const e of all) for (const m of e.primary) counts.set(m, (counts.get(m) ?? 0) + 1)
  return counts
}
