import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CourseReportRow } from '../components/CourseReportRow'
import { ReportModal } from '../components/ReportModal'
import { getCourseById, formatCourseLocation } from '../lib/courses'
import {
  apply90DayFilter,
  formatDateNumeric,
  sortReportsByDatePlayed,
} from '../lib/reportQueries'
import { fetchReportsForCourse } from '../lib/reports'
import type { Course, ReportDisplay } from '../types'

export function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [reports, setReports] = useState<ReportDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [activeReport, setActiveReport] = useState<ReportDisplay | null>(null)

  const load = useCallback(async () => {
    if (!courseId) return
    setLoading(true)
    const [c, raw] = await Promise.all([
      getCourseById(courseId),
      fetchReportsForCourse(courseId),
    ])
    setCourse(c)
    setReports(apply90DayFilter(raw))
    setLoading(false)
  }, [courseId])

  useEffect(() => {
    void load()
  }, [load])

  const sortedReports = useMemo(
    () => sortReportsByDatePlayed(reports),
    [reports],
  )

  const lastReport = sortedReports[0] ?? null
  const recentReports = sortedReports.slice(1)

  if (loading) {
    return <p className="text-sm text-green-dark/60">Loading course…</p>
  }

  if (!course) {
    return (
      <div>
        <p className="mb-4 text-green-dark">Course not found.</p>
        <Link to="/" className="font-semibold text-green-mid">
          ← Back to Browse
        </Link>
      </div>
    )
  }

  return (
    <div className="-mx-4 space-y-8 px-4">
      <header className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="font-display text-2xl font-bold leading-tight text-green-dark">
            {course.course_name}
          </h1>
          <p className="font-display text-base text-green-dark/70">
            {formatCourseLocation(course)}
          </p>
        </div>
        <div className="shrink-0 pt-1 text-right font-display text-sm text-green-dark">
          <p>Last Report:</p>
          <p className="font-semibold">
            {lastReport ? formatDateNumeric(lastReport.date_played) : '—'}
          </p>
        </div>
      </header>

      <button
        type="button"
        onClick={() =>
          navigate(`/submit?course=${course.id}`, {
            state: { courseId: course.id, course },
          })
        }
        className="min-h-12 w-full rounded-xl bg-green-dark px-4 py-3 font-display text-lg font-bold text-sand"
      >
        Submit Report
      </button>

      <section>
        <h2 className="mb-3 font-display text-2xl font-bold text-green-dark">
          Last Report
        </h2>
        {!lastReport ? (
          <div className="rounded-xl bg-tan px-4 py-5 text-sm text-green-dark/70">
            No reports for this course yet.
          </div>
        ) : (
          <CourseReportRow
            report={lastReport}
            onSelect={() => setActiveReport(lastReport)}
          />
        )}
      </section>

      {recentReports.length > 0 && (
        <section>
          <h2 className="mb-3 font-display text-2xl font-bold text-green-dark">
            Recent Reports
          </h2>
          <div className="space-y-2">
            {recentReports.map((report) => (
              <CourseReportRow
                key={report.id}
                report={report}
                onSelect={() => setActiveReport(report)}
              />
            ))}
          </div>
        </section>
      )}

      {activeReport && (
        <ReportModal
          report={activeReport}
          onClose={() => setActiveReport(null)}
        />
      )}
    </div>
  )
}
