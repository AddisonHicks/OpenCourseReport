import { getCourseBySlug } from './courses'
import { parseReportSlugParam } from './reportSlug'
import { supabase } from './supabase'
import type { ReportWithCourse } from '../types'

const REPORT_SELECT = `
  *,
  courses (
    id,
    course_name,
    city,
    state,
    zipcode,
    slug,
    holes,
    course_type,
    is_user_submitted,
    is_approved,
    created_at
  )
`

export async function fetchReportsFeed(): Promise<ReportWithCourse[]> {
  const { data, error } = await supabase
    .from('reports')
    .select(REPORT_SELECT)
    .order('created_at', { ascending: false })
    .limit(300)

  if (error) {
    console.error('Fetch feed error:', error)
    return []
  }
  return (data ?? []) as ReportWithCourse[]
}

export async function fetchReportsForCourse(
  courseId: string,
): Promise<ReportWithCourse[]> {
  const { data, error } = await supabase
    .from('reports')
    .select(REPORT_SELECT)
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Fetch course reports error:', error)
    return []
  }
  return (data ?? []) as ReportWithCourse[]
}

export async function fetchLastReportDatesByCourseIds(
  courseIds: string[],
): Promise<Map<string, string>> {
  if (courseIds.length === 0) return new Map()

  const { data, error } = await supabase
    .from('reports')
    .select('course_id, date_played, created_at')
    .in('course_id', courseIds)
    .order('date_played', { ascending: false })
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Fetch last report dates error:', error)
    return new Map()
  }

  const map = new Map<string, string>()
  for (const row of data ?? []) {
    if (!map.has(row.course_id)) {
      map.set(row.course_id, row.date_played)
    }
  }
  return map
}

export async function fetchReportByCourseSlug(
  courseSlug: string,
  reportSlug: string,
): Promise<ReportWithCourse | null> {
  const course = await getCourseBySlug(courseSlug)
  if (!course) return null

  const { data, error } = await supabase
    .from('reports')
    .select(REPORT_SELECT)
    .eq('course_id', course.id)
    .eq('slug', reportSlug)
    .maybeSingle()

  if (error) {
    console.error('Fetch report by slug error:', error)
    return null
  }
  if (data) return data as ReportWithCourse

  const parsed = parseReportSlugParam(reportSlug)
  if (!parsed) return null

  const { data: rows, error: listError } = await supabase
    .from('reports')
    .select(REPORT_SELECT)
    .eq('course_id', course.id)
    .eq('date_played', parsed.datePlayed)
    .order('created_at', { ascending: true })

  if (listError || !rows?.length) return null
  return (rows as ReportWithCourse[])[parsed.index - 1] ?? null
}

export async function incrementHelpfulVote(reportId: string): Promise<number | null> {
  const { data: current, error: readError } = await supabase
    .from('reports')
    .select('helpful_votes')
    .eq('id', reportId)
    .single()

  if (readError || !current) return null

  const next = (current.helpful_votes ?? 0) + 1

  const { data, error } = await supabase
    .from('reports')
    .update({ helpful_votes: next })
    .eq('id', reportId)
    .select('helpful_votes')
    .single()

  if (error) {
    console.error('Vote error:', error)
    return null
  }

  await supabase.from('report_votes').insert({ report_id: reportId })

  return data.helpful_votes as number
}
