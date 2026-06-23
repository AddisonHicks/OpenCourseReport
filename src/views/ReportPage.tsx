import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ReportModal } from '../components/ReportModal'
import { coursePath } from '../lib/courses'
import {
  buildReportOgMeta,
  getOgImageUrls,
  normalizeSiteUrl,
} from '../lib/ogMeta'
import { resetPageMeta, setPageMeta } from '../lib/pageMeta'
import { fetchReportByCourseSlug } from '../lib/reports'
import { isWithin90Days } from '../lib/reportQueries'
import type { ReportDisplay } from '../types'

export function ReportPage() {
  const { courseSlug, reportSlug } = useParams<{
    courseSlug: string
    reportSlug: string
  }>()
  const navigate = useNavigate()
  const [report, setReport] = useState<ReportDisplay | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!courseSlug || !reportSlug) return
    void fetchReportByCourseSlug(courseSlug, reportSlug).then((raw) => {
      if (!raw) {
        setReport(null)
        setLoading(false)
        return
      }
      setReport({
        ...raw,
        isOlderReport: !isWithin90Days(raw.date_played),
      })
      setLoading(false)

      const images = getOgImageUrls({
        VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
        OG_IMAGE_HOME: import.meta.env.VITE_OG_IMAGE_HOME,
        OG_IMAGE_COURSE: import.meta.env.VITE_OG_IMAGE_COURSE,
        OG_IMAGE_REPORT: import.meta.env.VITE_OG_IMAGE_REPORT,
      })
      setPageMeta(
        buildReportOgMeta(
          raw,
          normalizeSiteUrl(window.location.origin),
          images,
        ),
      )
    })

    return () => {
      resetPageMeta()
    }
  }, [courseSlug, reportSlug])

  if (loading) {
    return (
      <div className="mx-auto min-h-dvh max-w-lg bg-sand px-4 py-6">
        <p className="text-sm text-green-dark/60">Loading report…</p>
      </div>
    )
  }

  if (!report) {
    return (
      <div className="mx-auto min-h-dvh max-w-lg bg-sand px-4 py-6">
        <p className="mb-4">Report not found.</p>
        <Link to="/" className="text-link">
          ← Browse reports
        </Link>
      </div>
    )
  }

  return (
    <ReportModal
      report={report}
      onClose={() => navigate(coursePath(report.courses))}
    />
  )
}
