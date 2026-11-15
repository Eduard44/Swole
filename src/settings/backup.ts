import { db as defaultDb, SCHEMA_VERSION, type CustomExercise, type Session, type SessionExercise, type SwoleDb } from '../db/db'
import { cleanSettings, type Settings } from './settings'

/**
 * Backup: everything saved on the device as one JSON file, and reading such a
 * file back in. Importing replaces what is on the device.
 */

export type Backup = {
  app: 'swole'
  /** The version of the saved data when the backup was made. */
  schema: number
  exportedAt: string
  settings: Settings
  theme: string
  sessions: Session[]
  sessionExercises: SessionExercise[]
  customExercises: CustomExercise[]
}

export async function makeBackup(settings: Settings, theme: string, db: SwoleDb = defaultDb): Promise<Backup> {
  return {
    app: 'swole',
    schema: SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    settings,
    theme,
    sessions: await db.sessions.toArray(),
    sessionExercises: await db.sessionExercises.toArray(),
    customExercises: await db.customExercises.toArray(),
  }
}

/** "swole-backup-2026-11-15.json" */
export function backupFileName(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0')
  return `swole-backup-${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}.json`
}

const isList = (value: unknown): value is Record<string, unknown>[] =>
  Array.isArray(value) && value.every((row) => row && typeof row === 'object')
const isNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value)

/**
 * Reads the text of a backup file. Throws an error with a plain message if it
 * is not a Swole backup, is damaged, or comes from a newer version of the app.
 */
export function parseBackup(text: string): Backup {
  let data: Record<string, unknown>
  try {
    data = JSON.parse(text)
  } catch {
    throw new Error('This file is not a Swole backup.')
  }
  if (!data || typeof data !== 'object' || data.app !== 'swole') throw new Error('This file is not a Swole backup.')
  if (!isNumber(data.schema)) throw new Error('This backup is damaged.')
  if (data.schema > SCHEMA_VERSION) throw new Error('This backup was made by a newer version of Swole. Update the app, then try again.')
  if (!isList(data.sessions) || !isList(data.sessionExercises)) throw new Error('This backup is damaged.')
  const customExercises = data.customExercises ?? []
  if (!isList(customExercises)) throw new Error('This backup is damaged.')

  for (const s of data.sessions)
    if (!isNumber(s.id) || !isNumber(s.startedAt) || !(s.finishedAt === null || isNumber(s.finishedAt)) || !Array.isArray(s.muscles))
      throw new Error('This backup is damaged.')
  for (const e of data.sessionExercises)
    if (!isNumber(e.id) || !isNumber(e.sessionId) || typeof e.exerciseId !== 'string' || !isNumber(e.order) || !Array.isArray(e.sets))
      throw new Error('This backup is damaged.')
  for (const c of customExercises)
    if (!isNumber(c.id) || typeof c.name !== 'string' || !Array.isArray(c.muscles) || typeof c.equipment !== 'string')
      throw new Error('This backup is damaged.')

  return {
    app: 'swole',
    schema: data.schema,
    exportedAt: typeof data.exportedAt === 'string' ? data.exportedAt : '',
    settings: cleanSettings(data.settings),
    theme: typeof data.theme === 'string' ? data.theme : 'system',
    sessions: data.sessions as unknown as Session[],
    sessionExercises: data.sessionExercises as unknown as SessionExercise[],
    customExercises: customExercises as unknown as CustomExercise[],
  }
}

/** Replace everything saved on the device with the contents of a backup. */
export async function restoreBackup(backup: Backup, db: SwoleDb = defaultDb) {
  await db.transaction('rw', db.sessions, db.sessionExercises, db.customExercises, async () => {
    await Promise.all([db.sessions.clear(), db.sessionExercises.clear(), db.customExercises.clear()])
    await db.sessions.bulkAdd(backup.sessions)
    await db.sessionExercises.bulkAdd(backup.sessionExercises)
    await db.customExercises.bulkAdd(backup.customExercises)
  })
}

/** Delete every workout and every exercise of your own from the device. */
export async function deleteEverything(db: SwoleDb = defaultDb) {
  await db.transaction('rw', db.sessions, db.sessionExercises, db.customExercises, async () => {
    await Promise.all([db.sessions.clear(), db.sessionExercises.clear(), db.customExercises.clear()])
  })
}

/** What a backup holds, in words: "12 workouts and 3 exercises of your own". */
export function backupSummary(backup: Pick<Backup, 'sessions' | 'customExercises'>): string {
  const workouts = backup.sessions.filter((s) => s.finishedAt !== null).length
  const own = backup.customExercises.length
  return `${workouts} workout${workouts === 1 ? '' : 's'} and ${own} exercise${own === 1 ? '' : 's'} of your own`
}
