import type { ReportWithCourse, ReportDisplay } from '../types'

const NINETY_DAYS_MS = 90 * 24 * 60 * 60 * 1000

/** Today's date in the user's local timezone (`YYYY-MM-DD`). */
export function todayLocalDateString(): string {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function getNinetyDaysAgo(): string {
  const d = new Date()
  d.setDate(d.getDate() - 90)
  return d.toISOString().split('T')[0]
}

export function isWithin90Days(datePlayed: string): boolean {
  const played = new Date(datePlayed + 'T12:00:00')
  const cutoff = new Date()
  cutoff.setTime(cutoff.getTime() - NINETY_DAYS_MS)
  return played >= cutoff
}

export function compareByDatePlayedDesc(
  a: Pick<ReportWithCourse, 'date_played' | 'created_at'>,
  b: Pick<ReportWithCourse, 'date_played' | 'created_at'>,
): number {
  const playedDiff =
    new Date(b.date_played + 'T12:00:00').getTime() -
    new Date(a.date_played + 'T12:00:00').getTime()
  if (playedDiff !== 0) return playedDiff
  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
}

export function sortReportsByDatePlayed<T extends ReportWithCourse>(
  reports: T[],
): T[] {
  return [...reports].sort(compareByDatePlayedDesc)
}

/**
 * Apply 90-day expiration: keep reports within 90 days.
 * If none qualify, keep only the single most recent report (any age).
 */
export function apply90DayFilter(
  reports: ReportWithCourse[],
): ReportDisplay[] {
  if (reports.length === 0) return []

  const sorted = [...reports].sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )

  const recent = sorted.filter((r) => isWithin90Days(r.date_played))

  if (recent.length > 0) {
    return recent.map((r) => ({ ...r, isOlderReport: false }))
  }

  const newest = sorted[0]
  return [{ ...newest, isOlderReport: true }]
}

/** Flatten per-course 90-day rules into a single feed sorted by created_at. */
export function buildDisplayFeed(
  reports: ReportWithCourse[],
): ReportDisplay[] {
  const byCourse = new Map<string, ReportWithCourse[]>()
  for (const r of reports) {
    const list = byCourse.get(r.course_id) ?? []
    list.push(r)
    byCourse.set(r.course_id, list)
  }
  const display: ReportDisplay[] = []
  for (const list of byCourse.values()) {
    display.push(...apply90DayFilter(list))
  }
  return display.sort(
    (a, b) =>
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
  )
}

export function formatPace(minutes: number | null): string {
  if (minutes == null || minutes <= 0) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

export function average(nums: (number | null)[]): number | null {
  const valid = nums.filter((n): n is number => n != null && !Number.isNaN(n))
  if (valid.length === 0) return null
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

export function timeOfDayEmoji(tod: string): string {
  switch (tod) {
    case 'morning':
      return '☀️'
    case 'midday':
      return '🌤'
    case 'afternoon':
      return '🌇'
    default:
      return ''
  }
}

export function timeOfDayLabel(tod: string): string {
  switch (tod) {
    case 'morning':
      return 'AM'
    case 'midday':
      return 'Mid-Day'
    case 'afternoon':
      return 'PM'
    default:
      return tod
  }
}

export function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function formatDateNumeric(dateStr: string): string {
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00')
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${mm}/${dd}/${yyyy}`
}

/** e.g. 06/08/2026 (Mon) */
export function formatDateWithWeekday(dateStr: string): string {
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T12:00:00')
  const weekday = d.toLocaleDateString('en-US', { weekday: 'short' })
  return `${formatDateNumeric(dateStr)} (${weekday})`
}

export function formatPrice(price: number | null): string {
  if (price == null) return '—'
  return `$${Math.round(price)}`
}

export function formatHolesPlayed(holes: number | null): string {
  if (holes === 9 || holes === 18) return String(holes)
  return '—'
}

export function formatHolesPlayedLabel(holes: number | null): string | null {
  if (holes === 9 || holes === 18) return `${holes} holes`
  return null
}

export function formatGreenFee(
  price: number | null,
  holesPlayed: number | null,
): string {
  if (price == null) return '—'
  if (holesPlayed === 9 || holesPlayed === 18) {
    return `${formatPrice(price)} (${holesPlayed} holes)`
  }
  return formatPrice(price)
}

export function submitterName(first: string, lastInitial: string): string {
  return `${first} ${lastInitial.toUpperCase()}.`
}
