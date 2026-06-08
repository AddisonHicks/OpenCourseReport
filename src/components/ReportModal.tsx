import { useEffect } from 'react'
import type { ReportDisplay } from '../types'
import {
  formatDateNumeric,
  formatPace,
  formatGreenFee,
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
  const submittedDate = formatDateNumeric(report.created_at.split('T')[0])
  const playedDate = formatDateNumeric(report.date_played)
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
          <div>
            <h2
              id="report-modal-title"
              className="font-display text-2xl font-bold text-green-dark"
            >
              {submittedDate} Report
            </h2>
            <p className="mt-1 text-base text-green-dark">
              Submitted By:{' '}
              {submitterName(report.first_name, report.last_initial)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close report"
            className="flex min-h-11 min-w-11 shrink-0 items-center justify-center text-3xl font-light leading-none text-green-dark"
          >
            ×
          </button>
        </div>

        <div className="space-y-2 text-base text-green-dark">
          <div className="grid grid-cols-2 gap-x-3 gap-y-2">
            <p>
              <span className="font-semibold">Played:</span> {playedDate}
            </p>
            <p>
              <span className="font-semibold">Time of Day:</span>{' '}
              {timeOfDayLabel(report.time_of_day)}
            </p>
            <p>
              <span className="font-semibold">Green Fee:</span>{' '}
              {formatGreenFee(report.price_paid, report.holes_played)}
            </p>
            <p>
              <span className="font-semibold">Pace of Play:</span>{' '}
              {formatPace(report.pace_of_play)}
            </p>
          </div>
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
            <ConditionBlock label="Fairways" value={report.fairways_report} />
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
