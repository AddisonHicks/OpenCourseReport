export type TimeOfDay = 'morning' | 'midday' | 'afternoon'
export type TransportMode = 'walking' | 'cart'
export type HolesPlayed = 9 | 18
export type CourseType = 'Public' | 'Semi-Private' | 'Private'

export interface Course {
  id: string
  course_name: string
  city: string
  state: string
  zipcode: string | null
  holes: number | null
  course_type: CourseType | null
  is_user_submitted: boolean
  is_approved: boolean
  created_at: string
}

export interface Report {
  id: string
  first_name: string
  last_initial: string
  course_id: string
  date_played: string
  time_of_day: TimeOfDay
  transport_mode: TransportMode | null
  walkability_notes: string | null
  price_paid: number | null
  holes_played: HolesPlayed | null
  pace_of_play: number | null
  greens_report: string | null
  fairways_report: string | null
  maintenance_notes: string | null
  other_conditions_notes: string | null
  helpful_votes: number
  created_at: string
}

export interface ReportWithCourse extends Report {
  courses: Course
}

export interface RecentCourse {
  id: string
  course_name: string
  city: string
  state: string
}

export interface ReportDisplay extends ReportWithCourse {
  isOlderReport: boolean
}
