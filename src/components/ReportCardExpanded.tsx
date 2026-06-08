import type { ReportDisplay } from '../types'
import {
  formatDate,
  formatPace,
  formatGreenFee,
  submitterName,
  timeOfDayEmoji,
  timeOfDayLabel,
} from '../lib/reportQueries'
import { HelpfulVote } from './HelpfulVote'
import { useToast } from '../context/ToastContext'

interface ReportCardExpandedProps {
  report: ReportDisplay
  showShare?: boolean
  onCourseClick?: () => void
}

function Field({ label, value }: { label: string; value: string | null }) {
  if (!value?.trim()) return null
  return (
    <div className="mb-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-green-dark/50">
        {label}
      </dt>
      <dd className="mt-1 text-sm text-green-dark">{value}</dd>
    </div>
  )
}

export function ReportCardExpanded({
  report,
  showShare = true,
  onCourseClick,
}: ReportCardExpandedProps) {
  const { showToast } = useToast()
  const course = report.courses
  const transport =
    report.transport_mode === 'walking'
      ? '🚶 Walking'
      : report.transport_mode === 'cart'
        ? '🛺 Cart'
        : null

  const shareUrl = `${window.location.origin}/report/${report.id}`

  const copyShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    try {
      await navigator.clipboard.writeText(shareUrl)
      showToast('Link copied!')
    } catch {
      showToast('Could not copy link')
    }
  }

  return (
    <article className="rounded-xl border border-green-pale bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          {onCourseClick ? (
            <button
              type="button"
              onClick={onCourseClick}
              className="text-left font-display text-lg font-bold text-green-mid"
            >
              {course.course_name}
            </button>
          ) : (
            <h2 className="font-display text-lg font-bold text-green-mid">
              {course.course_name}
            </h2>
          )}
          <p className="text-sm text-green-dark/70">
            {course.city}, {course.state} · {timeOfDayEmoji(report.time_of_day)}{' '}
            {timeOfDayLabel(report.time_of_day)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <time className="text-xs text-green-dark/50">
            {formatDate(report.date_played)}
          </time>
          {report.isOlderReport && (
            <span className="mt-1 block rounded bg-gold/20 px-2 py-0.5 text-xs font-medium text-gold">
              older report
            </span>
          )}
        </div>
      </div>

      <dl>
        <Field label="Greens" value={report.greens_report} />
        <Field label="Fairways & Tees" value={report.fairways_tees_report} />
        <Field label="Maintenance" value={report.maintenance_notes} />
        <Field label="Other conditions" value={report.other_conditions_notes} />
        <Field label="Walkability" value={report.walkability_notes} />
      </dl>

      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        {report.pace_of_play != null && (
          <span className="rounded-full bg-green-pale/80 px-3 py-1 font-medium">
            Pace {formatPace(report.pace_of_play)}
          </span>
        )}
        {report.price_paid != null && (
          <span className="rounded-full bg-green-pale/80 px-3 py-1 font-medium">
            {formatGreenFee(report.price_paid, report.holes_played)}
          </span>
        )}
        <span className="rounded-full bg-green-pale/80 px-3 py-1 font-medium">
          {submitterName(report.first_name, report.last_initial)}
        </span>
        {transport && (
          <span className="rounded-full bg-green-pale/80 px-3 py-1 font-medium">
            {transport}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-green-pale pt-3">
        <HelpfulVote
          reportId={report.id}
          initialCount={report.helpful_votes ?? 0}
        />
        {showShare && (
          <button
            type="button"
            onClick={(e) => void copyShare(e)}
            className="min-h-11 rounded-lg border border-green-mid/40 px-4 py-2 text-sm font-semibold text-green-mid active:bg-green-pale"
          >
            Share
          </button>
        )}
      </div>
    </article>
  )
}
