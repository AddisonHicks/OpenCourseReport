import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { CourseReportRow } from '../components/CourseReportRow'
import { ReportModal } from '../components/ReportModal'
import { ShareButton } from '../components/ShareButton'
import { formatCourseLocation, getCourseBySlug } from '../lib/courses'
import {
  buildCourseOgMeta,
  getOgImageUrls,
  normalizeSiteUrl,
} from '../lib/ogMeta'
import { setPageMeta, resetPageMeta } from '../lib/pageMeta'
import {
  apply90DayFilter,
  sortReportsByDatePlayed,
} from '../lib/reportQueries'
import { fetchReportsForCourse } from '../lib/reports'
import { courseShareUrl } from '../lib/share'
import type { Course, ReportDisplay } from '../types'

export function CoursePage() {
  const { courseSlug } = useParams<{ courseSlug: string }>()
  const navigate = useNavigate()
  const [course, setCourse] = useState<Course | null>(null)
  const [reports, setReports] = useState<ReportDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [activeReport, setActiveReport] = useState<ReportDisplay | null>(null)

  const load = useCallback(async () => {
    if (!courseSlug) return
    setLoading(true)
    const c = await getCourseBySlug(courseSlug)
    const raw = c ? await fetchReportsForCourse(c.id) : []
    setCourse(c)
    setReports(apply90DayFilter(raw))
    setLoading(false)
  }, [courseSlug])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!course) return

    const images = getOgImageUrls({
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      OG_IMAGE_HOME: import.meta.env.VITE_OG_IMAGE_HOME,
      OG_IMAGE_COURSE: import.meta.env.VITE_OG_IMAGE_COURSE,
      OG_IMAGE_REPORT: import.meta.env.VITE_OG_IMAGE_REPORT,
    })
    setPageMeta(
      buildCourseOgMeta(
        course,
        normalizeSiteUrl(window.location.origin),
        images,
      ),
    )

    return () => {
      resetPageMeta()
    }
  }, [course])

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
        <Link to="/" className="text-link">
          ← Back to Browse
        </Link>
      </div>
    )
  }

  return (
    <div className="-mx-4 space-y-8 px-4">
      <header>
        <h1 className="font-display text-2xl font-bold leading-tight text-green-dark">
          {course.course_name}
        </h1>
        <p className="font-display text-base text-green-dark/70">
          {formatCourseLocation(course)}
        </p>
        <ShareButton
          url={courseShareUrl(course)}
          title={course.course_name}
          text={`Golf reports for ${course.course_name}`}
          label="Share Course Page"
          className="text-link text-link-display mt-1 text-xs active:text-green-dark"
        />
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
