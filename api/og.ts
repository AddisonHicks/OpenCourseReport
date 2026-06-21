import {
  buildCourseOgMeta,
  buildHomeOgMeta,
  buildNotFoundOgMeta,
  buildReportOgMeta,
  getOgImageUrls,
  normalizeSiteUrl,
  renderOgHtml,
} from '../src/lib/ogMeta'
import { fetchReportById, getCourseBySlug } from './lib/ogData'

export const config = {
  runtime: 'edge',
}

const DEFAULT_SITE_URL = 'https://open-course-report.vercel.app'

function getSiteUrl(): string {
  if (process.env.SITE_URL) {
    return normalizeSiteUrl(process.env.SITE_URL)
  }
  if (process.env.VERCEL_URL) {
    return normalizeSiteUrl(`https://${process.env.VERCEL_URL}`)
  }
  return DEFAULT_SITE_URL
}

function getEnv() {
  return {
    SITE_URL: process.env.SITE_URL,
    OG_IMAGE_HOME: process.env.OG_IMAGE_HOME,
    OG_IMAGE_COURSE: process.env.OG_IMAGE_COURSE,
    OG_IMAGE_REPORT: process.env.OG_IMAGE_REPORT,
    SUPABASE_URL: process.env.SUPABASE_URL,
    VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
  }
}

function cacheHeaders(): Record<string, string> {
  return {
    'Content-Type': 'text/html; charset=utf-8',
    'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
  }
}

export default async function handler(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url)
  const path = searchParams.get('path') ?? '/'
  const siteUrl = getSiteUrl()
  const images = getOgImageUrls(getEnv())

  if (path === '/' || path === '') {
    const meta = buildHomeOgMeta(siteUrl, images)
    return new Response(renderOgHtml(meta), { headers: cacheHeaders() })
  }

  const courseMatch = path.match(/^\/course\/([^/]+)\/?$/)
  if (courseMatch) {
    const slug = decodeURIComponent(courseMatch[1])
    const course = await getCourseBySlug(slug)
    if (!course) {
      const meta = buildNotFoundOgMeta(siteUrl, images)
      return new Response(renderOgHtml(meta, { noindex: true }), {
        status: 404,
        headers: cacheHeaders(),
      })
    }
    const meta = buildCourseOgMeta(course, siteUrl, images)
    return new Response(renderOgHtml(meta), { headers: cacheHeaders() })
  }

  const reportMatch = path.match(/^\/report\/([^/]+)\/?$/)
  if (reportMatch) {
    const reportId = decodeURIComponent(reportMatch[1])
    const report = await fetchReportById(reportId)
    if (!report) {
      const meta = buildNotFoundOgMeta(siteUrl, images)
      return new Response(renderOgHtml(meta, { noindex: true }), {
        status: 404,
        headers: cacheHeaders(),
      })
    }
    const meta = buildReportOgMeta(report, siteUrl, images)
    return new Response(renderOgHtml(meta), { headers: cacheHeaders() })
  }

  const meta = buildNotFoundOgMeta(siteUrl, images)
  return new Response(renderOgHtml(meta, { noindex: true }), {
    status: 404,
    headers: cacheHeaders(),
  })
}
