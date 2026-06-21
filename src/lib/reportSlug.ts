import { coursePath } from './courseSlug'
import { supabase } from './supabase'
import type { Course, Report } from '../types'

export function buildReportDateSlug(datePlayed: string): string {
  if (/^\d{4}-\d{2}-\d{2}$/.test(datePlayed)) return datePlayed
  const d = new Date(
    datePlayed.includes('T') ? datePlayed : `${datePlayed}T12:00:00`,
  )
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

export function resolveReportSlug(
  report: Pick<Report, 'slug' | 'date_played'>,
): string {
  return report.slug ?? buildReportDateSlug(report.date_played)
}

export function reportPath(
  course: Pick<Course, 'slug' | 'course_name' | 'zipcode' | 'city' | 'state'>,
  report: Pick<Report, 'slug' | 'date_played'>,
): string {
  return `${coursePath(course)}/${resolveReportSlug(report)}`
}

export function parseReportSlugParam(
  reportSlug: string,
): { datePlayed: string; index: number } | null {
  const match = reportSlug.match(/^(\d{4}-\d{2}-\d{2})(?:-(\d+))?$/)
  if (!match) return null
  const datePlayed = match[1]
  const index = match[2] ? parseInt(match[2], 10) : 1
  if (!Number.isFinite(index) || index < 1) return null
  return { datePlayed, index }
}

export async function ensureUniqueReportSlug(
  courseId: string,
  datePlayed: string,
): Promise<string> {
  const base = buildReportDateSlug(datePlayed)
  let candidate = base
  let suffix = 2

  while (true) {
    const { data, error } = await supabase
      .from('reports')
      .select('id')
      .eq('course_id', courseId)
      .eq('slug', candidate)
      .maybeSingle()

    if (error) {
      console.error('Report slug lookup error:', error)
      return candidate
    }
    if (!data) return candidate

    candidate = `${base}-${suffix}`
    suffix += 1
  }
}
