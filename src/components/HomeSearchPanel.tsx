import { useCallback, useEffect, useState } from 'react'
import { searchCourses, coursePath } from '../lib/courses'
import { getRecentCourses } from '../lib/localStorage'
import { fetchLastReportDatesByCourseIds } from '../lib/reports'
import type { Course, RecentCourse } from '../types'
import { BrowseCourseRow } from './BrowseCourseRow'

function recentAsCourse(course: RecentCourse): Course {
  return {
    id: course.id,
    slug: course.slug ?? null,
    course_name: course.course_name,
    city: course.city,
    state: course.state,
    zipcode: course.zipcode ?? null,
    holes: null,
    course_type: null,
    is_user_submitted: false,
    is_approved: true,
    created_at: '',
  }
}

export function HomeSearchPanel() {
  const [query, setQuery] = useState('')
  const [focused, setFocused] = useState(false)
  const [results, setResults] = useState<Course[]>([])
  const [lastReportDates, setLastReportDates] = useState<Map<string, string>>(
    new Map(),
  )
  const [recentReportDates, setRecentReportDates] = useState<
    Map<string, string>
  >(new Map())
  const [loading, setLoading] = useState(false)

  const recentCourses = getRecentCourses()
  const showRecent =
    focused && query.trim().length === 0 && recentCourses.length > 0

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

  useEffect(() => {
    if (!focused || query.trim().length > 0) {
      setRecentReportDates(new Map())
      return
    }

    const recent = getRecentCourses()
    if (recent.length === 0) {
      setRecentReportDates(new Map())
      return
    }

    void fetchLastReportDatesByCourseIds(recent.map((c) => c.id)).then(
      setRecentReportDates,
    )
  }, [focused, query])

  const clear = useCallback(() => {
    setQuery('')
    setResults([])
    setLastReportDates(new Map())
  }, [])

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
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
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

        {showRecent && (
          <div onMouseDown={(e) => e.preventDefault()}>
            <div className="border-t border-green-dark/10" />
            <div className="flex items-center justify-between px-4 py-2 font-body text-xs text-green-dark/50">
              <span>Recent Courses</span>
              <span>Last Report</span>
            </div>
            {recentCourses.map((course) => (
              <BrowseCourseRow
                key={course.id}
                course={recentAsCourse(course)}
                lastReportDate={recentReportDates.get(course.id) ?? null}
                to={coursePath({
                  slug: course.slug ?? null,
                  course_name: course.course_name,
                  zipcode: course.zipcode ?? null,
                  city: course.city,
                  state: course.state,
                })}
                variant="list"
              />
            ))}
          </div>
        )}

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
                  to={coursePath(course)}
                />
              ))}
          </>
        )}
      </div>
    </section>
  )
}
