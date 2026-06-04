import type { RecentCourse } from '../types'

const RECENT_KEY = 'fr_recent_courses'
const LAST_SUBMITTED_KEY = 'fr_last_submitted'
const VOTE_PREFIX = 'fr_voted_'

export function getRecentCourses(): RecentCourse[] {
  try {
    const raw = localStorage.getItem(RECENT_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw) as RecentCourse[]
    return Array.isArray(parsed) ? parsed.slice(0, 3) : []
  } catch {
    return []
  }
}

export function addRecentCourse(course: RecentCourse): void {
  const recent = getRecentCourses()
  const filtered = recent.filter((c) => c.id !== course.id)
  const updated = [course, ...filtered].slice(0, 3)
  localStorage.setItem(RECENT_KEY, JSON.stringify(updated))
}

export function setLastSubmitted(date: string): void {
  localStorage.setItem(LAST_SUBMITTED_KEY, date)
}

export function getLastSubmitted(): string | null {
  return localStorage.getItem(LAST_SUBMITTED_KEY)
}

export function hasVoted(reportId: string): boolean {
  return localStorage.getItem(`${VOTE_PREFIX}${reportId}`) === 'true'
}

export function markVoted(reportId: string): void {
  localStorage.setItem(`${VOTE_PREFIX}${reportId}`, 'true')
}
