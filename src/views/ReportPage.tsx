import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ReportModal } from '../components/ReportModal'
import { fetchReportById } from '../lib/reports'
import { isWithin90Days } from '../lib/reportQueries'
import type { ReportDisplay } from '../types'

function setMeta(property: string, content: string) {
  let el = document.querySelector(`meta[property="${property}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute('property', property)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

export function ReportPage() {
  const { reportId } = useParams<{ reportId: string }>()
  const navigate = useNavigate()
  const [report, setReport] = useState<ReportDisplay | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!reportId) return
    void fetchReportById(reportId).then((raw) => {
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

      const courseName = raw.courses.course_name
      const title = `${courseName} — Course Report | OpenCourseReport`
      const desc =
        raw.greens_report?.slice(0, 120) ??
        `Golf conditions report for ${courseName}`
      document.title = title
      setMeta('og:title', title)
      setMeta('og:description', desc)
      setMeta('og:type', 'article')
      setMeta('twitter:card', 'summary')
      setMeta('twitter:title', title)
      setMeta('twitter:description', desc)
    })

    return () => {
      document.title = 'OpenCourseReport'
    }
  }, [reportId])

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
        <Link to="/" className="font-semibold text-green-mid">
          ← Browse reports
        </Link>
      </div>
    )
  }

  return (
    <ReportModal
      report={report}
      onClose={() => navigate(`/course/${report.courses.id}`)}
    />
  )
}
