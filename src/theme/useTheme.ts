import { useCallback, useEffect, useState } from 'react'
import { parseThemeChoice, THEME_STORAGE_KEY, type ThemeChoice } from './theme'

function readSavedChoice(): ThemeChoice {
  try {
    return parseThemeChoice(localStorage.getItem(THEME_STORAGE_KEY))
  } catch {
    return 'system'
  }
}

/**
 * The theme choice (light / dark / system), saved on the device.
 * "System" removes the override so the CSS follows the device setting.
 */
export function useTheme() {
  const [choice, setChoiceState] = useState<ThemeChoice>(readSavedChoice)

  useEffect(() => {
    const root = document.documentElement
    if (choice === 'system') delete root.dataset.theme
    else root.dataset.theme = choice
  }, [choice])

  const setChoice = useCallback((next: ThemeChoice) => {
    setChoiceState(next)
    try {
      if (next === 'system') localStorage.removeItem(THEME_STORAGE_KEY)
      else localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      // Storage unavailable (private mode): the choice still applies for this visit.
    }
  }, [])

  return { choice, setChoice }
}
