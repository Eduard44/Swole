import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useMemo, useState } from 'react'
import { db } from '../db/db'
import { fromCustom, toExercise, type Exercise, type RawExercise } from './library'

let cache: Exercise[] | null = null

/**
 * The exercise list: the built-in exercises plus the owner's own.
 * The built-in list is a separate file inside the app, loaded the first time
 * it is needed so the body map opens without waiting for it.
 */
export function useExercises(): Exercise[] | null {
  const [builtIn, setBuiltIn] = useState<Exercise[] | null>(cache)
  const custom = useLiveQuery(() => db.customExercises.toArray(), [])

  useEffect(() => {
    if (cache) return
    let alive = true
    import('./data.json').then((module) => {
      cache = (module.default as RawExercise[]).map(toExercise)
      if (alive) setBuiltIn(cache)
    })
    return () => {
      alive = false
    }
  }, [])

  return useMemo(
    () => (builtIn && custom ? [...custom.map(fromCustom), ...builtIn] : null),
    [builtIn, custom],
  )
}
