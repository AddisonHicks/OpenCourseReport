import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getCourseById } from '../lib/courses'
import { apply90DayFilter, formatDate, formatPace, timeOfDayEmoji } from '../lib/reportQueries'
import { fetchReportsForCourse } from '../lib/reports'
import type { Course, ReportDisplay } from '../types'

export function EmbedView() {
  const { courseId } = useParams<{ courseId: string }>()
  const [course, setCourse] = useState<Course | null>(null)
  const [reports, setReports] = useState<ReportDisplay[]>([])

  useEffect(() => {
    if (!courseId) return
    void (async () => {
      const [c, raw] = await Promise.all([
        getCourseById(courseId),
        fetchReportsForCourse(courseId),
      ])
      setCourse(c)
      setReports(apply90DayFilter(raw).slice(0, 5))
    })()
  }, [courseId])

  if (!course) {
    return (
      <div className="min-h-[200px] bg-sand p-4 font-body text-sm text-green-dark">
        Loading…
      </div>
    )
  }

  return (
    <div className="min-h-[200px] bg-sand p-3 font-body text-green-dark">
      <div className="mb-3 border-b border-green-pale pb-2">
        <div className="font-display text-base font-bold text-green-dark">
          {course.course_name}
        </div>
        <div className="text-xs text-green-dark/60">
          {course.city}, {course.state} · OpenCourseReport
        </div>
      </div>
      {reports.length === 0 ? (
        <p className="text-xs text-green-dark/60">No recent reports.</p>
      ) : (
        <ul className="space-y-2">
          {reports.map((r) => (
            <li
              key={r.id}
              className="rounded border border-green-pale bg-white p-2 text-xs"
            >
              <div className="flex justify-between gap-2">
                <span>
                  {timeOfDayEmoji(r.time_of_day)} {formatDate(r.date_played)}
                </span>
                {r.isOlderReport && (
                  <span className="text-gold">older</span>
                )}
              </div>
              <p className="mt-1 text-green-dark/80">
                {(r.greens_report ?? 'No greens notes').slice(0, 80)}
                {(r.greens_report?.length ?? 0) > 80 ? '…' : ''}
              </p>
              {r.pace_of_play != null && (
                <span className="mt-1 inline-block text-green-dark/60">
                  Pace {formatPace(r.pace_of_play)}
                </span>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
