import {
  buildCourseOgMeta,
  buildHomeOgMeta,
  buildNotFoundOgMeta,
  buildReportOgMeta,
  getOgImageUrls,
  normalizeSiteUrl,
  renderOgHtml,
} from './lib/ogMeta'

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

function sendHtml(res: { setHeader: (k: string, v: string) => void; status: (n: number) => { send: (b: string) => void } }, html: string, status = 200) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.status(status).send(html)
}

export default async function handler(
  req: { query: { path?: string } },
  res: {
    setHeader: (k: string, v: string) => void
    status: (n: number) => { send: (b: string) => void }
  },
) {
  const path = typeof req.query.path === 'string' ? req.query.path : '/'
  const siteUrl = getSiteUrl()
  const images = getOgImageUrls(getEnv())

  try {
    if (path === '/' || path === '') {
      const meta = buildHomeOgMeta(siteUrl, images)
      sendHtml(res, renderOgHtml(meta))
      return
    }

    const reportPathMatch = path.match(/^\/course\/([^/]+)\/([^/]+)\/?$/)
    if (reportPathMatch) {
      const { fetchReportByCourseSlug } = await import('./lib/ogData')
      const courseSlug = decodeURIComponent(reportPathMatch[1])
      const reportSlug = decodeURIComponent(reportPathMatch[2])
      const report = await fetchReportByCourseSlug(courseSlug, reportSlug)
      if (!report) {
        const meta = buildNotFoundOgMeta(siteUrl, images)
        sendHtml(res, renderOgHtml(meta, { noindex: true }), 404)
        return
      }
      const meta = buildReportOgMeta(report, siteUrl, images)
      sendHtml(res, renderOgHtml(meta))
      return
    }

    const courseMatch = path.match(/^\/course\/([^/]+)\/?$/)
    if (courseMatch) {
      const { getCourseBySlug } = await import('./lib/ogData')
      const slug = decodeURIComponent(courseMatch[1])
      const course = await getCourseBySlug(slug)
      if (!course) {
        const meta = buildNotFoundOgMeta(siteUrl, images)
        sendHtml(res, renderOgHtml(meta, { noindex: true }), 404)
        return
      }
      const meta = buildCourseOgMeta(course, siteUrl, images)
      sendHtml(res, renderOgHtml(meta))
      return
    }

    const meta = buildNotFoundOgMeta(siteUrl, images)
    sendHtml(res, renderOgHtml(meta, { noindex: true }), 404)
  } catch (err) {
    console.error('OG handler error:', err)
    const meta = buildHomeOgMeta(siteUrl, images)
    sendHtml(res, renderOgHtml(meta), 500)
  }
}
