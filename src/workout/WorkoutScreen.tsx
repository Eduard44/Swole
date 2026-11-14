import { useLiveQuery } from 'dexie-react-hooks'
import { useEffect, useRef, useState } from 'react'
import type { SessionExercise, WorkoutSet } from '../db/db'
import { DrawnFrame } from '../drawn/Drawn'
import type { Exercise } from '../exercises/library'
import { describeSets, duration, formatNumber, openSets, parseNumber } from './logic'
import {
  activeSession,
  addSet,
  discardSession,
  exercisesIn,
  finishSession,
  lastTime,
  removeExercise,
  removeSet,
  updateSet,
} from './store'

type Props = {
  exercisesById: Map<string, Exercise> | null
  /** Called when a set is ticked done, to start the rest timer. */
  onSetDone: () => void
  onBrowse: () => void
}

/** The workout in progress: exercises, sets, and finishing up. */
export function WorkoutScreen({ exercisesById, onSetDone, onBrowse }: Props) {
  const session = useLiveQuery(() => activeSession(), [])
  const entries = useLiveQuery(() => (session ? exercisesIn(session.id) : []), [session?.id]) ?? []
  const history = useLiveQuery(
    () => Promise.all(entries.map((e) => lastTime(e.exerciseId))),
    [entries.map((e) => e.exerciseId).join()],
  )
  const [confirm, setConfirm] = useState<'finish' | 'discard' | null>(null)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 30_000)
    return () => window.clearInterval(id)
  }, [])

  if (session === undefined) return null

  if (!session) {
    return (
      <div className="workout">
        <section className="workout-empty">
          <h2 className="panel-title">No workout yet</h2>
          <p className="panel-note">
            Pick muscles on the body, open an exercise and tap Add to workout. The workout starts with the first
            exercise.
          </p>
          <button type="button" className="btn btn-primary drawn" onClick={onBrowse}>
            <DrawnFrame seed="browse" fill="accent" />
            Choose exercises
          </button>
        </section>
      </div>
    )
  }

  const nameOf = (id: string) => (exercisesById ? (exercisesById.get(id)?.name ?? 'Removed exercise') : '…')
  const open = openSets(entries)
  const started = new Date(session.startedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

  return (
    <div className="workout">
      <header className="workout-head">
        <h2 className="panel-title">Workout</h2>
        <p className="panel-note">
          Started {started} · {duration(now - session.startedAt)}
        </p>
      </header>

      <div className="workout-list">
        {entries.map((entry, i) => (
          <ExerciseCard
            key={entry.id}
            entry={entry}
            name={nameOf(entry.exerciseId)}
            last={history?.[i]?.sets ?? null}
            onSetDone={onSetDone}
          />
        ))}
        <button type="button" className="btn drawn add-exercise" onClick={onBrowse}>
          <DrawnFrame seed="add-exercise" />+ Add exercise
        </button>
      </div>

      <footer className="workout-foot drawn">
        <DrawnFrame seed="workout-foot" fill="surface" />
        {confirm === 'finish' ? (
          <>
            <p className="panel-note">
              {entries.length === 0 || open === entries.reduce((n, e) => n + e.sets.length, 0)
                ? 'Nothing is ticked, so this workout will not be saved.'
                : open > 0
                  ? `${open} set${open === 1 ? ' is' : 's are'} not ticked and will not be saved.`
                  : 'Save this workout?'}
            </p>
            <div className="panel-actions">
              <button type="button" className="btn drawn" onClick={() => setConfirm(null)}>
                <DrawnFrame seed="keep-going" />
                Keep going
              </button>
              <button
                type="button"
                className="btn btn-primary drawn"
                onClick={() => {
                  setConfirm(null)
                  void finishSession(session.id)
                }}
              >
                <DrawnFrame seed="finish-yes" fill="accent" />
                Finish
              </button>
            </div>
          </>
        ) : confirm === 'discard' ? (
          <>
            <p className="panel-note">Throw this workout away? Nothing from it will be saved.</p>
            <div className="panel-actions">
              <button type="button" className="btn drawn" onClick={() => setConfirm(null)}>
                <DrawnFrame seed="keep" />
                Keep it
              </button>
              <button
                type="button"
                className="btn btn-danger drawn"
                onClick={() => {
                  setConfirm(null)
                  void discardSession(session.id)
                }}
              >
                <DrawnFrame seed="discard-yes" />
                Throw away
              </button>
            </div>
          </>
        ) : (
          <div className="panel-actions">
            <button type="button" className="btn btn-small link-muted" onClick={() => setConfirm('discard')}>
              Discard
            </button>
            <button type="button" className="btn btn-primary drawn" onClick={() => setConfirm('finish')}>
              <DrawnFrame seed="finish" fill="accent" />
              Finish workout
            </button>
          </div>
        )}
      </footer>
    </div>
  )
}

