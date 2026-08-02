import {
  isValidDiscordWebhookUrl,
  normalizeThreadId,
} from '../_shared/discord.ts'
import {
  DEFAULT_RADIUS_MILES,
  normalizeState,
  suggestZipFromCityState,
} from '../_shared/geo.ts'
import {
  clientIp,
  corsHeaders,
  createServiceClient,
  jsonResponse,
  sha256Hex,
} from '../_shared/supabase.ts'

const MAX_REGISTRATIONS_PER_IP_PER_HOUR = 5

function generateManageToken(): string {
  const bytes = new Uint8Array(24)
  crypto.getRandomValues(bytes)
  const random = [...bytes].map((b) => b.toString(16).padStart(2, '0')).join('')
  return `ocr_${random}`
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  let body: {
    webhook_url?: string
    thread_id?: string | null
    label?: string
    city?: string
    state?: string
    radius?: number
  }

  try {
    body = await req.json()
  } catch {
    return jsonResponse({ error: 'Invalid JSON' }, 400)
  }

  const webhookUrl = body.webhook_url?.trim() ?? ''
  if (!isValidDiscordWebhookUrl(webhookUrl)) {
    return jsonResponse(
      {
        error:
          'Invalid Discord webhook URL. Use a URL like https://discord.com/api/webhooks/...',
      },
      400,
    )
  }

  const city = body.city?.trim() ?? ''
  const state = normalizeState(body.state ?? '')
  if (city.length < 2 || !state) {
    return jsonResponse(
      { error: 'Valid city and US state are required.' },
      400,
    )
  }

  const radius =
    typeof body.radius === 'number' && Number.isFinite(body.radius)
      ? Math.round(body.radius)
      : DEFAULT_RADIUS_MILES
  if (radius < 1 || radius > 500) {
    return jsonResponse({ error: 'Radius must be between 1 and 500 miles.' }, 400)
  }

  const threadId = normalizeThreadId(body.thread_id)
  if (body.thread_id?.trim() && !threadId) {
    return jsonResponse(
      { error: 'Thread ID must be a Discord snowflake (17–20 digits).' },
      400,
    )
  }

  const centerZip = suggestZipFromCityState(city, state)
  if (!centerZip) {
    return jsonResponse(
      {
        error: `Could not find a zip code for ${city}, ${state}. Check the city spelling.`,
      },
      400,
    )
  }

  const supabase = createServiceClient()
  const ip = clientIp(req)
  const ipHash = await sha256Hex(ip)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString()

  const { count, error: countError } = await supabase
    .from('discord_webhook_subscriptions')
    .select('id', { count: 'exact', head: true })
    .eq('created_ip_hash', ipHash)
    .gte('created_at', oneHourAgo)

  if (countError) {
    console.error('Rate limit check failed', countError)
  } else if ((count ?? 0) >= MAX_REGISTRATIONS_PER_IP_PER_HOUR) {
    return jsonResponse(
      { error: 'Too many registrations from this network. Try again later.' },
      429,
    )
  }

  const manageToken = generateManageToken()
  const manageTokenHash = await sha256Hex(manageToken)
  const label = (body.label ?? '').trim().slice(0, 120)

  const { data, error } = await supabase
    .from('discord_webhook_subscriptions')
    .insert({
      label,
      webhook_url: webhookUrl,
      thread_id: threadId,
      city,
      state,
      radius_miles: radius,
      center_zip: centerZip,
      manage_token_hash: manageTokenHash,
      created_ip_hash: ipHash,
      enabled: true,
    })
    .select('id, city, state, radius_miles, label, enabled')
    .single()

  if (error || !data) {
    console.error('Insert subscription failed', error)
    return jsonResponse({ error: 'Could not save subscription.' }, 500)
  }

  return jsonResponse({
    ok: true,
    subscription: data,
    manage_token: manageToken,
    message:
      'Save this manage token — you will not see it again. Use it on the About page to disable or update this subscription.',
  })
})
