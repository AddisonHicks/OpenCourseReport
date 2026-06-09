import { Link } from 'react-router-dom'
import { formatDateNumeric } from '../lib/reportQueries'
import { formatCourseLocation } from '../lib/courses'
import type { Course } from '../types'

interface BrowseCourseRowProps {
  course: Course
  lastReportDate: string | null
  to?: string
  onSelect?: () => void
  variant?: 'list' | 'card'
}

function rowClassName(variant: 'list' | 'card') {
  return `flex min-h-11 w-full items-center justify-between gap-3 text-left active:bg-green-dark/5 ${
    variant === 'list'
      ? 'border-b border-green-dark/10 px-4 py-3 last:border-0'
      : 'rounded-2xl bg-white px-4 py-3 shadow-sm'
  }`
}

function RowContent({
  course,
  lastReportDate,
}: Pick<BrowseCourseRowProps, 'course' | 'lastReportDate'>) {
  return (
    <>
      <div className="min-w-0">
        <div className="truncate font-display font-bold text-green-dark">
          {course.course_name}
        </div>
        <div className="font-body text-sm text-green-dark/55">
          {formatCourseLocation(course)}
        </div>
      </div>
      <span className="shrink-0 font-body text-sm text-green-dark/55">
        {lastReportDate ? (
          <time dateTime={lastReportDate}>{formatDateNumeric(lastReportDate)}</time>
        ) : (
          'No reports yet'
        )}
      </span>
    </>
  )
}

export function BrowseCourseRow({
  course,
  lastReportDate,
  to,
  onSelect,
  variant = 'list',
}: BrowseCourseRowProps) {
  const className = rowClassName(variant)

  if (to) {
    return (
      <Link to={to} className={`${className} no-underline`}>
        <RowContent course={course} lastReportDate={lastReportDate} />
      </Link>
    )
  }

  return (
    <button type="button" onClick={onSelect} className={className}>
      <RowContent course={course} lastReportDate={lastReportDate} />
    </button>
  )
}
