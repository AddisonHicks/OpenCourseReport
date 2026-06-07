import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { searchCourses } from '../lib/courses'
import { fetchLastReportDatesByCourseIds } from '../lib/reports'
import type { Course } from '../types'
import { BrowseCourseRow } from './BrowseCourseRow'

export function HomeSearchPanel() {
  const navigate = useNavigate()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<Course[]>([])
  const [lastReportDates, setLastReportDates] = useState<Map<string, string>>(
    new Map(),
  )
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 3) {
      setResults([])
      setLastReportDates(new Map())
      return
    }

    const t = window.setTimeout(async () => {
      setLoading(true)
      const found = await searchCourses(q)
      setResults(found)
      const dates = await fetchLastReportDatesByCourseIds(
        found.map((c) => c.id),
      )
      setLastReportDates(dates)
      setLoading(false)
    }, 250)

    return () => window.clearTimeout(t)
  }, [query])

  const clear = useCallback(() => {
    setQuery('')
    setResults([])
    setLastReportDates(new Map())
  }, [])

  const goToCourse = (courseId: string) => {
    navigate(`/course/${courseId}`)
  }

  const showResults = query.trim().length >= 3

  return (
    <section>
      <h2 className="font-display text-2xl font-bold text-green-dark">
        Search Courses
      </h2>
      <p className="mb-3 font-display text-base text-green-dark">
        To View Course Reports &amp; Submit Reports
      </p>

      <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
        <div className="flex items-center gap-2 px-4 py-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Find a Course"
            autoComplete="off"
            enterKeyHint="search"
            className="min-h-11 min-w-0 flex-1 bg-transparent font-body text-base text-green-dark placeholder:text-green-dark/45 focus:outline-none"
          />
          {query.length > 0 && (
            <button
              type="button"
              onClick={clear}
              aria-label="Clear search"
              className="flex min-h-11 min-w-11 items-center justify-center text-xl font-light text-green-dark/70"
            >
              ×
            </button>
          )}
        </div>

        {showResults && (
          <>
            <div className="border-t border-green-dark/10" />
            <div className="flex items-center justify-between px-4 py-2 font-body text-xs text-green-dark/50">
              <span>Course Name, Location</span>
              <span>Last Report</span>
            </div>
            {loading && (
              <p className="px-4 pb-3 font-body text-sm text-green-dark/50">Searching…</p>
            )}
            {!loading && results.length === 0 && (
              <p className="px-4 pb-3 font-body text-sm text-green-dark/50">
                No courses found.
              </p>
            )}
            {!loading &&
              results.map((course) => (
                <BrowseCourseRow
                  key={course.id}
                  course={course}
                  lastReportDate={lastReportDates.get(course.id) ?? null}
                  onSelect={() => goToCourse(course.id)}
                />
              ))}
          </>
        )}
      </div>
    </section>
  )
}
