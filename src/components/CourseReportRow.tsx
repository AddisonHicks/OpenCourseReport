import type { ReportDisplay } from '../types'
import {
  formatDateWithWeekday,
  formatHolesPlayedLabel,
  formatPace,
  submitterName,
  timeOfDayLabel,
} from '../lib/reportQueries'

interface CourseReportRowProps {
  report: ReportDisplay
  onSelect: () => void
}

function transportLabel(mode: ReportDisplay['transport_mode']): string | null {
  if (mode === 'walking') return 'Walk'
  if (mode === 'cart') return 'Cart'
  return null
}

export function CourseReportRow({ report, onSelect }: CourseReportRowProps) {
  const transport = transportLabel(report.transport_mode)
  const details: string[] = [timeOfDayLabel(report.time_of_day)]

  const holes = formatHolesPlayedLabel(report.holes_played)
  if (holes) details.push(holes)
  if (report.pace_of_play != null) {
    details.push(formatPace(report.pace_of_play))
  }
  if (transport) details.push(transport)

  return (
    <button
      type="button"
      onClick={onSelect}
      className="w-full rounded-2xl bg-white px-4 py-3 text-left shadow-sm active:bg-green-dark/5"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-display font-bold text-green-dark">
            By: {submitterName(report.first_name, report.last_initial)}
          </p>
          <p className="mt-0.5 font-body text-sm text-green-dark/55">
            {details.join(', ')}
          </p>
        </div>
        <div className="shrink-0 text-right font-display text-sm text-green-dark">
          <p>Report date:</p>
          <time
            dateTime={report.date_played}
            className="font-semibold"
          >
            {formatDateWithWeekday(report.date_played)}
          </time>
          {report.isOlderReport && (
            <span className="mt-1 block rounded bg-gold/20 px-2 py-0.5 font-body text-xs font-medium text-gold">
              older report
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
