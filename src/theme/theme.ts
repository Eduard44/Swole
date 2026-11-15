export type ThemeChoice = 'light' | 'dark' | 'system'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_CHOICES: readonly ThemeChoice[] = ['light', 'dark', 'system']
export const THEME_STORAGE_KEY = 'swole.theme'

/** The paper color of each theme, for the phone's browser bar. Keep in step with --bg in tokens.css. */
export const PAPER: Record<ResolvedTheme, string> = { light: '#f6f5f8', dark: '#0d0b14' }

/** Turn whatever was saved into a valid choice. Anything unknown means "system". */
export function parseThemeChoice(value: unknown): ThemeChoice {
  return value === 'light' || value === 'dark' ? value : 'system'
}

/** The theme actually shown, given the user's choice and the device setting. */
export function resolveTheme(choice: ThemeChoice, systemPrefersDark: boolean): ResolvedTheme {
  if (choice === 'system') return systemPrefersDark ? 'dark' : 'light'
  return choice
}
