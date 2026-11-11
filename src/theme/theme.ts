export type ThemeChoice = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_CHOICES: readonly ThemeChoice[] = ['light', 'dark', 'system']
export const THEME_STORAGE_KEY = 'swole.theme'

/** Turn whatever was saved into a valid choice. Anything unknown means "system". */
export function parseThemeChoice(value: unknown): ThemeChoice {
  return value === 'light' || value === 'dark' ? value : 'system'
}

/** The theme actually shown, given the user's choice and the device setting. */
export function resolveTheme(choice: ThemeChoice, systemPrefersDark: boolean): ResolvedTheme {
  if (choice === 'system') return systemPrefersDark ? 'dark' : 'light'
  return choice
}
