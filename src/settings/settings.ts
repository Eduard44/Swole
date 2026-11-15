import { useSyncExternalStore } from 'react'
import type { FigureKind } from '../bodymap/figures'
import { clampRest, REST_DEFAULT } from '../workout/logic'
import type { Units } from './units'

/** The choices on the Settings screen (the theme is kept separately, in src/theme). */
export type Settings = {
  units: Units
  figure: FigureKind
  /** Default rest between sets, in seconds. */
  restLength: number
}

export const DEFAULT_SETTINGS: Settings = { units: 'kg', figure: 'male', restLength: REST_DEFAULT }

const KEY = 'swole.settings'

/** Turns whatever was saved (or imported) into valid settings. Anything odd falls back to the default. */
export function cleanSettings(value: unknown): Settings {
  const v = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>
  return {
    units: v.units === 'lb' ? 'lb' : 'kg',
    figure: v.figure === 'female' ? 'female' : 'male',
    restLength: typeof v.restLength === 'number' && Number.isFinite(v.restLength) ? clampRest(v.restLength) : REST_DEFAULT,
  }
}

function load(): Settings {
  try {
    const saved = localStorage.getItem(KEY)
    if (saved) return cleanSettings(JSON.parse(saved))
    // Before the Settings screen existed, only the rest length was saved, on its own.
    const oldRest = Number(localStorage.getItem('swole.restLength'))
    return cleanSettings(oldRest > 0 ? { restLength: oldRest } : {})
  } catch {
    return DEFAULT_SETTINGS
  }
}

let current: Settings | null = null
const listeners = new Set<() => void>()

export function getSettings(): Settings {
  current ??= load()
  return current
}

export function setSettings(change: Partial<Settings>) {
  current = cleanSettings({ ...getSettings(), ...change })
  try {
    localStorage.setItem(KEY, JSON.stringify(current))
  } catch {
    // Storage unavailable: the choice still applies for this visit.
  }
  listeners.forEach((listener) => listener())
}

export function resetSettings() {
  try {
    localStorage.removeItem(KEY)
    localStorage.removeItem('swole.restLength')
  } catch {
    // Nothing to remove.
  }
  current = DEFAULT_SETTINGS
  listeners.forEach((listener) => listener())
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

/** The current settings; the screen redraws when they change. */
export function useSettings(): Settings {
  return useSyncExternalStore(subscribe, getSettings, () => DEFAULT_SETTINGS)
}
