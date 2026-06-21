import { resolveCourseSlug } from './courseSlug'
import { formatCourseLocation } from './courses'
import { formatDateNumeric } from './reportQueries'
import type { Course, ReportWithCourse } from '../types'

export interface OgImages {
  home: string
  course: string
  report: string
}

export interface OgMeta {
  title: string
  description: string
  url: string
  image: string
  type?: string
}

const SITE_NAME = 'OpenCourseReport'

export function normalizeSiteUrl(url: string): string {
  return url.replace(/\/$/, '')
}

export function getOgImageUrls(env: {
  OG_IMAGE_HOME?: string
  OG_IMAGE_COURSE?: string
  OG_IMAGE_REPORT?: string
  SUPABASE_URL?: string
  VITE_SUPABASE_URL?: string
}): OgImages {
  const supabaseUrl = (env.SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? '').replace(
    /\/$/,
    '',
  )
  const storageBase = supabaseUrl
    ? `${supabaseUrl}/storage/v1/object/public/share-og`
    : ''

  return {
    home: env.OG_IMAGE_HOME ?? `${storageBase}/og-home.png`,
    course: env.OG_IMAGE_COURSE ?? `${storageBase}/og-course.png`,
    report: env.OG_IMAGE_REPORT ?? `${storageBase}/og-report.png`,
  }
}

export function buildHomeOgMeta(siteUrl: string, images: OgImages): OgMeta {
  const base = normalizeSiteUrl(siteUrl)
  return {
    title: SITE_NAME,
    description:
      'Crowdsourced golf course conditions — browse and submit reports, no login required.',
    url: `${base}/`,
    image: images.home,
    type: 'website',
  }
}

export function buildCourseOgMeta(
  course: Course,
  siteUrl: string,
  images: OgImages,
): OgMeta {
  const base = normalizeSiteUrl(siteUrl)
  const slug = resolveCourseSlug(course)
  const location = formatCourseLocation(course)

  return {
    title: `${course.course_name} | ${SITE_NAME}`,
    description: `Browse and submit golf course condition reports for ${course.course_name} in ${location}.`,
    url: `${base}/course/${slug}`,
    image: images.course,
    type: 'website',
  }
}

export function buildReportOgMeta(
  report: ReportWithCourse,
  siteUrl: string,
  images: OgImages,
): OgMeta {
  const base = normalizeSiteUrl(siteUrl)
  const course = report.courses
  const courseName = course.course_name
  const datePlayed = formatDateNumeric(report.date_played)

  return {
    title: `${datePlayed} Report - ${courseName} | ${SITE_NAME}`,
    description: `Golf conditions report for ${courseName} on ${datePlayed}. Tap to read more.`,
    url: `${base}/report/${report.id}`,
    image: images.report,
    type: 'article',
  }
}

export function buildNotFoundOgMeta(siteUrl: string, images: OgImages): OgMeta {
  const base = normalizeSiteUrl(siteUrl)
  return {
    title: `Page not found | ${SITE_NAME}`,
    description: 'The page you are looking for could not be found.',
    url: base,
    image: images.home,
    type: 'website',
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

export function renderOgHtml(meta: OgMeta, options?: { noindex?: boolean }): string {
  const title = escapeHtml(meta.title)
  const description = escapeHtml(meta.description)
  const url = escapeHtml(meta.url)
  const image = escapeHtml(meta.image)
  const type = escapeHtml(meta.type ?? 'website')
  const robots = options?.noindex ? '\n    <meta name="robots" content="noindex" />' : ''

  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${title}</title>
    <meta name="description" content="${description}" />${robots}
    <meta property="og:title" content="${title}" />
    <meta property="og:description" content="${description}" />
    <meta property="og:type" content="${type}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${image}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${title}" />
    <meta name="twitter:description" content="${description}" />
    <meta name="twitter:image" content="${image}" />
  </head>
  <body>
    <p><a href="${url}">${title}</a></p>
  </body>
</html>`
}
