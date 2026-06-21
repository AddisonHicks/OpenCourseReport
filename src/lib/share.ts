import type { Course } from '../types'
import { coursePath } from './courseSlug'

export function courseShareUrl(
  course: Pick<Course, 'slug' | 'course_name' | 'zipcode' | 'city' | 'state'>,
): string {
  return `${window.location.origin}${coursePath(course)}`
}

export function reportShareUrl(reportId: string): string {
  return `${window.location.origin}/report/${reportId}`
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
