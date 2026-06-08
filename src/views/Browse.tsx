import { useCallback, useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BrowseCourseRow } from '../components/BrowseCourseRow'
import { HomeSearchPanel } from '../components/HomeSearchPanel'
import { UserAreaZip } from '../components/UserAreaZip'
import { getUserZipcode } from '../lib/localStorage'
import { buildDisplayFeed } from '../lib/reportQueries'
import { fetchReportsFeed } from '../lib/reports'
import { filterReportsWithinRadius } from '../lib/zipcode'
import type { ReportDisplay } from '../types'

function latestReportPerCourse(reports: ReportDisplay[]): ReportDisplay[] {
  const byCourse = new Map<string, ReportDisplay>()
  for (const r of reports) {
    const existing = byCourse.get(r.course_id)
    if (
      !existing ||
      new Date(r.created_at).getTime() > new Date(existing.created_at).getTime()
    ) {
      byCourse.set(r.course_id, r)
    }
  }
  return Array.from(byCourse.values()).sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
}

export function Browse() {
  const navigate = useNavigate()
  const [reports, setReports] = useState<ReportDisplay[]>([])
  const [nearbyReports, setNearbyReports] = useState<ReportDisplay[]>([])
  const [loading, setLoading] = useState(true)
  const [filtering, setFiltering] = useState(false)
  const [userZip, setUserZip] = useState<string | null>(() => getUserZipcode())

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
    if (!userZip) {
      setNearbyReports([])
      return
    }

    const latest = latestReportPerCourse(reports)
    setFiltering(true)
    void filterReportsWithinRadius(userZip, latest)
      .then((filtered) => setNearbyReports(filtered.slice(0, 12)))
      .finally(() => setFiltering(false))
  }, [reports, userZip])

  const showLoading = loading || filtering

  return (
    <div className="-mx-4">
      <div className="space-y-8 px-4 pt-6">
        <HomeSearchPanel />

        <section>
          <h2 className="font-display text-2xl font-bold text-green-dark">
            Recent Reports
          </h2>
          <p className="mb-1 font-display text-base text-green-dark">
            Based on Your Area (75 mile radius)
          </p>

          <UserAreaZip userZip={userZip} onZipChange={setUserZip} />

          {showLoading && (
            <p className="text-sm text-green-dark/60">Loading reports…</p>
          )}

          {!showLoading && !userZip && (
            <div className="rounded-2xl bg-white px-4 py-5 font-body text-sm text-green-dark/70 shadow-sm">
              Save your zip code above to see recent reports from courses near
              you.
            </div>
          )}

          {!showLoading && userZip && nearbyReports.length === 0 && (
            <div className="rounded-2xl bg-white px-4 py-5 font-body text-sm text-green-dark/70 shadow-sm">
              No reports within 75 miles of {userZip} yet.{' '}
              <button
                type="button"
                onClick={() => navigate('/submit')}
                className="font-semibold text-green-mid underline"
              >
                Submit one
              </button>
              .
            </div>
          )}

          {!showLoading && nearbyReports.length > 0 && (
            <div className="overflow-hidden rounded-2xl bg-white shadow-sm">
              <div className="flex items-center justify-between border-b border-green-dark/10 px-4 py-2 font-body text-xs text-green-dark/50">
                <span>Course Name, Location</span>
                <span>Last Report</span>
              </div>
              {nearbyReports.map((r) => (
                <BrowseCourseRow
                  key={r.course_id}
                  variant="list"
                  course={r.courses}
                  lastReportDate={r.date_played}
                  onSelect={() => navigate(`/course/${r.course_id}`)}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
