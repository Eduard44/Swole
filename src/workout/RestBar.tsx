import { DrawnFrame } from '../drawn/Drawn'
import { clock, REST_STEP } from './logic'
import type { RestTimer } from './useRestTimer'

/** The running rest, shown just above the tabs on every screen. */
export function RestBar({ timer }: { timer: RestTimer }) {
  if (timer.left === null && !timer.over) return null
  if (timer.over) {
    return (
      <div className="restbar drawn is-over" role="status">
        <DrawnFrame seed="rest-over" fill="secondary" />
        <span className="rest-label">Rest over</span>
        <button type="button" className="btn btn-small" onClick={timer.skip}>
          OK
        </button>
      </div>
    )
  }
  return (
    <div className="restbar drawn" role="timer" aria-label={`Rest, ${clock(timer.left ?? 0)} left`}>
      <DrawnFrame seed="rest" fill="surface" />
      <span className="rest-label">Rest</span>
      <span className="rest-clock">{clock(timer.left ?? 0)}</span>
      <div className="rest-actions">
        <button type="button" className="btn btn-small" onClick={() => timer.adjust(-REST_STEP)} aria-label="15 seconds less">
          −15
        </button>
        <button type="button" className="btn btn-small" onClick={() => timer.adjust(REST_STEP)} aria-label="15 seconds more">
          +15
        </button>
        <button type="button" className="btn btn-small" onClick={timer.skip}>
          Skip
        </button>
      </div>
    </div>
  )
}
