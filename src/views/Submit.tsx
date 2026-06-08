import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { CourseSearch } from '../components/CourseSearch'
import { FieldLabel } from '../components/FieldLabel'
import { HolesPlayedToggle } from '../components/HolesPlayedToggle'
import { TransportToggle } from '../components/TransportToggle'
import { SubmitConfirmation } from '../components/SubmitConfirmation'
import { useToast } from '../context/ToastContext'
import { getCourseById, formatCourseLocation } from '../lib/courses'
import { addRecentCourse, setLastSubmitted, setUserZipcode } from '../lib/localStorage'
import { todayLocalDateString } from '../lib/reportQueries'
import { supabase } from '../lib/supabase'
import type { Course, HolesPlayed, TimeOfDay, TransportMode } from '../types'

interface SubmitLocationState {
  courseId?: string
  course?: Course
}

export function Submit() {
  const navigate = useNavigate()
  const location = useLocation()
  const [searchParams] = useSearchParams()
  const { showToast } = useToast()
  const state = location.state as SubmitLocationState | null
  const courseIdParam = searchParams.get('course')

  const [firstName, setFirstName] = useState('')
  const [lastInitial, setLastInitial] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
  const [datePlayed, setDatePlayed] = useState(todayLocalDateString)
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('morning')
  const [pricePaid, setPricePaid] = useState('')
  const [holesPlayed, setHolesPlayed] = useState<HolesPlayed>(18)
  const [paceHours, setPaceHours] = useState('')
  const [paceMinutes, setPaceMinutes] = useState('')
  const [transport, setTransport] = useState<TransportMode | null>(null)
  const [greens, setGreens] = useState('')
  const [fairwaysTees, setFairwaysTees] = useState('')
  const [maintenance, setMaintenance] = useState('')
  const [otherNotes, setOtherNotes] = useState('')
  const [honeypot, setHoneypot] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [confirmedCourse, setConfirmedCourse] = useState<Course | null>(null)

  useEffect(() => {
    if (state?.course) {
      setSelectedCourse(state.course)
      return
    }

    const id = courseIdParam ?? state?.courseId
    if (!id) {
      setSelectedCourse(null)
      return
    }

    void getCourseById(id).then((c) => {
      if (c) setSelectedCourse(c)
    })
  }, [courseIdParam, state?.course, state?.courseId])

  const resetForm = () => {
    setFirstName('')
    setLastInitial('')
    setDatePlayed(todayLocalDateString())
    setTimeOfDay('morning')
    setPricePaid('')
    setHolesPlayed(18)
    setPaceHours('')
    setPaceMinutes('')
    setTransport(null)
    setGreens('')
    setFairwaysTees('')
    setMaintenance('')
    setOtherNotes('')
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
    if (!selectedCourse) {
      showToast('Select a course.')
      return
    }

    setSubmitting(true)

    const h = parseInt(paceHours, 10) || 0
    const m = parseInt(paceMinutes, 10) || 0
    const paceTotal = h > 0 || m > 0 ? h * 60 + m : null

    const { error } = await supabase.from('reports').insert({
      first_name: firstName.trim(),
      last_initial: lastInitial.trim().charAt(0).toUpperCase(),
      course_id: selectedCourse.id,
      date_played: datePlayed,
      time_of_day: timeOfDay,
      transport_mode: transport,
      walkability_notes: null,
      price_paid: pricePaid ? parseFloat(pricePaid) : null,
      holes_played: holesPlayed,
      pace_of_play: paceTotal,
      greens_report: greens.trim() || null,
      fairways_tees_report: fairwaysTees.trim() || null,
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
      id: selectedCourse.id,
      course_name: selectedCourse.course_name,
      city: selectedCourse.city,
      state: selectedCourse.state,
    })
    setLastSubmitted(datePlayed)
    if (selectedCourse.zipcode) {
      setUserZipcode(selectedCourse.zipcode)
    }
    setConfirmedCourse(selectedCourse)
    resetForm()
    setSelectedCourse(null)
    navigate('/submit', { replace: true })
  }

  const inputClass =
    'min-h-11 w-full min-w-0 max-w-full rounded-lg border-0 bg-white px-3 py-3 text-base text-green-dark shadow-sm focus:outline-none focus:ring-2 focus:ring-green-mid/40'
  const compactInputClass =
    'min-h-11 w-full min-w-0 max-w-full rounded-lg border-0 bg-white px-2 py-3 text-base text-green-dark shadow-sm focus:outline-none focus:ring-2 focus:ring-green-mid/40 sm:px-3'
  const textareaClass =
    'min-h-24 w-full rounded-lg border-0 bg-white px-3 py-3 text-base text-green-dark shadow-sm focus:outline-none focus:ring-2 focus:ring-green-mid/40'
  const pairedRowClass = 'grid min-w-0 grid-cols-2 gap-2 sm:gap-3'
  const pairedCellClass = 'min-w-0 overflow-hidden'

  if (confirmedCourse) {
    return (
      <SubmitConfirmation
        course={confirmedCourse}
        onHome={() => navigate('/')}
        onCoursePage={() => navigate(`/course/${confirmedCourse.id}`)}
      />
    )
  }

  return (
    <div className="-mx-4 px-4">
      {selectedCourse ? (
        <header className="mb-6">
          <h1 className="font-display text-2xl font-bold leading-tight text-green-dark">
            {selectedCourse.course_name}
          </h1>
          <p className="font-display text-base text-green-dark/70">
            {formatCourseLocation(selectedCourse)}
          </p>
        </header>
      ) : (
        <div className="mb-6">
          <CourseSearch
            value={selectedCourse}
            onSelect={setSelectedCourse}
            onClear={() => setSelectedCourse(null)}
            label="Course:"
            placeholder="Search for a course"
            required
          />
        </div>
      )}

      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3">
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

        <div className="grid grid-cols-[minmax(0,9.5rem)_auto] gap-2 sm:grid-cols-[minmax(0,11rem)_auto] sm:gap-3">
          <div className="min-w-0">
            <FieldLabel required>First Name:</FieldLabel>
            <input
              required
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
            />
          </div>
          <div className="shrink-0">
            <FieldLabel required>Last Int:</FieldLabel>
            <input
              required
              maxLength={1}
              value={lastInitial}
              onChange={(e) => setLastInitial(e.target.value.slice(0, 1))}
              className={`${inputClass} w-[4.5rem] text-center uppercase`}
            />
          </div>
        </div>

        <div className={pairedRowClass}>
          <div className={pairedCellClass}>
            <FieldLabel required>Date Played:</FieldLabel>
            <input
              type="date"
              required
              value={datePlayed}
              max={todayLocalDateString()}
              onChange={(e) => setDatePlayed(e.target.value)}
              className={compactInputClass}
            />
          </div>
          <div className={pairedCellClass}>
            <FieldLabel required>Time of Day:</FieldLabel>
            <select
              required
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value as TimeOfDay)}
              className={compactInputClass}
            >
              <option value="morning">AM</option>
              <option value="midday">Mid-Day</option>
              <option value="afternoon">PM</option>
            </select>
          </div>
        </div>

        <div className={pairedRowClass}>
          <div className={pairedCellClass}>
            <FieldLabel>Green Fee:</FieldLabel>
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="0.01"
              value={pricePaid}
              onChange={(e) => setPricePaid(e.target.value)}
              className={compactInputClass}
            />
          </div>
          <div className={pairedCellClass}>
            <FieldLabel>Holes Played:</FieldLabel>
            <HolesPlayedToggle value={holesPlayed} onChange={setHolesPlayed} />
          </div>
        </div>

        <div className={pairedRowClass}>
          <div className={pairedCellClass}>
            <FieldLabel>Walk/Ride:</FieldLabel>
            <TransportToggle value={transport} onChange={setTransport} />
          </div>
          <div className={pairedCellClass}>
            <FieldLabel>Pace of Play:</FieldLabel>
            <div className="flex min-w-0 gap-1">
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min={0}
                max={8}
                placeholder="hr"
                value={paceHours}
                onChange={(e) => setPaceHours(e.target.value)}
                className={`${compactInputClass} min-w-0 flex-1`}
              />
              <input
                type="number"
                inputMode="numeric"
                pattern="[0-9]*"
                min={0}
                max={59}
                placeholder="min"
                value={paceMinutes}
                onChange={(e) => setPaceMinutes(e.target.value)}
                className={`${compactInputClass} min-w-0 flex-1`}
              />
            </div>
          </div>
        </div>

        <div className="border-t border-green-dark/25 pt-4">
          <h2 className="mb-3 font-display text-xl text-green-dark">
            Course Conditions:
          </h2>
          <div className="space-y-3">
            <div>
              <FieldLabel>Greens:</FieldLabel>
              <textarea
                rows={3}
                value={greens}
                onChange={(e) => setGreens(e.target.value)}
                className={textareaClass}
              />
            </div>
            <div>
              <FieldLabel>Fairways & Tees:</FieldLabel>
              <textarea
                rows={3}
                value={fairwaysTees}
                onChange={(e) => setFairwaysTees(e.target.value)}
                className={textareaClass}
              />
            </div>
            <div>
              <FieldLabel>Maintenance Notes:</FieldLabel>
              <textarea
                rows={3}
                value={maintenance}
                onChange={(e) => setMaintenance(e.target.value)}
                className={textareaClass}
              />
            </div>
            <div>
              <FieldLabel>Other Course Notes:</FieldLabel>
              <textarea
                rows={3}
                value={otherNotes}
                onChange={(e) => setOtherNotes(e.target.value)}
                className={textareaClass}
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="min-h-12 w-full rounded-xl bg-green-dark px-4 py-3 font-display text-lg font-bold text-sand disabled:opacity-60"
        >
          {submitting ? 'Submitting…' : 'Submit Report'}
        </button>
      </form>
    </div>
  )
}
