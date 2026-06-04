import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { ReportDisplay } from '../types'
import {
  formatDate,
  formatPace,
  formatPrice,
  submitterName,
  timeOfDayEmoji,
} from '../lib/reportQueries'
import { HelpfulVote } from './HelpfulVote'
import { ReportCardExpanded } from './ReportCardExpanded'

interface ReportCardProps {
  report: ReportDisplay
}

function snippet(text: string | null, max = 60): string {
  if (!text?.trim()) return 'No greens notes'
  const t = text.trim()
  return t.length <= max ? t : `${t.slice(0, max)}…`
}

export function ReportCard({ report }: ReportCardProps) {
  const [expanded, setExpanded] = useState(false)
  const navigate = useNavigate()
  const course = report.courses

  const goCourse = (e: React.MouseEvent) => {
    e.stopPropagation()
    navigate(`/course/${course.id}`)
  }

  if (expanded) {
    return (
      <div className="mb-3">
        <ReportCardExpanded
          report={report}
          onCourseClick={() => navigate(`/course/${course.id}`)}
        />
        <button
          type="button"
          onClick={() => setExpanded(false)}
          className="mt-2 min-h-11 w-full text-sm font-medium text-green-mid"
        >
          Show less
        </button>
      </div>
    )
  }

  const transportIcon =
    report.transport_mode === 'walking'
      ? '🚶'
      : report.transport_mode === 'cart'
        ? '🛺'
        : ''

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => setExpanded(true)}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          setExpanded(true)
        }
      }}
      className="mb-3 w-full cursor-pointer rounded-xl border border-green-pale bg-white p-4 text-left shadow-sm transition-colors active:bg-green-pale/20"
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <span
            role="link"
            onClick={goCourse}
            onKeyDown={(e) => e.key === 'Enter' && goCourse(e as unknown as React.MouseEvent)}
            tabIndex={0}
            className="font-display text-base font-bold text-green-mid"
          >
            {course.course_name}
          </span>
          <p className="text-sm text-green-dark/70">
            {course.city}, {course.state} · {timeOfDayEmoji(report.time_of_day)}
            {transportIcon && ` · ${transportIcon}`}
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

      <p className="mb-3 text-sm text-green-dark/90">
        {snippet(report.greens_report)}
      </p>

      <div className="mb-3 flex flex-wrap gap-2 text-xs">
        {report.pace_of_play != null && (
          <span className="rounded-full bg-green-pale/80 px-3 py-1 font-medium">
            {formatPace(report.pace_of_play)}
          </span>
        )}
        {report.price_paid != null && (
          <span className="rounded-full bg-green-pale/80 px-3 py-1 font-medium">
            {formatPrice(report.price_paid)}
          </span>
        )}
        <span className="rounded-full bg-green-pale/80 px-3 py-1 font-medium">
          {submitterName(report.first_name, report.last_initial)}
        </span>
      </div>

      <div
        className="flex items-center justify-start"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
        role="presentation"
      >
        <HelpfulVote
          reportId={report.id}
          initialCount={report.helpful_votes ?? 0}
        />
      </div>
    </div>
  )
}
