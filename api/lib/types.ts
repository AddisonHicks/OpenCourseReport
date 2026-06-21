export interface Course {
  id: string
  course_name: string
  city: string
  state: string
  zipcode: string | null
  slug: string | null
  holes: number | null
  course_type: string | null
  is_user_submitted: boolean
  is_approved: boolean
  created_at: string
}

export interface ReportWithCourse {
  id: string
  slug: string | null
  date_played: string
  courses: Course
}
