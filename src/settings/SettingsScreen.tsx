import { useRef, useState } from 'react'
import type { FigureKind } from '../bodymap/figures'
import { DrawnFrame } from '../drawn/Drawn'
import { parseThemeChoice, type ThemeChoice } from '../theme/theme'
import { clampRest, clock, REST_MAX, REST_MIN, REST_STEP } from '../workout/logic'
import { backupFileName, backupSummary, deleteEverything, makeBackup, parseBackup, restoreBackup, type Backup } from './backup'
import { resetSettings, setSettings, useSettings } from './settings'
import type { Units } from './units'

type Props = {
  theme: ThemeChoice
  onTheme: (choice: ThemeChoice) => void
}

type ChoiceProps<T extends string> = {
  label: string
  options: readonly { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
}

function Choice<T extends string>({ label, options, value, onChange }: ChoiceProps<T>) {
  return (
    <div className="setting">
      <span className="setting-label">{label}</span>
      <div className="segmented" role="group" aria-label={label}>
        {options.map((option) => (
          <button
            key={option.value}
            type="button"
            className="btn btn-small segment drawn"
            aria-pressed={option.value === value}
            onClick={() => onChange(option.value)}
          >
            {option.value === value && <DrawnFrame seed={`set-${label}-${option.value}`} fill="secondary" />}
            {option.label}
          </button>
        ))}
      </div>
    </div>
  )
}

const UNITS: readonly { value: Units; label: string }[] = [
  { value: 'kg', label: 'kg' },
  { value: 'lb', label: 'lb' },
]
const THEMES: readonly { value: ThemeChoice; label: string }[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'system', label: 'System' },
]
const FIGURES: readonly { value: FigureKind; label: string }[] = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
]

/** Hands the browser a file to save. */
function saveFile(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

/** Units, theme, figure, rest time, backup, and deleting everything. */
export function SettingsScreen({ theme, onTheme }: Props) {
  const settings = useSettings()
  const fileRef = useRef<HTMLInputElement>(null)
  const [pending, setPending] = useState<Backup | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const exportBackup = async () => {
    const backup = await makeBackup(settings, theme)
    saveFile(backupFileName(), JSON.stringify(backup))
    setMessage(`Backup saved: ${backupSummary(backup)}.`)
  }

  const readFile = async (file: File | undefined) => {
    if (!file) return
    setMessage(null)
    try {
      setPending(parseBackup(await file.text()))
    } catch (error) {
      setPending(null)
      setMessage(error instanceof Error ? error.message : 'This file could not be read.')
    }
    if (fileRef.current) fileRef.current.value = ''
  }

  const restore = async () => {
    if (!pending) return
    await restoreBackup(pending)
    setSettings(pending.settings)
    onTheme(parseThemeChoice(pending.theme))
    setMessage(`Backup restored: ${backupSummary(pending)}.`)
    setPending(null)
  }

  const wipe = async () => {
    await deleteEverything()
    resetSettings()
    onTheme('system')
    setConfirmDelete(false)
    setMessage('Everything on this device has been deleted.')
  }

  return (
    <div className="settings">
      <h2 className="panel-title">Settings</h2>

      <div className="settings-list">
        <Choice label="Weight units" options={UNITS} value={settings.units} onChange={(units) => setSettings({ units })} />
        <Choice label="Theme" options={THEMES} value={theme} onChange={onTheme} />
        <Choice label="Figure" options={FIGURES} value={settings.figure} onChange={(figure) => setSettings({ figure })} />

        <div className="setting">
          <span className="setting-label">Rest between sets</span>
          <div className="stepper" role="group" aria-label="Rest between sets">
            <button
              type="button"
              className="btn btn-small drawn"
              disabled={settings.restLength <= REST_MIN}
              onClick={() => setSettings({ restLength: clampRest(settings.restLength - REST_STEP) })}
              aria-label="15 seconds less"
            >
              <DrawnFrame seed="rest-less" />
              −15
            </button>
            <span className="stepper-value" aria-live="polite">
              {clock(settings.restLength)}
            </span>
            <button
              type="button"
              className="btn btn-small drawn"
              disabled={settings.restLength >= REST_MAX}
              onClick={() => setSettings({ restLength: clampRest(settings.restLength + REST_STEP) })}
              aria-label="15 seconds more"
            >
              <DrawnFrame seed="rest-more" />
              +15
            </button>
          </div>
        </div>

        <section className="settings-block" aria-labelledby="backup-title">
          <h3 id="backup-title" className="card-title">
            Backup
          </h3>
          <p className="panel-note">
            Your workouts live only on this device. Save a backup file now and then, and keep it somewhere safe.
          </p>
          {pending ? (
            <>
              <p className="panel-note">
                This backup holds {backupSummary(pending)}. Restoring it replaces everything on this device.
              </p>
              <div className="panel-actions">
                <button type="button" className="btn drawn" onClick={() => setPending(null)}>
                  <DrawnFrame seed="restore-cancel" />
                  Cancel
                </button>
                <button type="button" className="btn btn-primary drawn" onClick={() => void restore()}>
                  <DrawnFrame seed="restore-yes" fill="accent" />
                  Restore
                </button>
              </div>
            </>
          ) : (
            <div className="panel-actions">
              <button type="button" className="btn drawn" onClick={() => fileRef.current?.click()}>
                <DrawnFrame seed="import" />
                Restore a backup
              </button>
              <button type="button" className="btn btn-primary drawn" onClick={() => void exportBackup()}>
                <DrawnFrame seed="export" fill="accent" />
                Save a backup
              </button>
            </div>
          )}
          <input
            ref={fileRef}
            id="backup-file"
            className="visually-hidden"
            type="file"
            accept="application/json,.json"
            aria-label="Backup file"
            onChange={(event) => void readFile(event.target.files?.[0])}
          />
          {message && (
            <p className="panel-note settings-message" role="status">
              {message}
            </p>
          )}
        </section>

        <section className="settings-block" aria-labelledby="delete-title">
          <h3 id="delete-title" className="card-title">
            Delete everything
          </h3>
          {confirmDelete ? (
            <>
              <p className="panel-note">
                This deletes every workout, every exercise of your own and your settings from this device. It cannot be
                undone.
              </p>
              <div className="panel-actions">
                <button type="button" className="btn drawn" onClick={() => setConfirmDelete(false)}>
                  <DrawnFrame seed="wipe-cancel" />
                  Keep everything
                </button>
                <button type="button" className="btn btn-danger drawn" onClick={() => void wipe()}>
                  <DrawnFrame seed="wipe-yes" />
                  Delete it all
                </button>
              </div>
            </>
          ) : (
            <button type="button" className="btn btn-small btn-danger-text own-delete" onClick={() => setConfirmDelete(true)}>
              Delete all my data
            </button>
          )}
        </section>

        <p className="panel-note about">Swole keeps everything on this device. No account, no ads, no tracking.</p>
      </div>
    </div>
  )
}
