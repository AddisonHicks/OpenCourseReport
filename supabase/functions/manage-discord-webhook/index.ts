import {
  isValidDiscordWebhookUrl,
  normalizeThreadId,
} from '../_shared/discord.ts'
import {
  normalizeState,
  suggestZipFromCityState,
} from '../_shared/geo.ts'
import {
  corsHeaders,
  createServiceClient,
  jsonResponse,
  sha256Hex,
} from '../_shared/supabase.ts'

type Action = 'disable' | 'enable' | 'update' | 'view'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders() })
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  let body: {
    manage_token?: string
    action?: Action
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

  const manageToken = body.manage_token?.trim() ?? ''
  if (!manageToken.startsWith('ocr_') || manageToken.length < 20) {
    return jsonResponse({ error: 'Invalid manage token.' }, 400)
  }

  const action = body.action
  if (!action || !['disable', 'enable', 'update', 'view'].includes(action)) {
    return jsonResponse(
      { error: 'Action must be disable, enable, update, or view.' },
      400,
    )
  }

  const supabase = createServiceClient()
  const tokenHash = await sha256Hex(manageToken)

  const { data: sub, error: lookupError } = await supabase
    .from('discord_webhook_subscriptions')
    .select(
      'id, label, city, state, radius_miles, thread_id, enabled, updated_at',
    )
    .eq('manage_token_hash', tokenHash)
    .maybeSingle()

  if (lookupError) {
    console.error('Lookup failed', lookupError)
    return jsonResponse({ error: 'Lookup failed.' }, 500)
  }
  if (!sub) {
    return jsonResponse({ error: 'Subscription not found for that token.' }, 404)
  }

  if (action === 'view') {
    return jsonResponse({ ok: true, subscription: sub })
  }

  if (action === 'disable' || action === 'enable') {
    const { data, error } = await supabase
      .from('discord_webhook_subscriptions')
      .update({
        enabled: action === 'enable',
        updated_at: new Date().toISOString(),
      })
      .eq('id', sub.id)
      .select(
        'id, label, city, state, radius_miles, thread_id, enabled, updated_at',
      )
      .single()

    if (error || !data) {
      return jsonResponse({ error: 'Could not update subscription.' }, 500)
    }
    return jsonResponse({ ok: true, subscription: data })
  }

  // update
  const updates: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  }

  if (body.webhook_url !== undefined) {
    const webhookUrl = body.webhook_url.trim()
    if (!isValidDiscordWebhookUrl(webhookUrl)) {
      return jsonResponse({ error: 'Invalid Discord webhook URL.' }, 400)
    }
    updates.webhook_url = webhookUrl
  }

  if (body.thread_id !== undefined) {
    if (body.thread_id === null || body.thread_id === '') {
      updates.thread_id = null
    } else {
      const threadId = normalizeThreadId(body.thread_id)
      if (!threadId) {
        return jsonResponse(
          { error: 'Thread ID must be a Discord snowflake (17–20 digits).' },
          400,
        )
      }
      updates.thread_id = threadId
    }
  }

  if (body.label !== undefined) {
    updates.label = body.label.trim().slice(0, 120)
  }

  const city = body.city?.trim()
  const stateInput = body.state?.trim()
  const radius =
    typeof body.radius === 'number' && Number.isFinite(body.radius)
      ? Math.round(body.radius)
      : undefined

  if (city || stateInput || radius !== undefined) {
    const nextCity = city || sub.city
    const nextState = stateInput ? normalizeState(stateInput) : sub.state
    if (!nextState) {
      return jsonResponse({ error: 'Invalid US state.' }, 400)
    }
    const nextRadius = radius ?? sub.radius_miles
    if (nextRadius < 1 || nextRadius > 500) {
      return jsonResponse(
        { error: 'Radius must be between 1 and 500 miles.' },
        400,
      )
    }
    const centerZip = suggestZipFromCityState(nextCity, nextState)
    if (!centerZip) {
      return jsonResponse(
        {
          error: `Could not find a zip code for ${nextCity}, ${nextState}.`,
        },
        400,
      )
    }
    updates.city = nextCity
    updates.state = nextState
    updates.radius_miles = nextRadius
    updates.center_zip = centerZip
  }

  // Ensure radius alone still validates when city/state unchanged
  if (radius !== undefined && updates.radius_miles === undefined) {
    if (radius < 1 || radius > 500) {
      return jsonResponse(
        { error: 'Radius must be between 1 and 500 miles.' },
        400,
      )
    }
    updates.radius_miles = radius
  }

  if (Object.keys(updates).length <= 1) {
    return jsonResponse(
      { error: 'No update fields provided.' },
      400,
    )
  }

  const { data, error } = await supabase
    .from('discord_webhook_subscriptions')
    .update(updates)
    .eq('id', sub.id)
    .select(
      'id, label, city, state, radius_miles, thread_id, enabled, updated_at',
    )
    .single()

  if (error || !data) {
    console.error('Update failed', error)
    return jsonResponse({ error: 'Could not update subscription.' }, 500)
  }

  return jsonResponse({ ok: true, subscription: data })
})
