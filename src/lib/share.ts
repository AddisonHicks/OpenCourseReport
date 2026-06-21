import type { Course, Report } from '../types'
import { coursePath } from './courseSlug'
import { reportPath } from './reportSlug'

export function courseShareUrl(
  course: Pick<Course, 'slug' | 'course_name' | 'zipcode' | 'city' | 'state'>,
): string {
  return `${window.location.origin}${coursePath(course)}`
}

export function reportShareUrl(
  report: Pick<Report, 'slug' | 'date_played'> & {
    courses: Pick<Course, 'slug' | 'course_name' | 'zipcode' | 'city' | 'state'>
  },
): string {
  return `${window.location.origin}${reportPath(report.courses, report)}`
}

export type ShareResult = 'shared' | 'copied' | 'failed' | 'cancelled'

export async function shareLink(options: {
  url: string
  title?: string
  text?: string
}): Promise<ShareResult> {
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({
        url: options.url,
        title: options.title,
        text: options.text,
      })
      return 'shared'
    } catch (err) {
      if ((err as Error).name === 'AbortError') return 'cancelled'
    }
  }

  try {
    await navigator.clipboard.writeText(options.url)
    return 'copied'
  } catch {
    return 'failed'
  }
}

export function shareResultMessage(result: ShareResult): string | null {
  switch (result) {
    case 'copied':
      return 'Link copied!'
    case 'shared':
      return 'Link shared!'
    case 'failed':
      return 'Could not share link'
    default:
      return null
  }
}
