/**
 * Self-contained OG HTML handler for Vercel.
 * Kept in one file so the serverless bundle does not fail on multi-file imports.
 */

const SITE_NAME = 'OpenCourseReport'
const DEFAULT_SITE_URL = 'https://open-course-report.vercel.app'

interface OgMeta {
  title: string
  description: string
  url: string
  image: string
  type?: string
}

interface Course {
  id: string
  course_name: string
  city: string
  state: string
  zipcode: string | null
  slug: string | null
}

interface ReportRow {
  id: string
  slug: string | null
  date_played: string
  courses: Course
}

function normalizeSiteUrl(url: string): string {
  return url.replace(/\/$/, '')
}

function getSiteUrl(): string {
  if (process.env.SITE_URL) return normalizeSiteUrl(process.env.SITE_URL)
  if (process.env.VERCEL_URL) return normalizeSiteUrl(`https://${process.env.VERCEL_URL}`)
  return DEFAULT_SITE_URL
}

function getSupabaseConfig(): { url: string; key: string } | null {
  const url = (process.env.SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '')
  const key = process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY ?? ''
  if (!url || !key) return null
  return { url, key }
}

function getOgImages(): { home: string; course: string; report: string } {
  const explicitHome = process.env.OG_IMAGE_HOME
  const explicitCourse = process.env.OG_IMAGE_COURSE
  const explicitReport = process.env.OG_IMAGE_REPORT
  const cfg = getSupabaseConfig()
  const storageBase = cfg
    ? `${cfg.url}/storage/v1/object/public/share-og`
    : ''

  return {
    home: explicitHome ?? `${storageBase}/og-home.png`,
    course: explicitCourse ?? `${storageBase}/og-course.png`,
    report: explicitReport ?? `${storageBase}/og-report.png`,
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderOgHtml(meta: OgMeta, noindex = false): string {
  const title = escapeHtml(meta.title)
  const description = escapeHtml(meta.description)
  const url = escapeHtml(meta.url)
  const image = escapeHtml(meta.image)
  const type = escapeHtml(meta.type ?? 'website')
  const robots = noindex ? '\n    <meta name="robots" content="noindex" />' : ''

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
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />
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

function slugifyCourseName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80)
}

function resolveCourseSlug(course: Course): string {
  if (course.slug) return course.slug
  const base = slugifyCourseName(course.course_name)
  const zip = course.zipcode?.trim()
  if (zip && /^\d{5}$/.test(zip)) return `${base}-${zip}`
  return `${base}-${slugifyCourseName(course.city)}-${course.state.trim().toLowerCase()}`
}

function resolveReportSlug(report: { slug: string | null; date_played: string }): string {
  if (report.slug) return report.slug
  const d = report.date_played.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(d) ? d : report.date_played
}

function formatDateNumeric(dateStr: string): string {
  const d = new Date(dateStr.includes('T') ? dateStr : `${dateStr}T12:00:00`)
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  const yyyy = d.getFullYear()
  return `${mm}/${dd}/${yyyy}`
}

function parseReportSlugParam(reportSlug: string): { datePlayed: string; index: number } | null {
  const match = reportSlug.match(/^(\d{4}-\d{2}-\d{2})(?:-(\d+))?$/)
  if (!match) return null
  const index = match[2] ? parseInt(match[2], 10) : 1
  if (!Number.isFinite(index) || index < 1) return null
  return { datePlayed: match[1], index }
}

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

async function supabaseGet<T>(pathAndQuery: string): Promise<T | null> {
  const cfg = getSupabaseConfig()
  if (!cfg) return null
  const res = await fetch(`${cfg.url}/rest/v1/${pathAndQuery}`, {
    headers: {
      apikey: cfg.key,
      Authorization: `Bearer ${cfg.key}`,
      Accept: 'application/json',
    },
  })
  if (!res.ok) return null
  return (await res.json()) as T
}

async function getCourseBySlug(slugOrId: string): Promise<Course | null> {
  if (UUID_RE.test(slugOrId)) {
    const rows = await supabaseGet<Course[]>(`courses?id=eq.${slugOrId}&select=*`)
    return rows?.[0] ?? null
  }

  const bySlug = await supabaseGet<Course[]>(
    `courses?slug=eq.${encodeURIComponent(slugOrId)}&select=*`,
  )
  if (bySlug?.[0]) return bySlug[0]

  const zipMatch = slugOrId.match(/-(\d{5})$/)
  if (!zipMatch) return null

  const zip = zipMatch[1]
  const candidates = await supabaseGet<Course[]>(
    `courses?zipcode=eq.${zip}&is_approved=eq.true&select=*`,
  )
  return candidates?.find((c) => resolveCourseSlug(c) === slugOrId) ?? null
}

async function fetchReportByCourseSlug(
  courseSlug: string,
  reportSlug: string,
): Promise<ReportRow | null> {
  const course = await getCourseBySlug(courseSlug)
  if (!course) return null

  const bySlug = await supabaseGet<ReportRow[]>(
    `reports?course_id=eq.${course.id}&slug=eq.${encodeURIComponent(reportSlug)}&select=id,slug,date_played,courses(id,course_name,city,state,zipcode,slug)&limit=1`,
  )
  if (bySlug?.[0]) return bySlug[0]

  const parsed = parseReportSlugParam(reportSlug)
  if (!parsed) return null

  const rows = await supabaseGet<ReportRow[]>(
    `reports?course_id=eq.${course.id}&date_played=eq.${parsed.datePlayed}&select=id,slug,date_played,courses(id,course_name,city,state,zipcode,slug)&order=created_at.asc`,
  )
  if (!rows?.length) return null
  return rows[parsed.index - 1] ?? null
}

function buildHomeMeta(siteUrl: string, images: ReturnType<typeof getOgImages>): OgMeta {
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

function buildCourseMeta(course: Course, siteUrl: string, images: ReturnType<typeof getOgImages>): OgMeta {
  const base = normalizeSiteUrl(siteUrl)
  const slug = resolveCourseSlug(course)
  return {
    title: `${course.course_name} | ${SITE_NAME}`,
    description: `Browse and submit golf course condition reports for ${course.course_name} in ${course.city}, ${course.state}.`,
    url: `${base}/course/${slug}`,
    image: images.course,
    type: 'website',
  }
}

function buildReportMeta(report: ReportRow, siteUrl: string, images: ReturnType<typeof getOgImages>): OgMeta {
  const base = normalizeSiteUrl(siteUrl)
  const course = report.courses
  const datePlayed = formatDateNumeric(report.date_played)
  return {
    title: `${datePlayed} Report - ${course.course_name} | ${SITE_NAME}`,
    description: `Golf conditions report for ${course.course_name} on ${datePlayed}. Tap to read more.`,
    url: `${base}/course/${resolveCourseSlug(course)}/${resolveReportSlug(report)}`,
    image: images.report,
    type: 'article',
  }
}

function sendHtml(
  res: { setHeader: (k: string, v: string) => void; status: (n: number) => { send: (b: string) => void } },
  html: string,
  status = 200,
) {
  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  res.setHeader('Cache-Control', 'public, s-maxage=3600, stale-while-revalidate=86400')
  res.status(status).send(html)
}

export default async function handler(
  req: { query: { path?: string | string[] } },
  res: {
    setHeader: (k: string, v: string) => void
    status: (n: number) => { send: (b: string) => void }
  },
) {
  const rawPath = req.query.path
  const path = typeof rawPath === 'string' ? rawPath : '/'
  const siteUrl = getSiteUrl()
  const images = getOgImages()

  try {
    if (path === '/' || path === '') {
      sendHtml(res, renderOgHtml(buildHomeMeta(siteUrl, images)))
      return
    }

    const reportMatch = path.match(/^\/course\/([^/]+)\/([^/]+)\/?$/)
    if (reportMatch) {
      const report = await fetchReportByCourseSlug(
        decodeURIComponent(reportMatch[1]),
        decodeURIComponent(reportMatch[2]),
      )
      if (!report) {
        sendHtml(res, renderOgHtml(buildHomeMeta(siteUrl, images), true), 404)
        return
      }
      sendHtml(res, renderOgHtml(buildReportMeta(report, siteUrl, images)))
      return
    }

    const courseMatch = path.match(/^\/course\/([^/]+)\/?$/)
    if (courseMatch) {
      const course = await getCourseBySlug(decodeURIComponent(courseMatch[1]))
      if (!course) {
        sendHtml(res, renderOgHtml(buildHomeMeta(siteUrl, images), true), 404)
        return
      }
      sendHtml(res, renderOgHtml(buildCourseMeta(course, siteUrl, images)))
      return
    }

    sendHtml(res, renderOgHtml(buildHomeMeta(siteUrl, images), true), 404)
  } catch (err) {
    console.error('OG handler error:', err)
    sendHtml(res, renderOgHtml(buildHomeMeta(siteUrl, images)), 500)
  }
}
