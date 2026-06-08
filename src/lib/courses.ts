import { supabase } from './supabase'
import { getStateName, US_STATES } from './usStates'
import type { Course } from '../types'

export interface CoursesByState {
  stateAbbr: string
  stateName: string
  courses: Course[]
}

export function formatCourseLocation(
  course: Pick<Course, 'city' | 'state'>,
): string {
  return `${course.city}, ${course.state}`
}

export async function searchCourses(query: string): Promise<Course[]> {
  const q = query.trim()
  if (q.length < 3) return []

  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .or(`course_name.ilike.%${q}%,city.ilike.%${q}%,zipcode.ilike.%${q}%`)
    .eq('is_approved', true)
    .order('course_name')
    .limit(8)

  if (error) {
    console.error('Course search error:', error)
    return []
  }
  return (data ?? []) as Course[]
}

export async function fetchAllApprovedCourses(): Promise<Course[]> {
  const pageSize = 1000
  const all: Course[] = []
  let from = 0

  while (true) {
    const { data, error } = await supabase
      .from('courses')
      .select('*')
      .eq('is_approved', true)
      .order('state')
      .order('course_name')
      .range(from, from + pageSize - 1)

    if (error) {
      console.error('Fetch all courses error:', error)
      break
    }
    if (!data?.length) break

    all.push(...(data as Course[]))
    if (data.length < pageSize) break
    from += pageSize
  }

  return all
}

export function groupCoursesByState(courses: Course[]): CoursesByState[] {
  const byState = new Map<string, Course[]>()

  for (const course of courses) {
    const abbr = course.state.trim().toUpperCase()
    const list = byState.get(abbr) ?? []
    list.push(course)
    byState.set(abbr, list)
  }

  const groups: CoursesByState[] = []

  for (const { abbr, name } of US_STATES) {
    const stateCourses = byState.get(abbr)
    if (!stateCourses?.length) continue
    groups.push({
      stateAbbr: abbr,
      stateName: name,
      courses: stateCourses.sort((a, b) =>
        a.course_name.localeCompare(b.course_name),
      ),
    })
  }

  for (const [abbr, stateCourses] of byState) {
    if (US_STATES.some((s) => s.abbr === abbr)) continue
    groups.push({
      stateAbbr: abbr,
      stateName: getStateName(abbr),
      courses: stateCourses.sort((a, b) =>
        a.course_name.localeCompare(b.course_name),
      ),
    })
  }

  return groups
}

export async function getCourseById(id: string): Promise<Course | null> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single()

  if (error) {
    console.error('Get course error:', error)
    return null
  }
  return data as Course
}

export interface AddCourseInput {
  course_name: string
  city: string
  state: string
  zipcode: string | null
  holes: number | null
  course_type: Course['course_type']
}

export async function addCourse(
  input: AddCourseInput,
): Promise<{ course: Course | null; error: string | null }> {
  const { data, error } = await supabase
    .from('courses')
    .insert({
      course_name: input.course_name.trim(),
      city: input.city.trim(),
      state: input.state.trim(),
      zipcode: input.zipcode?.trim() || null,
      holes: input.holes,
      course_type: input.course_type,
      is_user_submitted: false,
      is_approved: true,
    })
    .select()
    .single()

  if (error) {
    console.error('Add course error:', error)
    return { course: null, error: error.message }
  }
  return { course: data as Course, error: null }
}
