import { formatCourseLocation } from '../lib/courses'
import type { Course } from '../types'

interface SubmitConfirmationProps {
  course: Course
  onHome: () => void
  onCoursePage: () => void
}

export function SubmitConfirmation({
  course,
  onHome,
  onCoursePage,
}: SubmitConfirmationProps) {
  return (
    <div className="-mx-4 px-4 py-8 text-center">
      <div className="mx-auto max-w-sm">
        <h1 className="font-display text-3xl font-bold text-green-dark">
          Report Submitted!
        </h1>
        <p className="mt-4 font-display text-base leading-relaxed text-green-dark/80">
          Thank you for sharing conditions for{' '}
          <span className="font-bold text-green-dark">{course.course_name}</span>
          .
        </p>
        <p className="mt-2 text-sm text-green-dark/60">
          {formatCourseLocation(course)}
        </p>

        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={onCoursePage}
            className="min-h-12 w-full rounded-xl bg-green-dark px-4 py-3 font-display text-lg font-bold text-sand"
          >
            View Course Page
          </button>
          <button
            type="button"
            onClick={onHome}
            className="min-h-12 w-full rounded-xl border-2 border-green-dark bg-sand px-4 py-3 font-display text-lg font-bold text-green-dark"
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}
