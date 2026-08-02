import {
  buildWebhookExecuteUrl,
} from '../_shared/discord.ts'
import { buildDiscordWebhookPayload } from '../_shared/embed.ts'
import { isZipWithinRadius } from '../_shared/geo.ts'
import {
  corsHeaders,
  createServiceClient,
  jsonResponse,
  siteUrl,
} from '../_shared/supabase.ts'

type DbWebhookPayload = {
  type?: string
  table?: string
  schema?: string
  record?: { id?: string }
}

type Subscription = {
  id: string
  webhook_url: string
  thread_id: string | null
  city: string
  state: string
  radius_miles: number
  center_zip: string
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const expectedSecret = Deno.env.get('DISCORD_NOTIFY_WEBHOOK_SECRET')
  if (expectedSecret) {
    const provided =
      req.headers.get('x-webhook-secret') ??
      req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '')
    if (provided !== expectedSecret) {
      return jsonResponse({ error: 'Unauthorized' }, 401)
    }
  }

  let body: DbWebhookPayload
  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400)
  }

  const reportId = body.record?.id
  if (!reportId || body.type !== 'INSERT' || body.table !== 'reports') {
    return jsonResponse({ ok: true, skipped: true })
  }

  const supabase = createServiceClient()

  const { data: report, error: reportError } = await supabase
    .from('reports')
    .select(
      `
      id, slug, first_name, last_initial, date_played, time_of_day, transport_mode,
      price_paid, holes_played, pace_of_play, greens_report, fairways_tees_report,
      maintenance_notes, other_conditions_notes, created_at,
      courses ( course_name, city, state, zipcode, slug )
    `,
    )
    .eq('id', reportId)
    .maybeSingle()

  if (reportError || !report?.courses) {
    console.error('Failed to load report', reportId, reportError)
    return jsonResponse({ error: 'Report not found' }, 404)
  }

  // courses may come back as object or array depending on relationship
  const course = Array.isArray(report.courses)
    ? report.courses[0]
    : report.courses
  if (!course) {
    return jsonResponse({ error: 'Course not found' }, 404)
  }

  const reportWithCourse = { ...report, courses: course }

  const { data: subscriptions, error: subsError } = await supabase
    .from('discord_webhook_subscriptions')
    .select(
      'id, webhook_url, thread_id, city, state, radius_miles, center_zip',
    )
    .eq('enabled', true)

  if (subsError) {
    console.error('Failed to load subscriptions', subsError)
    return jsonResponse({ error: 'Failed to load subscriptions' }, 500)
  }

  const payload = buildDiscordWebhookPayload(reportWithCourse, siteUrl())
  let delivered = 0
  let skipped = 0

  for (const sub of (subscriptions ?? []) as Subscription[]) {
    if (!isZipWithinRadius(sub.center_zip, course.zipcode, sub.radius_miles)) {
      skipped += 1
      continue
    }

    const { error: dedupError } = await supabase
      .from('discord_webhook_deliveries')
      .insert({ subscription_id: sub.id, report_id: reportId })

    if (dedupError) {
      // unique violation => already delivered
      if (dedupError.code === '23505') {
        skipped += 1
        continue
      }
      console.error('Dedup insert failed', dedupError)
      continue
    }

    try {
      const executeUrl = buildWebhookExecuteUrl(sub.webhook_url, sub.thread_id)
      const res = await fetch(executeUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (res.status === 404) {
        console.warn(`Webhook deleted for subscription ${sub.id}; disabling`)
        await supabase
          .from('discord_webhook_subscriptions')
          .update({ enabled: false, updated_at: new Date().toISOString() })
          .eq('id', sub.id)
        continue
      }

      if (!res.ok) {
        const text = await res.text()
        console.error(
          `Discord webhook failed for ${sub.id}: ${res.status} ${text}`,
        )
        // allow retry on next webhook attempt by removing dedup row
        await supabase
          .from('discord_webhook_deliveries')
          .delete()
          .eq('subscription_id', sub.id)
          .eq('report_id', reportId)
        continue
      }

      delivered += 1
    } catch (err) {
      console.error(`Discord webhook error for ${sub.id}`, err)
      await supabase
        .from('discord_webhook_deliveries')
        .delete()
        .eq('subscription_id', sub.id)
        .eq('report_id', reportId)
    }
  }

  return jsonResponse({ ok: true, delivered, skipped })
})
