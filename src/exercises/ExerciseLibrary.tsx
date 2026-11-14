import { useEffect, useMemo, useRef, useState } from 'react'
import { MUSCLES, muscleName, type MuscleId } from '../bodymap/muscles'
import { Chip } from '../drawn/Chip'
import { DrawnFrame } from '../drawn/Drawn'
import { EQUIPMENT, equipmentLabel, filterExercises, type Equipment, type Exercise } from './library'
import { useExercises } from './useExercises'

const PAGE = 40

type Props = {
  /** The muscles picked on the body map. They are also this screen's muscle filter. */
  muscles: readonly MuscleId[]
  onToggleMuscle: (id: MuscleId) => void
  onClearMuscles: () => void
  query: string
  onQuery: (query: string) => void
  equipment: readonly Equipment[]
  onEquipment: (equipment: Equipment[]) => void
}

const musclesText = (ids: readonly MuscleId[]) => ids.map(muscleName).join(', ')
const capital = (text: string) => text.charAt(0).toUpperCase() + text.slice(1)

/** Search the exercise list, filter it by muscle and equipment, and open an exercise. */
export function ExerciseLibrary(props: Props) {
  const { muscles, onToggleMuscle, onClearMuscles, query, onQuery, equipment, onEquipment } = props
  const all = useExercises()
  const [shown, setShown] = useState(PAGE)
  const [open, setOpen] = useState<Exercise | null>(null)
  const listRef = useRef<HTMLDivElement>(null)

  // Picked muscles come first, so they are always in view.
  const musclesInOrder = useMemo(
    () => [...MUSCLES.filter((m) => muscles.includes(m.id)), ...MUSCLES.filter((m) => !muscles.includes(m.id))],
    [muscles],
  )

  const results = useMemo(
    () => (all ? filterExercises(all, { query, muscles, equipment }) : []),
    [all, query, muscles, equipment],
  )

  // A new search or filter starts from the top of the list.
  useEffect(() => {
    setShown(PAGE)
    listRef.current?.scrollTo({ top: 0 })
  }, [query, muscles, equipment])

  const toggleEquipment = (id: Equipment) =>
    onEquipment(equipment.includes(id) ? equipment.filter((e) => e !== id) : [...equipment, id])
  const filtering = query !== '' || muscles.length > 0 || equipment.length > 0
  const clearAll = () => {
    onQuery('')
    onClearMuscles()
    onEquipment([])
  }

  return (
    <div className="library">
      <div className="library-controls">
        <label className="search drawn">
          <DrawnFrame seed="search" fill="surface" />
          <span className="visually-hidden">Search exercises</span>
          <input
            id="exercise-search"
            type="search"
            placeholder="Search exercises"
            autoComplete="off"
            value={query}
            onChange={(event) => onQuery(event.target.value)}
          />
        </label>
        <div className="chip-row" role="group" aria-label="Muscles">
          {musclesInOrder.map((m) => (
            <Chip key={m.id} seed={`m-${m.id}`} on={muscles.includes(m.id)} onClick={() => onToggleMuscle(m.id)}>
              {m.name}
            </Chip>
          ))}
        </div>
        <div className="chip-row" role="group" aria-label="Equipment">
          {EQUIPMENT.map((e) => (
            <Chip key={e.id} seed={`e-${e.id}`} on={equipment.includes(e.id)} onClick={() => toggleEquipment(e.id)}>
              {e.label}
            </Chip>
          ))}
        </div>
        <div className="library-count">
          <span>{all ? `${results.length} exercise${results.length === 1 ? '' : 's'}` : 'Loading exercises'}</span>
          {filtering && (
            <button type="button" className="btn btn-small link" onClick={clearAll}>
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="exercise-list" ref={listRef}>
        {all && results.length === 0 && (
          <p className="empty">No exercises match. Try fewer words, or take off a filter.</p>
        )}
        <ul>
          {results.slice(0, shown).map((exercise) => (
            <li key={exercise.id}>
              <button type="button" className="exercise-row" onClick={() => setOpen(exercise)}>
                <span className="exercise-name">{exercise.name}</span>
                <span className="exercise-meta">
                  {equipmentLabel(exercise.equipment)} · {musclesText(exercise.primary)}
                </span>
              </button>
            </li>
          ))}
        </ul>
        {results.length > shown && (
          <button type="button" className="btn drawn more" onClick={() => setShown((n) => n + PAGE)}>
            <DrawnFrame seed="more" />
            Show more ({results.length - shown} left)
          </button>
        )}
      </div>

      {open && <ExerciseDetail exercise={open} onClose={() => setOpen(null)} />}
    </div>
  )
}

function ExerciseDetail({ exercise, onClose }: { exercise: Exercise; onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <section className="detail" aria-labelledby="detail-title">
      <button ref={closeRef} type="button" className="btn btn-small drawn back" onClick={onClose}>
        <DrawnFrame seed="detail-back" />
        Back to list
      </button>
      <h2 id="detail-title" className="detail-title">
        {exercise.name}
      </h2>
      <dl className="facts">
        <div>
          <dt>Works</dt>
          <dd>{musclesText(exercise.primary)}</dd>
        </div>
        {exercise.secondary.length > 0 && (
          <div>
            <dt>Also</dt>
            <dd>{musclesText(exercise.secondary)}</dd>
          </div>
        )}
        <div>
          <dt>Equipment</dt>
          <dd>{equipmentLabel(exercise.equipment)}</dd>
        </div>
        <div>
          <dt>Level</dt>
          <dd>{capital(exercise.level)}</dd>
        </div>
      </dl>
      {exercise.instructions.length > 0 && (
        <>
          <h3 className="detail-subtitle">How to do it</h3>
          <ol className="steps">
            {exercise.instructions.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </>
      )}
    </section>
  )
}
