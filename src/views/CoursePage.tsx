import { useCallback, useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { EmbedSnippet } from '../components/EmbedSnippet'
import { ReportCard } from '../components/ReportCard'
import { useToast } from '../context/ToastContext'
import { getCourseById } from '../lib/courses'
import {
  apply90DayFilter,
  average,
  formatPace,
  formatPrice,
  timeOfDayEmoji,
} from '../lib/reportQueries'
import { fetchReportsForCourse } from '../lib/reports'
import type { Course, ReportDisplay, TimeOfDay } from '../types'

export function CoursePage() {
  const { courseId } = useParams<{ courseId: string }>()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const [course, setCourse] = useState<Course | null>(null)
  const [reports, setReports] = useState<ReportDisplay[]>([])
  const [loading, setLoading] = useState(true)

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

  const statsReports = reports.filter((r) => !r.isOlderReport)

  const avgPace = average(statsReports.map((r) => r.pace_of_play))
  const avgPrice = average(statsReports.map((r) => r.price_paid))
  const walkCount = statsReports.filter((r) => r.transport_mode === 'walking').length
  const cartCount = statsReports.filter((r) => r.transport_mode === 'cart').length
  const transportTotal = walkCount + cartCount
  const walkPct =
    transportTotal > 0 ? Math.round((walkCount / transportTotal) * 100) : null

  const paceByTod = (tod: TimeOfDay) => {
    const subset = statsReports.filter((r) => r.time_of_day === tod)
    return formatPace(average(subset.map((r) => r.pace_of_play)))
  }

  const copyCourseUrl = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href)
      showToast('Course link copied!')
    } catch {
      showToast('Could not copy link')
    }
  }

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
    <div>
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="mb-3 min-h-11 text-sm font-medium text-green-mid"
      >
        ← Back
      </button>

      <header className="mb-4">
        <h1 className="font-display text-2xl font-bold text-green-dark">
          {course.course_name}
        </h1>
        <p className="text-sm text-green-dark/70">
          {course.city}, {course.state}
          {course.course_type && ` · ${course.course_type}`}
          {course.holes != null && ` · ${course.holes} holes`}
        </p>
        {(course.phone || course.website) && (
          <p className="mt-2 text-sm">
            {course.phone && (
              <a href={`tel:${course.phone}`} className="text-green-mid">
                {course.phone}
              </a>
            )}
            {course.phone && course.website && ' · '}
            {course.website && (
              <a
                href={course.website.startsWith('http') ? course.website : `https://${course.website}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-green-mid underline"
              >
                Website
              </a>
            )}
          </p>
        )}
        {!course.is_approved && course.is_user_submitted && (
          <p className="mt-2 text-xs text-gold">User-submitted · pending review</p>
        )}
      </header>

      {statsReports.length > 0 && (
        <>
          <div className="mb-4 grid grid-cols-3 gap-2 rounded-xl border border-green-pale bg-white p-3 text-center text-xs">
            <div>
              <div className="font-bold text-green-dark">
                {avgPace != null ? formatPace(Math.round(avgPace)) : '—'}
              </div>
              <div className="text-green-dark/50">Avg pace</div>
            </div>
            <div>
              <div className="font-bold text-green-dark">
                {avgPrice != null ? formatPrice(avgPrice) : '—'}
              </div>
              <div className="text-green-dark/50">Avg fee</div>
            </div>
            <div>
              <div className="font-bold text-green-dark">
                {walkPct != null ? `${walkPct}% walk` : '—'}
              </div>
              <div className="text-green-dark/50">Transport</div>
            </div>
          </div>

          <div className="mb-4 rounded-xl border border-green-pale bg-white p-3 text-sm">
            <h2 className="mb-2 font-display text-sm font-bold">Pace by Time of Day</h2>
            <ul className="space-y-1 text-green-dark/80">
              <li>
                {timeOfDayEmoji('morning')} AM avg: {paceByTod('morning')}
              </li>
              <li>
                {timeOfDayEmoji('midday')} Mid avg: {paceByTod('midday')}
              </li>
              <li>
                {timeOfDayEmoji('afternoon')} PM avg: {paceByTod('afternoon')}
              </li>
            </ul>
          </div>
        </>
      )}

      <div className="mb-4 flex flex-col gap-2">
        <button
          type="button"
          onClick={() => navigate('/submit', { state: { courseId: course.id } })}
          className="min-h-11 w-full rounded-lg bg-green-mid px-4 py-3 text-sm font-bold text-sand"
        >
          Submit a report for this course
        </button>
        <button
          type="button"
          onClick={() => void copyCourseUrl()}
          className="min-h-11 w-full rounded-lg border border-green-mid/40 bg-white px-4 py-3 text-sm font-semibold text-green-mid"
        >
          Share Course Page
        </button>
        <EmbedSnippet courseId={course.id} />
      </div>

      <section>
        <h2 className="mb-3 font-display text-lg font-bold text-green-dark">
          Reports
        </h2>
        {reports.length === 0 ? (
          <p className="text-sm text-green-dark/60">No reports for this course yet.</p>
        ) : (
          reports.map((r) => <ReportCard key={r.id} report={r} />)
        )}
      </section>
    </div>
  )
}
