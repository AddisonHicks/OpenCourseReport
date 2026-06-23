import { useCallback, useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { ReportModal } from '../components/ReportModal'
import { UserAreaZip } from '../components/UserAreaZip'
import {
  buildNearbyCourseRows,
  defaultSortDirection,
  formatApproxDistanceMiles,
  sortNearbyCourseRows,
  type NearbyCourseRow,
  type NearbyCourseSortField,
  type SortDirection,
} from '../lib/courseListStats'
import { coursePath, fetchAllApprovedCourses } from '../lib/courses'
import { getUserZipcode } from '../lib/localStorage'
import { resetPageMeta } from '../lib/pageMeta'
import { formatDateNumeric, formatPrice } from '../lib/reportQueries'
import { fetchReportsForCourseIds } from '../lib/reports'
import { coursesWithinRadius } from '../lib/zipcode'
import type { ReportDisplay } from '../types'

function toReportDisplay(report: NonNullable<NearbyCourseRow['latestReport']>): ReportDisplay {
  return { ...report, isOlderReport: false }
}

function SortableHeader({
  label,
  field,
  sortField,
  sortDir,
  onSort,
  className,
  padX = 'px-2',
}: {
  label: string
  field: NearbyCourseSortField
  sortField: NearbyCourseSortField
  sortDir: SortDirection
  onSort: (field: NearbyCourseSortField) => void
  className?: string
  padX?: string
}) {
  const active = sortField === field
  return (
    <th className={`p-0 ${className ?? ''}`}>
      <button
        type="button"
        onClick={() => onSort(field)}
        className={`flex min-h-11 w-full items-center gap-0.5 text-left active:bg-green-dark/5 ${padX} ${
          active ? 'text-green-mid' : 'text-green-dark/50'
        }`}
      >
        <span className="font-semibold">{label}</span>
        {active && (
          <span aria-hidden="true" className="text-[10px] leading-none">
            {sortDir === 'asc' ? '▲' : '▼'}
          </span>
        )}
      </button>
    </th>
  )
}

export function NearbyCourseList() {
  const [userZip, setUserZip] = useState<string | null>(() => getUserZipcode())
  const [rows, setRows] = useState<NearbyCourseRow[]>([])
  const [sortField, setSortField] = useState<NearbyCourseSortField>('distance')
  const [sortDir, setSortDir] = useState<SortDirection>('asc')
  const [loading, setLoading] = useState(true)
  const [activeReport, setActiveReport] = useState<ReportDisplay | null>(null)

  const handleSort = useCallback((field: NearbyCourseSortField) => {
    if (field === sortField) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'))
    } else {
      setSortField(field)
      setSortDir(defaultSortDirection(field))
    }
  }, [sortField])

  const sortedRows = useMemo(
    () => sortNearbyCourseRows(rows, sortField, sortDir),
    [rows, sortField, sortDir],
  )

  const load = useCallback(async (zip: string) => {
    setLoading(true)
    const courses = await fetchAllApprovedCourses()
    const nearby = await coursesWithinRadius(courses, zip)
    const reports = await fetchReportsForCourseIds(nearby.map((n) => n.course.id))
    setRows(buildNearbyCourseRows(nearby, reports))
    setLoading(false)
  }, [])

  useEffect(() => {
    document.title = 'Courses Near You | OpenCourseReport'
    return () => {
      resetPageMeta()
    }
  }, [])

  useEffect(() => {
    if (!userZip) {
      setRows([])
      setLoading(false)
      return
    }
    void load(userZip)
  }, [userZip, load])

  return (
    <div className="-mx-4 px-4">
      <header className="mb-4">
        <h1 className="font-display text-xl font-bold text-green-dark">
          Courses Near You
        </h1>
        <p className="mt-1 font-display text-sm text-green-dark/70">
          Within 75 miles of your zip code
        </p>
      </header>

      <div className="text-xs [&_input]:text-sm [&_button]:text-xs">
        <UserAreaZip userZip={userZip} onZipChange={setUserZip} />
      </div>

      {loading && userZip && (
        <p className="mt-4 text-xs text-green-dark/60">Loading courses…</p>
      )}

      {!loading && !userZip && (
        <div className="mt-4 rounded-2xl bg-white px-4 py-4 font-body text-xs text-green-dark/70 shadow-sm">
          Save your zip code above to see courses near you.
        </div>
      )}

      {!loading && userZip && rows.length === 0 && (
        <div className="mt-4 rounded-2xl bg-white px-4 py-4 font-body text-xs text-green-dark/70 shadow-sm">
          No courses within 75 miles of {userZip}.
        </div>
      )}

      {!loading && rows.length > 0 && (
        <div className="modal-scroll mt-4 overflow-x-auto rounded-2xl bg-white shadow-sm">
          <table className="w-full min-w-[700px] border-collapse font-body text-xs text-green-dark">
            <thead>
              <tr className="border-b border-green-dark/10 text-left text-[11px]">
                <SortableHeader
                  label="Course"
                  field="course_name"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                  className="max-w-44"
                  padX="px-3"
                />
                <SortableHeader
                  label="Distance"
                  field="distance"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                  padX="px-2"
                />
                <SortableHeader
                  label="City"
                  field="city"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="State"
                  field="state"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Last Report"
                  field="last_report"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Avg 9-hole"
                  field="avg9"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <SortableHeader
                  label="Avg 18-hole"
                  field="avg18"
                  sortField={sortField}
                  sortDir={sortDir}
                  onSort={handleSort}
                />
                <th className="p-0 font-semibold text-green-dark/50">
                  <div className="flex min-h-11 items-center px-3">Report</div>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedRows.map((row) => (
                <tr
                  key={row.course.id}
                  className="border-b border-green-dark/10 last:border-0"
                >
                  <td className="max-w-44 min-w-0 px-3 py-2">
                    {row.latestReport ? (
                      <button
                        type="button"
                        title={row.course.course_name}
                        onClick={() =>
                          setActiveReport(toReportDisplay(row.latestReport!))
                        }
                        className="block max-w-full truncate text-left font-display text-xs font-semibold text-green-mid underline decoration-2 underline-offset-2"
                      >
                        {row.course.course_name}
                      </button>
                    ) : (
                      <Link
                        to={coursePath(row.course)}
                        title={row.course.course_name}
                        className="block max-w-full truncate font-display text-xs font-semibold text-green-mid underline decoration-2 underline-offset-2"
                      >
                        {row.course.course_name}
                      </Link>
                    )}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2">
                    {formatApproxDistanceMiles(row.distanceMiles)}
                  </td>
                  <td className="px-2 py-2">{row.course.city}</td>
                  <td className="px-2 py-2">{row.course.state}</td>
                  <td className="whitespace-nowrap px-2 py-2">
                    {row.lastReportDate
                      ? formatDateNumeric(row.lastReportDate)
                      : '—'}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2">
                    {row.avgGreenFee9 != null
                      ? formatPrice(row.avgGreenFee9)
                      : '—'}
                  </td>
                  <td className="whitespace-nowrap px-2 py-2">
                    {row.avgGreenFee18 != null
                      ? formatPrice(row.avgGreenFee18)
                      : '—'}
                  </td>
                  <td className="px-3 py-2">
                    {row.latestReport ? (
                      <button
                        type="button"
                        onClick={() =>
                          setActiveReport(toReportDisplay(row.latestReport!))
                        }
                        className="text-link text-xs whitespace-nowrap"
                      >
                        View report
                      </button>
                    ) : (
                      '—'
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeReport && (
        <ReportModal
          report={activeReport}
          onClose={() => setActiveReport(null)}
        />
      )}
    </div>
  )
}
