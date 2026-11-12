/** The 17 muscle groups Swole knows about, in head-to-toe order. */
export const MUSCLES = [
  { id: 'neck', name: 'Neck' },
  { id: 'traps', name: 'Traps' },
  { id: 'front-delts', name: 'Front delts' },
  { id: 'side-delts', name: 'Side delts' },
  { id: 'rear-delts', name: 'Rear delts' },
  { id: 'chest', name: 'Chest' },
  { id: 'biceps', name: 'Biceps' },
  { id: 'triceps', name: 'Triceps' },
  { id: 'forearms', name: 'Forearms' },
  { id: 'abs', name: 'Abs' },
  { id: 'obliques', name: 'Obliques' },
  { id: 'lats', name: 'Lats' },
  { id: 'lower-back', name: 'Lower back' },
  { id: 'glutes', name: 'Glutes' },
  { id: 'quads', name: 'Quads' },
  { id: 'hamstrings', name: 'Hamstrings' },
  { id: 'calves', name: 'Calves' },
] as const

export type MuscleId = (typeof MUSCLES)[number]['id']

export function muscleName(id: MuscleId): string {
  return MUSCLES.find((m) => m.id === id)!.name
}
