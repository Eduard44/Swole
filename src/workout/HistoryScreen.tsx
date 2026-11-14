import { useLiveQuery } from 'dexie-react-hooks'
import { useState } from 'react'
import { muscleName, type MuscleId } from '../bodymap/muscles'
import { DrawnFrame } from '../drawn/Drawn'
import type { Exercise } from '../exercises/library'
import { dayLabel, describeSet, duration, totalsText } from './logic'
import { deleteWorkout, pastWorkouts, type PastWorkout } from './store'

type Props = { exercisesById: Map<string, Exercise> | null }

const timeOf = (at: number) => new Date(at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })

/** Past workouts, newest first. Tap one to see what was done. */
export function HistoryScreen({ exercisesById }: Props) {
  const workouts = useLiveQuery(() => pastWorkouts(), [])
  const [openId, setOpenId] = useState<number | null>(null)
  const now = Date.now()

  if (!workouts) return null
  const open = workouts.find((w) => w.session.id === openId) ?? null

  const nameOf = (id: string) => (exercisesById ? (exercisesById.get(id)?.name ?? 'Removed exercise') : '…')
  /** The muscles a workout mainly worked, in the order they first appear. */
  const musclesOf = (workout: PastWorkout) => {
    const out: MuscleId[] = []
    for (const entry of workout.entries)
      for (const m of exercisesById?.get(entry.exerciseId)?.primary ?? []) if (!out.includes(m)) out.push(m)
    return out.map(muscleName).join(', ')
  }

  if (workouts.length === 0) {
    return (
      <div className="workout">
        <section className="workout-empty">
          <h2 className="panel-title">No workouts yet</h2>
          <p className="panel-note">Finished workouts are listed here, newest first.</p>
        </section>
      </div>
    )
  }

  return (
    <div className="history">
      <h2 className="panel-title">History</h2>
      <div className="exercise-list">
        <ul>
          {workouts.map((workout) => (
            <li key={workout.session.id}>
              <button type="button" className="exercise-row" onClick={() => setOpenId(workout.session.id)}>
                <span className="exercise-name">
                  {dayLabel(workout.session.startedAt, now)} · {timeOf(workout.session.startedAt)}
                </span>
                <span className="exercise-meta">{musclesOf(workout) || 'Workout'}</span>
                <span className="exercise-meta">
                  {totalsText(workout.entries)} ·{' '}
                  {duration((workout.session.finishedAt ?? workout.session.startedAt) - workout.session.startedAt)}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      {open && (
        <PastWorkoutDetail
          workout={open}
          title={dayLabel(open.session.startedAt, now)}
          nameOf={nameOf}
          onClose={() => setOpenId(null)}
        />
      )}
    </div>
  )
}

type DetailProps = {
  workout: PastWorkout
  title: string
  nameOf: (exerciseId: string) => string
  onClose: () => void
}

function PastWorkoutDetail({ workout, title, nameOf, onClose }: DetailProps) {
  const [confirmDelete, setConfirmDelete] = useState(false)
  const { session, entries } = workout
  return (
    <section className="detail" aria-labelledby="past-title">
      <button type="button" className="btn btn-small drawn back" onClick={onClose}>
        <DrawnFrame seed="history-back" />
        Back to history
      </button>
      <h2 id="past-title" className="detail-title">
        {title}
      </h2>
      <p className="panel-note">
        {timeOf(session.startedAt)} · {duration((session.finishedAt ?? session.startedAt) - session.startedAt)} ·{' '}
        {totalsText(entries)}
      </p>

      {entries.map((entry) => (
        <section key={entry.id} className="past-exercise">
          <h3 className="card-title">{nameOf(entry.exerciseId)}</h3>
          <ol className="past-sets">
            {entry.sets.map((set, i) => (
              <li key={i}>
                <span className="set-number">{i + 1}</span>
                <span className="past-set">{describeSet(set) ?? '–'}</span>
              </li>
            ))}
          </ol>
        </section>
      ))}

      {confirmDelete ? (
        <div className="panel-actions">
          <button type="button" className="btn drawn" onClick={() => setConfirmDelete(false)}>
            <DrawnFrame seed="keep-past" />
            Keep it
          </button>
          <button
            type="button"
            className="btn btn-danger drawn"
            onClick={() => {
              onClose()
              void deleteWorkout(session.id)
            }}
          >
            <DrawnFrame seed="delete-past" />
            Delete
          </button>
        </div>
      ) : (
        <button type="button" className="btn btn-small btn-danger-text own-delete" onClick={() => setConfirmDelete(true)}>
          Delete this workout
        </button>
      )}
    </section>
  )
}
