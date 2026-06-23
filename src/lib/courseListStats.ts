import { average } from './reportQueries'
import type { Course, ReportWithCourse } from '../types'
import type { CourseWithDistance } from './zipcode'

export interface NearbyCourseRow {
  course: Course
  distanceMiles: number
  lastReportDate: string | null
  avgGreenFee9: number | null
  avgGreenFee18: number | null
  latestReport: ReportWithCourse | null
}

export function formatApproxDistanceMiles(miles: number): string {
  return `~${Math.round(miles)} mi`
}

export type NearbyCourseSortField =
  | 'distance'
  | 'course_name'
  | 'city'
  | 'state'
  | 'last_report'
  | 'avg9'
  | 'avg18'

export type SortDirection = 'asc' | 'desc'

function compareNullable<T>(
  a: T | null,
  b: T | null,
  cmp: (x: T, y: T) => number,
): number {
  if (a == null && b == null) return 0
  if (a == null) return 1
  if (b == null) return -1
  return cmp(a, b)
}

function applyDirection(result: number, direction: SortDirection): number {
  return direction === 'asc' ? result : -result
}

export function defaultSortDirection(
  field: NearbyCourseSortField,
): SortDirection {
  switch (field) {
    case 'last_report':
      return 'desc'
    default:
      return 'asc'
  }
}

export function sortNearbyCourseRows(
  rows: NearbyCourseRow[],
  field: NearbyCourseSortField,
  direction: SortDirection,
): NearbyCourseRow[] {
  const sorted = [...rows]
  switch (field) {
    case 'distance':
      return sorted.sort((a, b) =>
        applyDirection(a.distanceMiles - b.distanceMiles, direction),
      )
    case 'course_name':
      return sorted.sort((a, b) =>
        applyDirection(
          a.course.course_name.localeCompare(b.course.course_name),
          direction,
        ),
      )
    case 'city':
      return sorted.sort((a, b) =>
        applyDirection(a.course.city.localeCompare(b.course.city), direction),
      )
    case 'state':
      return sorted.sort((a, b) =>
        applyDirection(a.course.state.localeCompare(b.course.state), direction),
      )
    case 'last_report':
      return sorted.sort((a, b) =>
        applyDirection(
          compareNullable(a.lastReportDate, b.lastReportDate, (x, y) =>
            x.localeCompare(y),
          ),
          direction,
        ),
      )
    case 'avg9':
      return sorted.sort((a, b) =>
        applyDirection(
          compareNullable(a.avgGreenFee9, b.avgGreenFee9, (x, y) => x - y),
          direction,
        ),
      )
    case 'avg18':
      return sorted.sort((a, b) =>
        applyDirection(
          compareNullable(a.avgGreenFee18, b.avgGreenFee18, (x, y) => x - y),
          direction,
        ),
      )
    default:
      return sorted
  }
}

function compareReportsDesc(a: ReportWithCourse, b: ReportWithCourse): number {
  const dateCmp = b.date_played.localeCompare(a.date_played)
  if (dateCmp !== 0) return dateCmp
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
}

export function buildNearbyCourseRows(
  coursesWithDistance: CourseWithDistance[],
  reports: ReportWithCourse[],
): NearbyCourseRow[] {
  const byCourse = new Map<string, ReportWithCourse[]>()
  for (const report of reports) {
    const list = byCourse.get(report.course_id) ?? []
    list.push(report)
    byCourse.set(report.course_id, list)
  }

  return coursesWithDistance.map(({ course, distanceMiles }) => {
    const courseReports = byCourse.get(course.id) ?? []
    const sorted = [...courseReports].sort(compareReportsDesc)

    const lastReportDate =
      sorted.length > 0
        ? sorted.reduce(
            (max, r) => (r.date_played > max ? r.date_played : max),
            sorted[0].date_played,
          )
        : null

    const fees9 = courseReports
      .filter((r) => r.holes_played === 9 && r.price_paid != null)
      .map((r) => r.price_paid)
    const fees18 = courseReports
      .filter((r) => r.holes_played === 18 && r.price_paid != null)
      .map((r) => r.price_paid)

    return {
      course,
      distanceMiles,
      lastReportDate,
      avgGreenFee9: average(fees9),
      avgGreenFee18: average(fees18),
      latestReport: sorted[0] ?? null,
    }
  })
}
