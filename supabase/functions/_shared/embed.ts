type Course = {
  course_name: string
  city: string
  state: string
  zipcode: string | null
  slug: string | null
}

type Report = {
  slug?: string | null
  first_name: string
  last_initial: string
  date_played: string
  time_of_day: string
  transport_mode: string | null
  price_paid: number | null
  holes_played: number | null
  pace_of_play: number | null
  greens_report: string | null
  fairways_tees_report: string | null
  maintenance_notes: string | null
  other_conditions_notes: string | null
  created_at: string
}

function slugify(name: string): string {
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
  const base = slugify(course.course_name)
  const zip = course.zipcode?.trim()
  if (zip && /^\d{5}$/.test(zip)) return `${base}-${zip}`
  return `${base}-${slugify(course.city)}-${course.state.trim().toLowerCase()}`
}

function resolveReportSlug(report: Report): string {
  if (report.slug) return report.slug
  return report.date_played
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr + 'T12:00:00')
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatPace(minutes: number | null): string {
  if (minutes == null || minutes <= 0) return '—'
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}m`
  if (m === 0) return `${h}h`
  return `${h}h ${m}m`
}

function formatGreenFee(price: number | null, holes: number | null): string {
  if (price == null) return '—'
  const dollars = `$${Math.round(price)}`
  if (holes === 9 || holes === 18) return `${dollars} (${holes} holes)`
  return dollars
}

function timeOfDayEmoji(tod: string): string {
  switch (tod) {
    case 'morning':
      return '☀️'
    case 'midday':
      return '🌤'
    case 'afternoon':
      return '🌇'
    default:
      return ''
  }
}

function timeOfDayLabel(tod: string): string {
  switch (tod) {
    case 'morning':
      return 'AM'
    case 'midday':
      return 'Mid-Day'
    case 'afternoon':
      return 'PM'
    default:
      return tod
  }
}

function transportLabel(mode: string | null): string | null {
  if (mode === 'walking') return '🚶 Walking'
  if (mode === 'cart') return '🛺 Cart'
  return null
}

function truncateField(value: string, max = 1024): string {
  const t = value.trim()
  if (t.length <= max) return t
  return `${t.slice(0, max - 1)}…`
}

function addField(
  fields: Array<{ name: string; value: string; inline?: boolean }>,
  name: string,
  value: string | null | undefined,
  inline = false,
): void {
  if (!value?.trim()) return
  fields.push({ name, value: truncateField(value), inline })
}

export const REPORT_ANNOUNCEMENT =
  'A New Course Conditions Report Has Been Submitted:'

export function buildDiscordWebhookPayload(
  report: Report & { courses: Course },
  siteUrl: string,
): {
  content: string
  embeds: Array<Record<string, unknown>>
  components: Array<Record<string, unknown>>
} {
  const course = report.courses
  const courseUrl = `${siteUrl}/course/${resolveCourseSlug(course)}`
  const reportUrl = `${siteUrl}/course/${resolveCourseSlug(course)}/${resolveReportSlug(report)}`
  const submitUrl = `${siteUrl}/submit`
  const name = `${report.first_name} ${report.last_initial.toUpperCase()}.`
  const transport = transportLabel(report.transport_mode)

  const fields: Array<{ name: string; value: string; inline?: boolean }> = []

  if (report.price_paid != null) {
    fields.push({
      name: 'Green Fee',
      value: formatGreenFee(report.price_paid, report.holes_played),
      inline: true,
    })
  }
  if (report.holes_played != null) {
    fields.push({
      name: 'Holes played',
      value: String(report.holes_played),
      inline: true,
    })
  }
  if (transport) {
    fields.push({ name: 'Transport', value: transport, inline: true })
  }

  addField(fields, 'Greens', report.greens_report)
  addField(fields, 'Fairways & Tees', report.fairways_tees_report)
  addField(fields, 'Maintenance', report.maintenance_notes)
  addField(fields, 'Other Conditions', report.other_conditions_notes)

  if (report.pace_of_play != null) {
    fields.push({
      name: 'Pace of Play',
      value: formatPace(report.pace_of_play),
      inline: true,
    })
  }

  const description = [
    `${course.city}, ${course.state} | Played ${formatDate(report.date_played)} | ${timeOfDayEmoji(report.time_of_day)} ${timeOfDayLabel(report.time_of_day)}`,
    `Submitted by: ${name}`,
  ].join('\n')

  return {
    content: REPORT_ANNOUNCEMENT,
    embeds: [
      {
        title: course.course_name,
        url: courseUrl,
        color: 0x2d6a4f,
        description,
        fields,
        footer: { text: 'OpenCourseReport' },
        timestamp: new Date(report.created_at).toISOString(),
      },
    ],
    components: [
      {
        type: 1,
        components: [
          {
            type: 2,
            style: 5,
            label: 'View Report',
            url: reportUrl,
          },
          {
            type: 2,
            style: 5,
            label: 'Submit Your Own Report',
            url: submitUrl,
          },
        ],
      },
    ],
  }
}
