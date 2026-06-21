import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { fetchAllApprovedCourses, formatCourseLocation, groupCoursesByState, coursePath, type CoursesByState } from '../lib/courses'

export function CourseList() {
  const [loading, setLoading] = useState(true)
  const [courseCount, setCourseCount] = useState(0)
  const [groups, setGroups] = useState<CoursesByState[]>([])

  useEffect(() => {
    void fetchAllApprovedCourses()
      .then((courses) => {
        setCourseCount(courses.length)
        setGroups(groupCoursesByState(courses))
      })
      .finally(() => setLoading(false))
  }, [])

  const stateNav = useMemo(
    () => groups.map((g) => ({ abbr: g.stateAbbr, name: g.stateName })),
    [groups],
  )

  if (loading) {
    return <p className="text-sm text-green-dark/60">Loading courses…</p>
  }

  if (groups.length === 0) {
    return (
      <div>
        <h1 className="mb-2 font-display text-3xl font-bold text-green-dark">
          Course List
        </h1>
        <p className="text-green-dark/70">No courses in the database yet.</p>
        <p className="mt-4">
          <Link to="/add-course" className="font-semibold text-green-mid underline">
            Add a course
          </Link>
        </p>
      </div>
    )
  }

  return (
    <div className="-mx-4 px-4">
      <header className="mb-6">
        <h1 className="font-display text-3xl font-bold text-green-dark">
          Course List
        </h1>
        <p className="mt-1 font-body text-sm text-green-dark/70">
          {courseCount} courses across {groups.length} states
        </p>
      </header>

      <nav className="mb-8" aria-label="Jump to state">
        <p className="mb-2 font-display text-sm font-semibold text-green-dark">
          Jump to state
        </p>
        <div className="flex flex-wrap gap-2">
          {stateNav.map((state) => (
            <a
              key={state.abbr}
              href={`#state-${state.abbr}`}
              className="rounded-full bg-white px-3 py-1.5 font-body text-sm font-semibold text-green-dark shadow-sm active:bg-green-pale/50"
            >
              {state.abbr}
            </a>
          ))}
        </div>
      </nav>

      <div className="space-y-8">
        {groups.map((group) => (
          <section key={group.stateAbbr} id={`state-${group.stateAbbr}`}>
            <h2 className="mb-3 font-display text-2xl font-bold text-green-dark">
              {group.stateName}
            </h2>
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              {group.courses.map((course) => (
                <Link
                  key={course.id}
                  to={coursePath(course)}
                  className="flex min-h-11 items-center border-b border-green-dark/10 px-4 py-3 last:border-0 active:bg-green-dark/5"
                >
                  <div className="min-w-0">
                    <div className="truncate font-display font-bold text-green-dark">
                      {course.course_name}
                    </div>
                    <div className="font-body text-sm text-green-dark/55">
                      {formatCourseLocation(course)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  )
}
