import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CourseSearch } from '../components/CourseSearch'
import { RecentCourses } from '../components/RecentCourses'
import { ReportCard } from '../components/ReportCard'
import { buildDisplayFeed } from '../lib/reportQueries'
import { fetchReportsFeed } from '../lib/reports'
import type { Course, ReportDisplay } from '../types'

export function Browse() {
  const navigate = useNavigate()
  const [searchCourse, setSearchCourse] = useState<Course | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [reports, setReports] = useState<ReportDisplay[]>([])
  const [loading, setLoading] = useState(true)

  const loadFeed = useCallback(async () => {
    setLoading(true)
    const raw = await fetchReportsFeed()
    setReports(buildDisplayFeed(raw))
    setLoading(false)
  }, [])

  useEffect(() => {
    void loadFeed()
  }, [loadFeed])

  useEffect(() => {
    if (!searchCourse) return
    navigate(`/course/${searchCourse.id}`)
    setSearchCourse(null)
  }, [searchCourse, navigate])

  const showRecent = searchQuery.trim().length < 3

  return (
    <div>
      <header className="mb-4">
        <h1 className="font-display text-2xl font-bold text-green-dark">
          OpenCourseReport
        </h1>
        <p className="text-sm text-green-dark/70">
          Real-time golf course conditions from golfers like you
        </p>
      </header>

      <CourseSearch
        value={searchCourse}
        onSelect={setSearchCourse}
        onClear={() => setSearchCourse(null)}
        onQueryChange={setSearchQuery}
        placeholder="Find a course…"
        label="Search courses"
      />

      {showRecent && <RecentCourses />}

      <section className="mt-6">
        <h2 className="mb-3 font-display text-lg font-bold text-green-dark">
          Recent Reports
        </h2>
        {loading && (
          <p className="text-sm text-green-dark/60">Loading reports…</p>
        )}
        {!loading && reports.length === 0 && (
          <p className="rounded-lg border border-green-pale bg-white p-4 text-sm text-green-dark/70">
            No reports yet. Be the first to{' '}
            <button
              type="button"
              onClick={() => navigate('/submit')}
              className="font-semibold text-green-mid underline"
            >
              submit one
            </button>
            .
          </p>
        )}
        {reports.map((r) => (
          <ReportCard key={r.id} report={r} />
        ))}
      </section>
    </div>
  )
}
