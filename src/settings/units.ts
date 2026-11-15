/** Weights are always saved in kilograms. These turn them into what is shown and typed. */

export type Units = 'kg' | 'lb'

export const KG_PER_LB = 0.45359237

/** A saved weight in the chosen units, rounded for showing (kg to 0.01, lb to 0.1). */
export function toDisplay(kg: number | null, units: Units): number | null {
  if (kg === null) return null
  return units === 'kg' ? Math.round(kg * 100) / 100 : Math.round((kg / KG_PER_LB) * 10) / 10
}

/** A typed weight in the chosen units, as kilograms for saving. */
export function fromDisplay(value: number | null, units: Units): number | null {
  if (value === null) return null
  return units === 'kg' ? value : value * KG_PER_LB
}
