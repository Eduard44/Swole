/**
 * Copies the exercise list from free-exercise-db into Swole, keeping only the
 * fields the app uses. Run it again to pick up a newer version of the dataset:
 *
 *   node scripts/import-exercises.mjs path/to/free-exercise-db/dist/exercises.json
 *
 * Muscle names are kept as the dataset spells them; src/exercises/mapping.ts
 * turns them into Swole's muscle groups.
 */
import { readFileSync, writeFileSync } from 'node:fs'

const source = process.argv[2]
if (!source) {
  console.error('Give the path to free-exercise-db/dist/exercises.json')
  process.exit(1)
}

const raw = JSON.parse(readFileSync(source, 'utf8'))
const trimmed = raw
  .map((e) => ({
    id: e.id,
    name: e.name.trim(),
    category: e.category,
    equipment: e.equipment ?? null,
    level: e.level,
    primary: e.primaryMuscles,
    secondary: e.secondaryMuscles,
    instructions: e.instructions.map((step) => step.trim()).filter(Boolean),
  }))
  .sort((a, b) => a.name.localeCompare(b.name))

writeFileSync(new URL('../src/exercises/data.json', import.meta.url), JSON.stringify(trimmed))
console.log(`Wrote ${trimmed.length} exercises`)
