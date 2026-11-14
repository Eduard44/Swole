import type { MuscleId } from './muscles'

/** What is picked on the body map: the selected muscles, and the one zoomed in on (if any). */
export type Selection = { selected: MuscleId[]; focus: MuscleId | null }

export const EMPTY_SELECTION: Selection = { selected: [], focus: null }

/**
 * Tapping a muscle selects it and zooms in on it.
 * Tapping the muscle already zoomed in on zooms back out (it stays selected).
 */
export function tapMuscle(state: Selection, id: MuscleId): Selection {
  if (state.focus === id) return { ...state, focus: null }
  const selected = state.selected.includes(id) ? state.selected : [...state.selected, id]
  return { selected, focus: id }
}

/** Unselect a muscle and zoom back out. */
export function unselectMuscle(state: Selection, id: MuscleId): Selection {
  return { selected: state.selected.filter((m) => m !== id), focus: null }
}

/** Zoom back out to the whole body, keeping the selection. */
export function zoomOut(state: Selection): Selection {
  return { ...state, focus: null }
}

/** Add or remove a muscle without zooming (used by the filters on the exercise list). */
export function toggleMuscle(state: Selection, id: MuscleId): Selection {
  const selected = state.selected.includes(id) ? state.selected.filter((m) => m !== id) : [...state.selected, id]
  return { selected, focus: null }
}

/** Unselect every muscle. */
export function clearMuscles(): Selection {
  return EMPTY_SELECTION
}
