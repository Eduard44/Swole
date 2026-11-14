import { useCallback, useEffect, useRef, useState } from 'react'
import { clampRest, REST_DEFAULT, secondsLeft } from './logic'

const LENGTH_KEY = 'swole.restLength'
const ENDS_KEY = 'swole.restEndsAt'

const read = (key: string): number | null => {
  try {
    const value = Number(localStorage.getItem(key))
    return Number.isFinite(value) && value > 0 ? value : null
  } catch {
    return null
  }
}
const write = (key: string, value: number | null) => {
  try {
    if (value === null) localStorage.removeItem(key)
    else localStorage.setItem(key, String(value))
  } catch {
    // Storage unavailable: the timer still works for this visit.
  }
}

/** Two short soft beeps. Needs an AudioContext made during a tap. */
function beep(context: AudioContext | null) {
  if (!context) return
  const start = context.currentTime
  for (const offset of [0, 0.25]) {
    const osc = context.createOscillator()
    const gain = context.createGain()
    osc.type = 'sine'
    osc.frequency.value = 880
    gain.gain.setValueAtTime(0.0001, start + offset)
    gain.gain.exponentialRampToValueAtTime(0.25, start + offset + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.18)
    osc.connect(gain).connect(context.destination)
    osc.start(start + offset)
    osc.stop(start + offset + 0.2)
  }
}

export type RestTimer = {
  /** Seconds left, or null when no rest is running. */
  left: number | null
  /** True for a few seconds after a rest ends. */
  over: boolean
  /** The rest length used for the next rest, in seconds. */
  length: number
  start: () => void
  /** Add or take away time from the running rest; also becomes the new rest length. */
  adjust: (seconds: number) => void
  skip: () => void
}

/**
 * The rest timer. It starts when a set is ticked, beeps and vibrates when the
 * rest is over, and survives a page reload. Phones may hold back the beep
 * while the screen is off or the app is in the background.
 */
export function useRestTimer(): RestTimer {
  const [length, setLength] = useState(() => clampRest(read(LENGTH_KEY) ?? REST_DEFAULT))
  const [endsAt, setEndsAt] = useState<number | null>(() => {
    const saved = read(ENDS_KEY)
    return saved && saved > Date.now() ? saved : null
  })
  const [now, setNow] = useState(() => Date.now())
  const [over, setOver] = useState(false)
  const audio = useRef<AudioContext | null>(null)

  useEffect(() => {
    if (endsAt === null) return
    const id = window.setInterval(() => {
      const t = Date.now()
      setNow(t)
      if (t >= endsAt) {
        setEndsAt(null)
        write(ENDS_KEY, null)
        setOver(true)
        beep(audio.current)
        try {
          navigator.vibrate?.([200, 100, 200])
        } catch {
          // Vibration not available.
        }
      }
    }, 250)
    return () => window.clearInterval(id)
  }, [endsAt])

  useEffect(() => {
    if (!over) return
    const id = window.setTimeout(() => setOver(false), 4000)
    return () => window.clearTimeout(id)
  }, [over])

  const start = useCallback(() => {
    // Sound is only allowed after a tap, and this runs from one.
    try {
      audio.current ??= new AudioContext()
      void audio.current.resume()
    } catch {
      audio.current = null
    }
    const t = Date.now()
    const ends = t + length * 1000
    setNow(t)
    setOver(false)
    setEndsAt(ends)
    write(ENDS_KEY, ends)
  }, [length])

  const adjust = useCallback(
    (seconds: number) => {
      setLength((current) => {
        const next = clampRest(current + seconds)
        write(LENGTH_KEY, next)
        return next
      })
      if (endsAt !== null) {
        const t = Date.now()
        const next = Math.max(t + 1000, endsAt + seconds * 1000)
        setNow(t)
        setEndsAt(next)
        write(ENDS_KEY, next)
      }
    },
    [endsAt],
  )

  const skip = useCallback(() => {
    setEndsAt(null)
    write(ENDS_KEY, null)
    setOver(false)
  }, [])

  return { left: endsAt === null ? null : secondsLeft(endsAt, now), over, length, start, adjust, skip }
}
