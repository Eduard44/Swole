import { useState } from 'react'
import { MUSCLES, type MuscleId } from '../bodymap/muscles'
import { Chip } from '../drawn/Chip'
import { DrawnFrame } from '../drawn/Drawn'
import { addCustomExercise, cleanName } from './custom'
import { EQUIPMENT, type Equipment } from './library'

type Props = {
  /** Muscles to start with (the ones picked on the body map). */
  startMuscles: readonly MuscleId[]
  startName: string
  onClose: () => void
}

/** The form for adding an exercise of your own. */
export function CustomExerciseForm({ startMuscles, startName, onClose }: Props) {
  const [name, setName] = useState(startName)
  const [muscles, setMuscles] = useState<MuscleId[]>([...startMuscles])
  const [equipment, setEquipment] = useState<Equipment>('other')
  const ready = cleanName(name) !== '' && muscles.length > 0

  const toggle = (id: MuscleId) =>
    setMuscles((current) => (current.includes(id) ? current.filter((m) => m !== id) : [...current, id]))

  return (
    <form
      className="detail"
      aria-labelledby="custom-title"
      onSubmit={(event) => {
        event.preventDefault()
        if (!ready) return
        void addCustomExercise({ name, muscles, equipment }).then(onClose)
      }}
    >
      <button type="button" className="btn btn-small drawn back" onClick={onClose}>
        <DrawnFrame seed="custom-back" />
        Back to list
      </button>
      <h2 id="custom-title" className="detail-title">
        Your own exercise
      </h2>

      <label className="field">
        <span className="field-label">Name</span>
        <span className="search drawn">
          <DrawnFrame seed="custom-name" fill="surface" />
          <input
            id="custom-name"
            type="text"
            autoComplete="off"
            maxLength={60}
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </span>
      </label>

      <div className="field">
        <span className="field-label">Muscles it works</span>
        <div className="chip-wrap" role="group" aria-label="Muscles it works">
          {MUSCLES.map((m) => (
            <Chip key={m.id} seed={`cm-${m.id}`} on={muscles.includes(m.id)} onClick={() => toggle(m.id)}>
              {m.name}
            </Chip>
          ))}
        </div>
      </div>

      <div className="field">
        <span className="field-label">Equipment</span>
        <div className="chip-wrap" role="group" aria-label="Equipment">
          {EQUIPMENT.map((e) => (
            <Chip key={e.id} seed={`ce-${e.id}`} on={equipment === e.id} onClick={() => setEquipment(e.id)}>
              {e.label}
            </Chip>
          ))}
        </div>
      </div>

      <button type="submit" className="btn btn-primary drawn" disabled={!ready}>
        <DrawnFrame seed="custom-save" fill="accent" />
        Save exercise
      </button>
      {!ready && <p className="panel-note">Give it a name and pick at least one muscle.</p>}
    </form>
  )
}
