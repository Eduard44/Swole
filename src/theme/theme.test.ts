import { describe, expect, it } from 'vitest'
import { parseThemeChoice, resolveTheme } from './theme'

describe('parseThemeChoice', () => {
  it('keeps a saved light or dark choice', () => {
    expect(parseThemeChoice('light')).toBe('light')
    expect(parseThemeChoice('dark')).toBe('dark')
  })

  it('falls back to system for anything else', () => {
    expect(parseThemeChoice('system')).toBe('system')
    expect(parseThemeChoice(null)).toBe('system')
    expect(parseThemeChoice('purple')).toBe('system')
  })
})

describe('resolveTheme', () => {
  it('uses the explicit choice regardless of the device', () => {
    expect(resolveTheme('light', true)).toBe('light')
    expect(resolveTheme('dark', false)).toBe('dark')
  })

  it('follows the device when set to system', () => {
    expect(resolveTheme('system', true)).toBe('dark')
    expect(resolveTheme('system', false)).toBe('light')
  })
})
