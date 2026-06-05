import { useEffect, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { CourseSearch } from '../components/CourseSearch'
import { RecentCourses } from '../components/RecentCourses'
import { TransportToggle } from '../components/TransportToggle'
import { useToast } from '../context/ToastContext'
import { getCourseById } from '../lib/courses'
import { addRecentCourse, setLastSubmitted } from '../lib/localStorage'
import { supabase } from '../lib/supabase'
import type { Course, TimeOfDay, TransportMode } from '../types'

interface SubmitLocationState {
  courseId?: string
}

export function Submit() {
  const navigate = useNavigate()
  const location = useLocation()
  const { showToast } = useToast()
  const state = location.state as SubmitLocationState | null

  const [firstName, setFirstName] = useState('')
  const [lastInitial, setLastInitial] = useState('')
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null)
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
    if (c) setSelectedCourse(c)
  }

  const resetForm = () => {
    setFirstName('')
    setLastInitial('')
    setSelectedCourse(null)
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
      id: selectedCourse.id,
      course_name: selectedCourse.course_name,
      city: selectedCourse.city,
      state: selectedCourse.state,
    })
    setLastSubmitted(datePlayed)
    showToast('Report submitted — thank you!')
    resetForm()
    navigate(`/course/${selectedCourse.id}`)
  }

  const inputClass =
    'min-h-11 w-full min-w-0 max-w-full rounded-lg border border-green-pale bg-white px-4 py-3 text-base text-green-dark focus:border-green-mid focus:outline-none focus:ring-2 focus:ring-green-mid/30'
  const compactInputClass =
    'min-h-11 w-full min-w-0 max-w-full rounded-lg border border-green-pale bg-white px-2 py-3 text-base text-green-dark focus:border-green-mid focus:outline-none focus:ring-2 focus:ring-green-mid/30 sm:px-3'
  const pairedRowClass =
    'grid min-w-0 grid-cols-2 gap-2 sm:gap-3'
  const pairedCellClass = 'min-w-0 overflow-hidden'
  const pairedLabelClass = 'mb-1 block text-xs font-medium sm:text-sm'
  return (
    <div>
      <h1 className="mb-4 font-display text-2xl font-bold text-green-dark">
        Submit a Report
      </h1>

      <RecentCourses variant="tiles" onSelect={(id) => void prefillFromRecent(id)} />

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

        <CourseSearch
          value={selectedCourse}
          onSelect={setSelectedCourse}
          onClear={() => setSelectedCourse(null)}
        />

        <div className={pairedRowClass}>
          <div className={pairedCellClass}>
            <label className={pairedLabelClass}>Date Played *</label>
            <input
              type="date"
              required
              value={datePlayed}
              onChange={(e) => setDatePlayed(e.target.value)}
              className={compactInputClass}
            />
          </div>
          <div className={pairedCellClass}>
            <label className={pairedLabelClass}>Time of Day *</label>
            <select
              required
              value={timeOfDay}
              onChange={(e) => setTimeOfDay(e.target.value as TimeOfDay)}
              className={compactInputClass}
            >
              <option value="morning">☀️ AM</option>
              <option value="midday">🌤 Mid</option>
              <option value="afternoon">🌇 PM</option>
            </select>
          </div>
        </div>

        <div className={pairedRowClass}>
          <div className={pairedCellClass}>
            <label className={pairedLabelClass}>Green Fee ($)</label>
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
            <label className={pairedLabelClass}>Pace of Play</label>
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

        <div className={pairedRowClass}>
          <div className={pairedCellClass}>
            <label className={pairedLabelClass}>Walking or Cart</label>
            <TransportToggle
              value={transport}
              onChange={setTransport}
            />
          </div>
          <div className={pairedCellClass}>
            <label className={pairedLabelClass}>Walkability Notes</label>
            <input
              value={walkability}
              onChange={(e) => setWalkability(e.target.value)}
              placeholder="Flat and easy / Very hilly…"
              className={compactInputClass}
            />
          </div>
        </div>

        <div className="border-t border-green-pale pt-3">
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