type CardProps = {
  entry: SessionExercise
  name: string
  last: WorkoutSet[] | null
  onSetDone: () => void
}

function ExerciseCard({ entry, name, last, onSetDone }: CardProps) {
  const [editing, setEditing] = useState(false)
  return (
    <section className="exercise-card drawn" aria-label={name}>
      <DrawnFrame seed={`card-${entry.id}`} fill="surface" />
      <div className="card-head">
        <h3 className="card-title">{name}</h3>
        <button type="button" className="btn btn-small link" onClick={() => setEditing((e) => !e)}>
          {editing ? 'Done' : 'Edit'}
        </button>
      </div>
      <p className="last-time">{last ? `Last time: ${describeSets(last)}` : 'First time logging this'}</p>

      <div className="sets" role="table" aria-label={`${name} sets`}>
        <div className="set-row set-labels" role="row">
          <span role="columnheader">Set</span>
          <span role="columnheader">kg</span>
          <span role="columnheader">Reps</span>
          <span role="columnheader" className="visually-hidden">
            {editing ? 'Remove' : 'Done'}
          </span>
        </div>
        {entry.sets.map((set, i) => (
          <SetRow
            key={i}
            index={i}
            set={set}
            editing={editing}
            onChange={(change) => void updateSet(entry.id, i, change)}
            onTick={() => {
              const done = !set.done
              void updateSet(entry.id, i, { done })
              if (done) onSetDone()
            }}
            onRemove={() => void removeSet(entry.id, i)}
          />
        ))}
      </div>

      <div className="card-actions">
        {editing ? (
          <button type="button" className="btn btn-small btn-danger-text" onClick={() => void removeExercise(entry.id)}>
            Remove exercise
          </button>
        ) : (
          <button type="button" className="btn btn-small drawn" onClick={() => void addSet(entry.id)}>
            <DrawnFrame seed={`add-set-${entry.id}`} />+ Add set
          </button>
        )}
      </div>
    </section>
  )
}

type RowProps = {
  index: number
  set: WorkoutSet
  editing: boolean
  onChange: (change: Partial<WorkoutSet>) => void
  onTick: () => void
  onRemove: () => void
}

/** A number box that keeps what is being typed (like "82,") while saving the value as you go. */
function NumberBox({
  value,
  label,
  decimal,
  onValue,
}: {
  value: number | null
  label: string
  decimal: boolean
  onValue: (value: number | null) => void
}) {
  const [text, setText] = useState(formatNumber(value))
  const focused = useRef(false)
  useEffect(() => {
    if (!focused.current) setText(formatNumber(value))
  }, [value])
  return (
    <input
      className="number-box"
      type="text"
      inputMode={decimal ? 'decimal' : 'numeric'}
      aria-label={label}
      value={text}
      placeholder="–"
      onFocus={(event) => {
        focused.current = true
        event.target.select()
      }}
      onBlur={() => {
        focused.current = false
        setText(formatNumber(value))
      }}
      onChange={(event) => {
        setText(event.target.value)
        onValue(parseNumber(event.target.value))
      }}
    />
  )
}

function SetRow({ index, set, editing, onChange, onTick, onRemove }: RowProps) {
  return (
    <div className={set.done ? 'set-row is-done' : 'set-row'} role="row">
      <span className="set-number" role="cell">
        {index + 1}
      </span>
      <span role="cell">
        <NumberBox value={set.weight} label={`Set ${index + 1} weight in kg`} decimal onValue={(weight) => onChange({ weight })} />
      </span>
      <span role="cell">
        <NumberBox value={set.reps} label={`Set ${index + 1} reps`} decimal={false} onValue={(reps) => onChange({ reps })} />
      </span>
      <span role="cell">
        {editing ? (
          <button type="button" className="tick remove" onClick={onRemove} aria-label={`Remove set ${index + 1}`}>
            ×
          </button>
        ) : (
          <button
            type="button"
            className="tick drawn"
            aria-pressed={set.done}
            aria-label={`Set ${index + 1} done`}
            onClick={onTick}
          >
            <DrawnFrame seed={`tick-${index}`} fill={set.done ? 'secondary' : undefined} />
            <svg viewBox="0 0 24 24" aria-hidden="true" className="tick-mark">
              <path d="M5 12.5 L10 17.5 L19.5 6.5" />
            </svg>
          </button>
        )}
      </span>
    </div>
  )
}
