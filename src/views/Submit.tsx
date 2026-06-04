import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CourseSearch } from '../components/CourseSearch'
import { RecentCourses } from '../components/RecentCourses'
import { TransportToggle } from '../components/TransportToggle'
import { useToast } from '../context/ToastContext'
import { getCourseById } from '../lib/courses'
import { addRecentCourse, setLastSubmitted } from '../lib/localStorage'
import { supabase } from '../lib/supabase'
import type { Course, CourseType, TimeOfDay, TransportMode } from '../types'

interface SubmitLocationState {
  courseId?: string
}

const COURSE_TYPES: CourseType[] = ['Public', 'Semi-Private', 'Private']

export function Submit() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()
  const state = location.state as SubmitLocationState | null

  const [firstName, setFirstName] = useState('')
  const [lastInitial, setLastInitial] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [addNewCourse, setAddNewCourse] = useState(false)
  const [newCourseName, setNewCourseName] = useState('')
  const [newCity, setNewCity] = useState('')
  const [newState, setNewState] = useState('')
  const [newHoles, setNewHoles] = useState('')
  const [newCourseType, setNewCourseType] = useState<CourseType>('Public')
  const [datePlayed, setDatePlayed] = useState(
    () => new Date().toISOString().split('T')[0],
  )
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning')
  const [pricePaid, setPricePaid] = useState('')
  const [paceHours, setPaceHours] = useState('')
  const [paceMinutes, setPaceMinutes] = useState('')
  const [transport, setTransport] = useState<TransportMode | null>(null)
  const [walkability, setWalkability] = useState('')
  const [greens, setGreens] = useState('')
  const [fairways, setFairways] = useState('')
  const [maintenance, setMaintenance] = useState('')
  const [otherNotes, setOtherNotes] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    const id = state?.courseId
    if (!id) return
    void getCourseById(id).then((c) => {
      if (c) setSelectedCourse(c)
    })
  }, [state?.courseId])

  const prefillFromRecent = async (courseId: string) => {
    const c = await getCourseById(courseId)
    if (c) {
      setSelectedCourse(c)
      setAddNewCourse(false)
    }
  }

  const resetForm = () => {
    setFirstName('')
    setLastInitial('')
    setSelectedCourse(null)
    setAddNewCourse(false)
    setNewCourseName('')
    setNewCity('')
    setNewState('')
    setNewHoles('')
    setNewCourseType('Public')
    setDatePlayed(new Date().toISOString().split('T')[0])
    setTimeOfDay('morning')
    setPricePaid('')
    setPaceHours('')
    setPaceMinutes('')
    setTransport(null)
    setWalkability('')
    setGreens('')
    setFairways('')
    setMaintenance('')
    setOtherNotes('')
  }

  const resolveCourse = async (): Promise<Course | null> => {
    if (selectedCourse) return selectedCourse
    if (!addNewCourse) return null

    const { data, error } = await supabase
      .from('courses')
      .insert({
        course_name: newCourseName.trim(),
        city: newCity.trim(),
        state: newState.trim(),
        holes: newHoles ? parseInt(newHoles, 10) : null,
        course_type: newCourseType,
        is_user_submitted: true,
        is_approved: false,
      })
      .select()
      .single()

    if (error) {
      console.error('Create course error:', error)
      showToast('Could not add course. Try again.')
      return null
    }
    return data as Course
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (honeypot) return

    if (!firstName.trim() || !lastInitial.trim() || !datePlayed || !timeOfDay) {
      showToast('Please fill required fields.')
      return
    }
    if (lastInitial.trim().length !== 1) {
      showToast('Last initial must be one letter.')
      return
    }
    if (!selectedCourse && !addNewCourse) {
      showToast('Select or add a course.')
      return
    }
    if (addNewCourse && (!newCourseName.trim() || !newCity.trim() || !newState.trim())) {
      showToast('Complete new course details.')
      return
    }

    setSubmitting(true)
    const course = await resolveCourse()
    if (!course) {
      setSubmitting(false)
      return
    }

    const h = parseInt(paceHours, 10) || 0
    const m = parseInt(paceMinutes, 10) || 0
    const paceTotal = h > 0 || m > 0 ? h * 60 + m : null

    const { error } = await supabase.from('reports').insert({
      first_name: firstName.trim(),
      last_initial: lastInitial.trim().charAt(0).toUpperCase(),
      course_id: course.id,
      date_played: datePlayed,
      time_of_day: timeOfDay,
      transport_mode: transport,
      walkability_notes: walkability.trim() || null,
      price_paid: pricePaid ? parseFloat(pricePaid) : null,
      pace_of_play: paceTotal,
      greens_report: greens.trim() || null,
      fairways_report: fairways.trim() || null,
      maintenance_notes: maintenance.trim() || null,
      other_conditions_notes: otherNotes.trim() || null,
    })

    setSubmitting(false)

    if (error) {
      console.error('Submit report error:', error)
      showToast('Could not submit report. Try again.')
      return
    }

    addRecentCourse({
      id: course.id,
      course_name: course.course_name,
      city: course.city,
      state: course.state,
    })
    setLastSubmitted(datePlayed)
    showToast('Report submitted — thank you!')
    resetForm()
    navigate(`/course/${course.id}`)
  }

  const inputClass =
    'min-h-11 w-full rounded-lg border border-green-pale bg-white px-4 py-3 text-base text-green-dark focus:border-green-mid focus:outline-none focus:ring-2 focus:ring-green-mid/30'

  return (
    <div>
      <h1 className="mb-4 font-display text-2xl font-bold text-green-dark">
        Submit a Report
      </h1>

      <RecentCourses variant="tiles" onSelect={(id) => void prefillFromRecent(id)} />

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
        <div
          className="absolute -left-[9999px] h-0 w-0 overflow-hidden"
          aria-hidden
        >
          <label htmlFor="website">Website</label>
          <input
            id="website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        <div className="grid grid-cols-[1fr_4rem] gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">First Name *</label>
            <input
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Last *</label>
            <input
              required
              maxLength={1}
              value={lastInitial}
              onChange={(e) => setLastInitial(e.target.value.slice(0, 1))}
              className={`${inputClass} text-center uppercase`}
            />
          </div>
        </div>

        {!addNewCourse ? (
          <>
            <CourseSearch
              value={selectedCourse}
              onSelect={setSelectedCourse}
              onClear={() => setSelectedCourse(null)}
            />
            <button
              type="button"
              onClick={() => setAddNewCourse(true)}
              className="min-h-11 text-sm font-semibold text-gold"
            >
              + Add a course not listed
            </button>
          </>
        ) : (
          <div className="space-y-3 rounded-lg border border-gold/30 bg-white p-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-green-dark">New Course</span>
              <button
                type="button"
                onClick={() => setAddNewCourse(false)}
                className="text-sm text-green-mid"
              >
                Cancel
              </button>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Course Name *</label>
              <input
                value={newCourseName}
                onChange={(e) => setNewCourseName(e.target.value)}
                className={inputClass}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">City *</label>
                <input
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">State *</label>
                <input
                  value={newState}
                  onChange={(e) => setNewState(e.target.value)}
                  maxLength={2}
                  className={inputClass}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Holes</label>
                <input
                  type="number"
                  min={1}
                  max={27}
                  value={newHoles}
                  onChange={(e) => setNewHoles(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Course Type</label>
                <select
                  value={newCourseType}
                  onChange={(e) => setNewCourseType(e.target.value as CourseType)}
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
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Date Played *</label>
            <input
              type="date"
              required
              value={datePlayed}
              onChange={(e) => setDatePlayed(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Time of Day *</label>
            <select
              required
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value as TimeOfDay)}
              className={inputClass}
            >
              <option value="morning">☀️ Morning</option>
              <option value="midday">🌤 Midday</option>
              <option value="afternoon">🌇 Afternoon</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="mb-1 block text-sm font-medium">Green Fee ($)</label>
            <input
              type="number"
              min={0}
              step="0.01"
              value={pricePaid}
              onChange={(e) => setPricePaid(e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Pace of Play</label>
            <div className="flex gap-2">
              <input
                type="number"
                min={0}
                max={8}
                placeholder="hr"
                value={paceHours}
                onChange={(e) => setPaceHours(e.target.value)}
                className={inputClass}
              />
              <input
                type="number"
                min={0}
                max={59}
                placeholder="min"
                value={paceMinutes}
                onChange={(e) => setPaceMinutes(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium">Walking or Cart</label>
            <TransportToggle
              value={transport}
              onChange={setTransport}
            />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium">Walkability Notes</label>
            <input
              value={walkability}
              onChange={(e) => setWalkability(e.target.value)}
              placeholder="Flat and easy / Very hilly…"
              className={inputClass}
            />
          </div>
        </div>

        <div className="border-t border-green-pale pt-4">
          <h2 className="mb-3 font-display text-lg font-bold text-green-dark">
            Course Conditions
          </h2>
          <div className="space-y-3">
            <div>
              <label className="mb-1 block text-sm font-medium">Greens</label>
              <textarea
                rows={2}
                value={greens}
                onChange={(e) => setGreens(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Fairways</label>
              <textarea
                rows={2}
                value={fairways}
                onChange={(e) => setFairways(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Maintenance Notes</label>
              <textarea
                rows={2}
                value={maintenance}
                onChange={(e) => setMaintenance(e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                Other Course Conditions &amp; Notes
              </label>
              <textarea
                rows={2}
                value={otherNotes}
                onChange={(e) => setOtherNotes(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="min-h-12 w-full rounded-lg bg-green-dark px-4 py-3 text-base font-bold text-sand disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit Report'}
        </button>
      </form>
    </div>
  )
}
