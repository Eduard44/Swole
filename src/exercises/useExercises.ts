import { useEffect, useState } from 'react'
import { toExercise, type Exercise, type RawExercise } from './library'

let cache: Exercise[] | null = null

/**
 * The exercise list. It is a separate file inside the app, loaded the first
 * time it is needed so the body map opens without waiting for it.
 */
export function useExercises(): Exercise[] | null {
  const [list, setList] = useState<Exercise[] | null>(cache)
  useEffect(() => {
    if (cache) return
    let alive = true
    import('./data.json').then((module) => {
      cache = (module.default as RawExercise[]).map(toExercise)
      if (alive) setList(cache)
    })
    return () => {
      alive = false
    }
  }, [])
  return list
}
