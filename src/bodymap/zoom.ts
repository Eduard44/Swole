import { boundsOf, type Box, type Point } from '../drawn/paths'

/** The part of the sheet shown when the whole body is in view. */
export const FULL_VIEW: Box = { x: 20, y: 6, width: 160, height: 384 }

/**
 * The part of the sheet to show when zoomed in on some shapes: their box plus
 * breathing room, widened to the same proportions as the full view.
 */
export function zoomTarget(shapes: readonly (readonly Point[])[], padding = 16, minSize = 70): Box {
  const box = boundsOf(shapes.flat())
  let width = Math.max(box.width + padding * 2, minSize)
  let height = Math.max(box.height + padding * 2, minSize)
  const aspect = FULL_VIEW.width / FULL_VIEW.height
  if (width / height > aspect) height = width / aspect
  else width = height * aspect
  return {
    x: box.x + box.width / 2 - width / 2,
    y: box.y + box.height / 2 - height / 2,
    width,
    height,
  }
}
