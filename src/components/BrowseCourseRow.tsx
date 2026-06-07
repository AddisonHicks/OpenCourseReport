import { formatDateNumeric } from '../lib/reportQueries'
import { formatCourseLocation } from '../lib/courses'
import type { Course } from '../types'
interface BrowseCourseRowProps {
  course: Course
  lastReportDate: string | null
  onSelect: () => void
  variant?: 'list' | 'card'
}

export function BrowseCourseRow({
  course,
  lastReportDate,
  onSelect,
  variant = 'list',
}: BrowseCourseRowProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`flex min-h-11 w-full items-center justify-between gap-3 text-left active:bg-green-dark/5 ${
        variant === 'list'
          ? 'border-b border-green-dark/10 px-4 py-3 last:border-0'
          : 'rounded-2xl bg-white px-4 py-3 shadow-sm'
      }`}
    >
      <div className="min-w-0">
        <div className="truncate font-display font-bold text-green-dark">
          {course.course_name}
        </div>
        <div className="font-body text-sm text-green-dark/55">
          {formatCourseLocation(course)}
        </div>
      </div>
      <time className="shrink-0 font-body text-sm text-green-dark/55">
        {lastReportDate ? formatDateNumeric(lastReportDate) : '—'}
      </time>
    </button>
  )
}
