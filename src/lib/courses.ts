import { supabase } from './supabase'
import type { Course } from '../types'

export async function searchCourses(query: string): Promise<Course[]> {
  const q = query.trim()
  if (q.length < 3) return []

  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .or(`course_name.ilike.%${q}%,city.ilike.%${q}%`)
    .eq('is_approved', true)
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
