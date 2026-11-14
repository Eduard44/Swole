import type { ReactNode } from 'react'
import { DrawnFrame } from './Drawn'

type Props = {
  seed: string
  on: boolean
  onClick: () => void
  children: ReactNode
}

/** A small toggle drawn in pencil. When on it is filled with the secondary color. */
export function Chip({ seed, on, onClick, children }: Props) {
  return (
    <button type="button" className={on ? 'btn chip drawn is-on' : 'btn chip drawn'} aria-pressed={on} onClick={onClick}>
      <DrawnFrame seed={seed} fill={on ? 'secondary' : undefined} />
      {children}
    </button>
  )
}
