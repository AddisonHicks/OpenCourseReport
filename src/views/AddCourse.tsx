import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import { addCourse, coursePath } from '../lib/courses'
import type { Course } from '../types'
import { suggestZipFromCityState } from '../lib/zipcode'
import { isValidUsStateAbbr, US_STATES } from '../lib/usStates'
import type { CourseType } from '../types'
const COURSE_TYPES: CourseType[] = ['Public', 'Semi-Private', 'Private']
const HOLE_OPTIONS = [9, 18, 27, 36] as const

export function AddCourse() {
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [courseName, setCourseName] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [zipcode, setZipcode] = useState('')
  const [holes, setHoles] = useState('')
  const [courseType, setCourseType] = useState<CourseType>('Public')
  const [submitting, setSubmitting] = useState(false)
  const [addedCourse, setAddedCourse] = useState<Course | null>(null)
  const [autoZip, setAutoZip] = useState(true)
  const [zipSuggested, setZipSuggested] = useState(false)
  const [lookingUpZip, setLookingUpZip] = useState(false)

  useEffect(() => {
    const c = city.trim()
    const s = state.trim()
    if (!autoZip || c.length < 2 || !isValidUsStateAbbr(s)) {
      setZipSuggested(false)
      return
    }

    const timer = window.setTimeout(() => {
      setLookingUpZip(true)
      void suggestZipFromCityState(c, s.toUpperCase())
        .then((suggested) => {
          if (!autoZip) return
          if (suggested) {
            setZipcode(suggested)
            setZipSuggested(true)
          } else {
            setZipSuggested(false)
          }
        })
        .finally(() => setLookingUpZip(false))
    }, 400)

    return () => window.clearTimeout(timer)
  }, [city, state, autoZip])

  const handleCityChange = (value: string) => {
    setCity(value)
    setAutoZip(true)
  }

  const handleStateChange = (value: string) => {
    setState(value)
    setAutoZip(true)
  }

  const handleZipChange = (value: string) => {
    setZipcode(value.replace(/\D/g, '').slice(0, 5))
    setAutoZip(false)
    setZipSuggested(false)
  }
  const labelClass = 'mb-1 block font-display text-base text-green-dark'
  const inputClass =
    'min-h-11 w-full rounded-lg border-0 bg-white px-3 py-3 text-base text-green-dark shadow-sm focus:outline-none focus:ring-2 focus:ring-green-mid/40'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!courseName.trim() || !city.trim() || !isValidUsStateAbbr(state) || !zipcode.trim()) {
      showToast('Course name, city, state, and zipcode are required.')
      return
    }

    setSubmitting(true)
    const { course, error } = await addCourse({
      course_name: courseName,
      city,
      state: state.toUpperCase(),
      zipcode,
      holes: holes ? parseInt(holes, 10) : null,
      course_type: courseType,
    })
    setSubmitting(false)

    if (error || !course) {
      showToast('Could not add course. Try again.')
      return
    }

    setAddedCourse(course)
    showToast('Course added!')
  }

  const resetForm = () => {
    setCourseName('')
    setCity('')
    setState('')
    setZipcode('')
    setHoles('')
    setCourseType('Public')
    setAddedCourse(null)
    setAutoZip(true)
    setZipSuggested(false)
  }
  if (addedCourse) {
    return (
      <div className="-mx-4 px-4 py-8 text-center">
        <h1 className="font-display text-3xl font-bold text-green-dark">
          Course Added!
        </h1>
        <p className="mt-4 font-display text-base text-green-dark/80">
          <span className="font-bold text-green-dark">{courseName}</span> is now
          in the database and available for reports.
        </p>
        <div className="mt-8 flex flex-col gap-3">
          <button
            type="button"
            onClick={() => navigate(coursePath(addedCourse))}
            className="min-h-12 w-full rounded-xl bg-green-dark px-4 py-3 font-display text-lg font-bold text-sand"
          >
            View Course Page
          </button>
          <button
            type="button"
            onClick={resetForm}
            className="min-h-12 w-full rounded-xl border-2 border-green-dark bg-sand px-4 py-3 font-display text-lg font-bold text-green-dark"
          >
            Add Another Course
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="-mx-4 px-4">
      <header className="mb-6">
        <h1 className="font-display text-2xl font-bold text-green-dark">
          Add a Course
        </h1>
        <p className="mt-2 font-display text-base text-green-dark/70">
          Add a course to the shared database so golfers can submit reports for
          it.
        </p>
      </header>

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div>
          <label className={labelClass}>Course Name:</label>
          <input
            required
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            className={inputClass}
          />
        </div>

        <div>
          <label className={labelClass}>City:</label>
          <input
            required
            value={city}
            onChange={(e) => handleCityChange(e.target.value)}
            className={inputClass}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>State:</label>
            <select
              required
              value={state}
              onChange={(e) => handleStateChange(e.target.value)}
              className={inputClass}
            >
              <option value="">Select state</option>
              {US_STATES.map(({ abbr, name }) => (
                <option key={abbr} value={abbr}>
                  {abbr} — {name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Zip:</label>
            <input
              required
              value={zipcode}
              onChange={(e) => handleZipChange(e.target.value)}
              inputMode="numeric"
              pattern="[0-9]{5}"
              maxLength={5}
              className={inputClass}
            />
          </div>
        </div>
        {lookingUpZip && (
          <p className="-mt-2 font-body text-xs text-green-dark/50">
            Looking up zip…
          </p>
        )}
        {!lookingUpZip && zipSuggested && (
          <p className="-mt-2 font-body text-xs text-green-dark/50">
            Suggested from city &amp; state — confirm or edit if needed.
          </p>
        )}
        {!lookingUpZip &&
          autoZip &&
          city.trim().length >= 2 &&
          isValidUsStateAbbr(state) &&
          !zipcode &&
          !zipSuggested && (
            <p className="-mt-2 font-body text-xs text-green-dark/50">
              No zip found for this city — enter one manually.
            </p>
          )}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>Holes:</label>
            <select
              value={holes}
              onChange={(e) => setHoles(e.target.value)}
              className={inputClass}
            >
              <option value="">Select holes</option>
              {HOLE_OPTIONS.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Course Type:</label>
            <select
              value={courseType}
              onChange={(e) => setCourseType(e.target.value as CourseType)}
              className={inputClass}
            >
              {COURSE_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="min-h-12 w-full rounded-xl bg-green-dark px-4 py-3 font-display text-lg font-bold text-sand disabled:opacity-60"
        >
          {submitting ? 'Adding…' : 'Add Course'}
        </button>

        <p className="text-center text-sm">
          <Link to="/about" className="font-semibold text-green-mid underline">
            ← Back to About
          </Link>
        </p>
      </form>
    </div>
  )
}
