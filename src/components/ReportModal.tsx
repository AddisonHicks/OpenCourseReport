import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { coursePath } from '../lib/courses'
import type { ReportDisplay } from '../types'
import {
  formatDateNumeric,
  formatHolesPlayed,
  formatPace,
  formatPrice,
  submitterName,
  timeOfDayLabel,
} from '../lib/reportQueries'

interface ReportModalProps {
  report: ReportDisplay
  onClose: () => void
}

function ConditionBlock({
  label,
  value,
}: {
  label: string
  value: string | null
}) {
  return (
    <div>
      <p className="font-semibold text-green-dark">{label}:</p>
      <p className="mt-0.5 text-green-dark/90">{value?.trim() || '—'}</p>
    </div>
  )
}

export function ReportModal({ report, onClose }: ReportModalProps) {
  const navigate = useNavigate()
  const playedDate = formatDateNumeric(report.date_played)
  const reportTitleDate = formatDateNumeric(report.date_played)
  const transportLabel =
    report.transport_mode === 'walking'
      ? 'Walk'
      : report.transport_mode === 'cart'
        ? 'Cart'
        : '—'

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-green-dark/40 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="report-modal-title"
      onClick={onClose}
    >
      <div
        className="max-h-[90dvh] w-full max-w-lg overflow-y-auto rounded-2xl border-4 border-green-dark bg-sand p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1 text-left">
            <h2
              id="report-modal-title"
              className="font-display text-2xl font-bold text-green-dark"
            >
              {reportTitleDate} Report
            </h2>
            <p className="mt-1 text-base text-green-dark">
              Submitted By:{' '}
              {submitterName(report.first_name, report.last_initial)}
            </p>
            <button
              type="button"
              onClick={() => {
                onClose()
                navigate(coursePath(report.courses))
              }}
              className="mt-1 block text-left font-display text-base font-semibold text-green-mid underline"
            >
              {report.courses.course_name}
            </button>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close report"
            className="-mt-3 shrink-0 text-5xl font-light leading-none text-green-dark active:opacity-70"
          >
            ×
          </button>
        </div>

        <div className="grid grid-cols-2 gap-x-3 gap-y-2 text-base text-green-dark">
          <p>
            <span className="font-semibold">Played:</span> {playedDate}
          </p>
          <p>
            <span className="font-semibold">Time of Day:</span>{' '}
            {timeOfDayLabel(report.time_of_day)}
          </p>
          <p>
            <span className="font-semibold">Green Fee:</span>{' '}
            {formatPrice(report.price_paid)}
          </p>
          <p>
            <span className="font-semibold">Holes Played:</span>{' '}
            {formatHolesPlayed(report.holes_played)}
          </p>
          <p>
            <span className="font-semibold">Pace of Play:</span>{' '}
            {formatPace(report.pace_of_play)}
          </p>
          <p>
            <span className="font-semibold">Walk or Ride:</span> {transportLabel}
          </p>
        </div>

        <div className="my-4 border-t border-green-dark/25" />

        <section>
          <h3 className="mb-3 font-display text-xl text-green-dark">
            Course Conditions:
          </h3>
          <div className="space-y-3 text-base">
            <ConditionBlock label="Greens" value={report.greens_report} />
            <ConditionBlock
              label="Fairways & Tees"
              value={report.fairways_tees_report}
            />
            {report.transport_mode === 'walking' && (
              <ConditionBlock
                label="Walkability"
                value={report.walkability_notes}
              />
            )}
            <ConditionBlock
              label="Maintenance"
              value={report.maintenance_notes}
            />
            <ConditionBlock
              label="Other Course Conditions & Notes"
              value={report.other_conditions_notes}
            />
          </div>
        </section>
      </div>
    </div>
  )
}
