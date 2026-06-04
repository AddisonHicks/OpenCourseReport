import { useNavigate } from 'react-router-dom'
import { getRecentCourses } from '../lib/localStorage'

interface RecentCoursesProps {
  variant?: 'pills' | 'tiles'
  onSelect?: (id: string) => void
}

export function RecentCourses({
  variant = 'pills',
  onSelect,
}: RecentCoursesProps) {
  const navigate = useNavigate()
  const courses = getRecentCourses()

  if (courses.length === 0) return null

  const handleTap = (id: string) => {
    if (onSelect) {
      onSelect(id)
    } else {
      navigate(`/course/${id}`)
    }
  }

  if (variant === 'tiles') {
    return (
      <div className="mb-4">
        <h2 className="mb-2 font-display text-sm font-bold text-green-dark">
          Recent Courses
        </h2>
        <div className="flex flex-col gap-2">
          {courses.map((c) => (
            <button
              key={c.id}
              type="button"
              onClick={() => handleTap(c.id)}
              className="min-h-11 rounded-lg border border-green-pale bg-white px-4 py-3 text-left text-sm transition-colors active:bg-green-pale/40"
            >
              <span className="font-semibold text-green-dark">
                {c.course_name}
              </span>
              <span className="text-green-dark/60">
                {' '}
                · {c.city}, {c.state}
              </span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <section className="mb-4">
      <h2 className="mb-2 font-display text-sm font-bold text-green-dark">
        Your Recent Courses
      </h2>
      <div className="flex flex-wrap gap-2">
        {courses.map((c) => (
          <button
            key={c.id}
            type="button"
            onClick={() => handleTap(c.id)}
            className="min-h-11 rounded-full border border-green-mid/40 bg-white px-4 py-2 text-sm font-medium text-green-dark transition-colors active:bg-green-pale"
          >
            {c.course_name} · {c.city}, {c.state}
          </button>
        ))}
      </div>
    </section>
  )
}
