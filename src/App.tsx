import { THEME_CHOICES, type ThemeChoice } from './theme/theme'
import { useTheme } from './theme/useTheme'

const THEME_LABELS: Record<ThemeChoice, string> = {
  light: 'Light',
  dark: 'Dark',
  system: 'System',
}

const SWATCHES = [
  { name: 'Accent', token: '--accent' },
  { name: 'Fresh', token: '--state-fresh' },
  { name: 'Recovering', token: '--state-recovering' },
  { name: 'Just trained', token: '--state-trained' },
]

/**
 * Step 1 placeholder screen: shows the theme tokens in use so the look can be
 * checked on a phone. Replaced by the real home screen in later steps.
 */
export function App() {
  const { choice, setChoice } = useTheme()

  return (
    <main className="shell">
      <header className="hero">
        <p className="eyebrow">Step 1 of 8 · Setup</p>
        <h1 className="wordmark">Swole</h1>
        <p className="lede">A free, offline gym log. This page is a first look at the colors, type and spacing.</p>
      </header>

      <section className="card" aria-labelledby="theme-heading">
        <h2 id="theme-heading" className="card-title">Theme</h2>
        <div className="segmented" role="radiogroup" aria-label="Theme">
          {THEME_CHOICES.map((option) => (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={choice === option}
              className="segment"
              onClick={() => setChoice(option)}
            >
              {THEME_LABELS[option]}
            </button>
          ))}
        </div>
      </section>

      <section className="card" aria-labelledby="numbers-heading">
        <h2 id="numbers-heading" className="card-title">Large clear numbers</h2>
        <div className="numbers">
          <div>
            <span className="number">82.5</span>
            <span className="unit">kg</span>
          </div>
          <div>
            <span className="number">8</span>
            <span className="unit">reps</span>
          </div>
        </div>
        <button type="button" className="primary">Log set</button>
      </section>

      <section className="card" aria-labelledby="colors-heading">
        <h2 id="colors-heading" className="card-title">Colors</h2>
        <ul className="swatches">
          {SWATCHES.map((swatch) => (
            <li key={swatch.token} className="swatch">
              <span className="chip" style={{ background: `var(${swatch.token})` }} />
              {swatch.name}
            </li>
          ))}
        </ul>
      </section>
    </main>
  )
}
