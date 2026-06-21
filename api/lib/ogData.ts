import { createClient } from '@supabase/supabase-js'
import { isUuid, resolveCourseSlug } from '../../src/lib/courseSlug'
import type { Course, ReportWithCourse } from '../../src/types'

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

function getSupabase() {
  const url =
    process.env.SUPABASE_URL ??
    process.env.VITE_SUPABASE_URL ??
    ''
  const key =
    process.env.SUPABASE_ANON_KEY ??
    process.env.VITE_SUPABASE_ANON_KEY ??
    ''

  if (!url || !key) {
    throw new Error('Missing Supabase credentials for OG handler')
  }

  return createClient(url, key)
}

async function getCourseById(id: string): Promise<Course | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single()

  if (error) return null
  return data as Course
}

async function findCourseByComputedSlug(slug: string): Promise<Course | null> {
  const zipMatch = slug.match(/-(\d{5})$/)
  if (!zipMatch) return null

  const zip = zipMatch[1]
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('zipcode', zip)
    .eq('is_approved', true)

  if (error || !data?.length) return null

  return (
    (data as Course[]).find((course) => resolveCourseSlug(course) === slug) ??
    null
  )
}

export async function getCourseBySlug(slugOrId: string): Promise<Course | null> {
  if (isUuid(slugOrId)) {
    return getCourseById(slugOrId)
  }

  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('slug', slugOrId)
    .maybeSingle()

  if (error) return null
  if (data) return data as Course

  return findCourseByComputedSlug(slugOrId)
}

export async function fetchReportById(
  id: string,
): Promise<ReportWithCourse | null> {
  const supabase = getSupabase()
  const { data, error } = await supabase
    .from('reports')
    .select(REPORT_SELECT)
    .eq('id', id)
    .single()

  if (error) return null
  return data as ReportWithCourse
}
