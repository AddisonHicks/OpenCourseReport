import { supabase } from './supabase'
import type { Course } from '../types'

export function formatCourseLocation(
  course: Pick<Course, 'city' | 'state' | 'zipcode'>,
): string {
  const base = `${course.city}, ${course.state}`
  return course.zipcode?.trim() ? `${base} ${course.zipcode.trim()}` : base
}

export async function searchCourses(query: string): Promise<Course[]> {
  const q = query.trim()
  if (q.length < 3) return []

  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .or(`course_name.ilike.%${q}%,city.ilike.%${q}%,zipcode.ilike.%${q}%`)    .eq('is_approved', true)
    .order('course_name')
    .limit(8)

  if (error) {
    console.error('Course search error:', error)
    return []
  }
  return (data ?? []) as Course[]
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
