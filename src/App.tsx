import { useState } from 'react'
import { BodyMap } from './bodymap/BodyMap'
import { musclesInView, type FigureKind, type View } from './bodymap/figures'
import { muscleName } from './bodymap/muscles'
import { EMPTY_SELECTION, tapMuscle, unselectMuscle, zoomOut, type Selection } from './bodymap/selection'
import { DrawnFrame, PencilDefs } from './drawn/Drawn'
import { THEME_CHOICES, type ThemeChoice } from './theme/theme'
import { useTheme } from './theme/useTheme'

const THEME_LABELS: Record<ThemeChoice, string> = { light: 'Light', dark: 'Dark', system: 'System' }

type SegmentedProps<T extends string> = {
  label: string
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}

/** A row of choices where the chosen one is boxed in pencil. */
function Segmented<T extends string>({ label, options, value, onChange }: SegmentedProps<T>) {
  return (
    <div className="segmented" role="group" aria-label={label}>
      {options.map((option) => {
        const chosen = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            className="btn btn-small segment drawn"
            aria-pressed={chosen}
            onClick={() => onChange(option.value)}
          >
            {chosen && <DrawnFrame seed={`${label}-${option.value}`} fill="secondary" />}
            {option.label}
          </button>
        )
      })}
    </div>
  )
}

const VIEWS = [
  { value: 'front', label: 'Front' },
  { value: 'back', label: 'Back' },
] as const

const FIGURES = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
] as const

export function App() {
  const { choice, setChoice } = useTheme()
  const [view, setView] = useState<View>('front')
  const [figure, setFigure] = useState<FigureKind>('male')
  const [selection, setSelection] = useState<Selection>(EMPTY_SELECTION)
  const { selected, focus } = selection

  const nextTheme = THEME_CHOICES[(THEME_CHOICES.indexOf(choice) + 1) % THEME_CHOICES.length]

  // Turning the figure round zooms back out first.
  const changeView = (next: View) => {
    setView(next)
    setSelection(zoomOut)
  }
  const changeFigure = (next: FigureKind) => {
    setFigure(next)
    setSelection(zoomOut)
  }
  // Jump to a selected muscle, turning the figure round if it is on the other side.
  const jumpTo = (id: (typeof selected)[number]) => {
    if (!musclesInView(view).includes(id)) setView(view === 'front' ? 'back' : 'front')
    setSelection((state) => ({ ...state, focus: id }))
  }

  return (
    <main className="shell">
      <PencilDefs />

      <header className="topbar">
        <h1 className="wordmark">SWOLE</h1>
        <button
          type="button"
          className="btn btn-small drawn"
          onClick={() => setChoice(nextTheme)}
          aria-label={`Theme: ${THEME_LABELS[choice]}. Switch to ${THEME_LABELS[nextTheme]}.`}
        >
          <DrawnFrame seed="theme" />
          Theme: {THEME_LABELS[choice]}
        </button>
      </header>

      <div className="switches">
        <Segmented label="View" options={VIEWS} value={view} onChange={changeView} />
        <Segmented label="Figure" options={FIGURES} value={figure} onChange={changeFigure} />
      </div>

      <div className="stage">
        <BodyMap
          view={view}
          figure={figure}
          selected={selected}
          focus={focus}
          onTapMuscle={(id) => setSelection((state) => tapMuscle(state, id))}
          onTapPaper={() => setSelection(zoomOut)}
        />
      </div>

      <section className="panel drawn" aria-live="polite">
        <DrawnFrame seed="panel" fill="surface" />
        {focus ? (
          <>
            <h2 className="panel-title">{muscleName(focus)}</h2>
            <p className="panel-note">Selected for today.</p>
            <div className="panel-actions">
              <button type="button" className="btn drawn" onClick={() => setSelection((s) => unselectMuscle(s, focus))}>
                <DrawnFrame seed="unselect" />
                Unselect
              </button>
              <button type="button" className="btn btn-primary drawn" onClick={() => setSelection(zoomOut)}>
                <DrawnFrame seed="back" fill="accent" />
                Back to body
              </button>
            </div>
          </>
        ) : selected.length > 0 ? (
          <>
            <h2 className="panel-title">Today&rsquo;s muscles</h2>
            <p className="panel-note">Tap another muscle to add it, or a name to go back to it.</p>
            <div className="chips">
              {selected.map((id) => (
                <button key={id} type="button" className="btn chip drawn" onClick={() => jumpTo(id)}>
                  <DrawnFrame seed={`chip-${id}`} fill="secondary" />
                  {muscleName(id)}
                </button>
              ))}
            </div>
          </>
        ) : (
          <>
            <h2 className="panel-title">Tap a muscle</h2>
            <p className="panel-note">Pick what you want to train today. Turn the figure round for the back.</p>
          </>
        )}
      </section>
    </main>
  )
}
