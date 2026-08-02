import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { FieldLabel } from './FieldLabel'
import { useToast } from '../context/ToastContext'
import { US_STATES } from '../lib/usStates'
import { AREA_RADIUS_MILES } from '../lib/zipcode'

type SubscriptionSummary = {
  id: string
  label: string
  city: string
  state: string
  radius_miles: number
  thread_id: string | null
  enabled: boolean
}

function functionsBaseUrl(): string | null {
  const url = import.meta.env.VITE_SUPABASE_URL?.replace(/\/$/, '')
  return url ? `${url}/functions/v1` : null
}

async function callFunction<T>(
  name: string,
  body: Record<string, unknown>,
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const base = functionsBaseUrl()
  if (!base) {
    return {
      ok: false,
      error: 'Supabase URL is not configured in this environment.',
    }
  }

  const key =
    import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    import.meta.env.VITE_SUPABASE_ANON_KEY ||
    ''

  try {
    const res = await fetch(`${base}/${name}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
        apikey: key,
      },
      body: JSON.stringify(body),
    })
    const json = (await res.json().catch(() => ({}))) as {
      error?: string
      message?: string
    } & T
    if (!res.ok) {
      return {
        ok: false,
        error: json.error || json.message || `Request failed (${res.status})`,
      }
    }
    return { ok: true, data: json as T }
  } catch {
    return { ok: false, error: 'Network error. Try again.' }
  }
}

/** Prefer explicit thread field; otherwise pull ?thread_id= off the webhook URL. */
function resolveWebhookAndThread(
  webhookUrl: string,
  threadId: string,
): { webhookUrl: string; threadId: string | null } {
  let cleanUrl = webhookUrl.trim()
  let resolvedThread: string | null = threadId.replace(/\D/g, '').slice(0, 20) || null

  try {
    const parsed = new URL(cleanUrl)
    const fromQuery = parsed.searchParams.get('thread_id')
    if (!resolvedThread && fromQuery && /^\d{17,20}$/.test(fromQuery)) {
      resolvedThread = fromQuery
    }
    parsed.searchParams.delete('thread_id')
    parsed.search = parsed.searchParams.toString()
    cleanUrl = parsed.toString().replace(/\?$/, '')
  } catch {
    // leave as-is; server will validate
  }

  return { webhookUrl: cleanUrl, threadId: resolvedThread }
}

const inputClass =
  'min-h-11 w-full rounded-lg border-0 bg-white px-3 py-3 text-base text-green-dark shadow-sm focus:outline-none focus:ring-2 focus:ring-green-mid/40'
const labelClass = 'mb-1 block font-display text-base text-green-dark'

export function DiscordWebhookSignup() {
  const { showToast } = useToast()

  const [webhookUrl, setWebhookUrl] = useState('')
  const [threadId, setThreadId] = useState('')
  const [label, setLabel] = useState('')
  const [city, setCity] = useState('')
  const [state, setState] = useState('')
  const [radius, setRadius] = useState(String(AREA_RADIUS_MILES))
  const [submitting, setSubmitting] = useState(false)
  const [manageToken, setManageToken] = useState<string | null>(null)
  const [registered, setRegistered] = useState<SubscriptionSummary | null>(null)

  const [tokenInput, setTokenInput] = useState('')
  const [manageBusy, setManageBusy] = useState(false)
  const [managed, setManaged] = useState<SubscriptionSummary | null>(null)
  const [manageCity, setManageCity] = useState('')
  const [manageState, setManageState] = useState('')
  const [manageRadius, setManageRadius] = useState(String(AREA_RADIUS_MILES))

  const stateOptions = useMemo(() => US_STATES, [])
  const registrationComplete = Boolean(manageToken && registered)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)

    const resolved = resolveWebhookAndThread(webhookUrl, threadId)

    const result = await callFunction<{
      manage_token: string
      subscription: SubscriptionSummary
    }>('register-discord-webhook', {
      webhook_url: resolved.webhookUrl,
      thread_id: resolved.threadId,
      label,
      city,
      state,
      radius: Number(radius) || AREA_RADIUS_MILES,
    })

    setSubmitting(false)

    if (!result.ok) {
      showToast(result.error)
      return
    }

    setManageToken(result.data.manage_token)
    setRegistered(result.data.subscription)
    showToast('Discord webhook registered.')
  }

  const loadManaged = async () => {
    setManageBusy(true)
    const result = await callFunction<{ subscription: SubscriptionSummary }>(
      'manage-discord-webhook',
      { manage_token: tokenInput.trim(), action: 'view' },
    )
    setManageBusy(false)
    if (!result.ok) {
      showToast(result.error)
      setManaged(null)
      return
    }
    setManaged(result.data.subscription)
    setManageCity(result.data.subscription.city)
    setManageState(result.data.subscription.state)
    setManageRadius(String(result.data.subscription.radius_miles))
  }

  const runManageAction = async (
    action: 'disable' | 'enable' | 'update',
  ) => {
    setManageBusy(true)
    const body: Record<string, unknown> = {
      manage_token: tokenInput.trim(),
      action,
    }
    if (action === 'update') {
      body.city = manageCity
      body.state = manageState
      body.radius = Number(manageRadius) || AREA_RADIUS_MILES
    }
    const result = await callFunction<{ subscription: SubscriptionSummary }>(
      'manage-discord-webhook',
      body,
    )
    setManageBusy(false)
    if (!result.ok) {
      showToast(result.error)
      return
    }
    setManaged(result.data.subscription)
    showToast(
      action === 'disable'
        ? 'Notifications disabled.'
        : action === 'enable'
          ? 'Notifications enabled.'
          : 'Subscription updated.',
    )
  }

  if (registrationComplete && manageToken && registered) {
    return (
      <section
        className="rounded-xl border-2 border-green-mid/40 bg-white p-4"
        aria-live="polite"
      >
        <h2 className="font-display text-xl font-bold text-green-dark">
          Subscription created
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-green-dark/80">
          Your Discord webhook is registered for{' '}
          <strong>
            {registered.city}, {registered.state}
          </strong>{' '}
          within <strong>{registered.radius_miles} miles</strong>
          {registered.label ? ` (${registered.label})` : ''}. New reports in
          that area will post automatically.
        </p>

        <div className="mt-4 rounded-lg border border-amber-500/40 bg-amber-50 p-3">
          <p className="font-display text-sm font-bold text-green-dark">
            1. Save this manage token — you will not see it again
          </p>
          <p className="mt-2 break-all rounded bg-white px-2 py-2 font-mono text-xs text-green-dark">
            {manageToken}
          </p>
          <button
            type="button"
            className="mt-2 min-h-11 text-sm font-medium text-green-mid"
            onClick={() => {
              void navigator.clipboard.writeText(manageToken)
              showToast('Manage token copied.')
            }}
          >
            Copy token
          </button>
        </div>

        <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-green-dark/80">
          <li>Store the token somewhere safe (you need it to disable or update later).</li>
          <li>
            Go back to the home page and{' '}
            <Link to="/submit" className="text-link font-medium">
              submit a test report
            </Link>{' '}
            for a course near {registered.city}, {registered.state}.
          </li>
          <li>
            Check Discord — the report embed should appear within a few seconds.
            That confirms the webhook is working.
          </li>
        </ol>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row">
          <Link
            to="/"
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-green-mid px-4 py-3 text-center font-display text-base font-bold text-white"
          >
            Go to home
          </Link>
          <Link
            to="/submit"
            className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg border-2 border-green-mid px-4 py-3 text-center font-display text-base font-bold text-green-mid"
          >
            Submit a test report
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="rounded-xl border-2 border-green-mid/30 bg-white p-4">
      <h2 className="sr-only">Discord webhook registration</h2>

      <ol className="list-decimal space-y-1 pl-5 text-sm text-green-dark/80">
        <li>
          In Discord: channel settings → <strong>Integrations</strong> →{' '}
          <strong>Webhooks</strong> → New Webhook → copy URL.
        </li>
        <li>
          For a <strong>forum post</strong>, also copy the post/thread ID (enable
          Developer Mode → right-click the post → Copy Thread ID), or include{' '}
          <code className="text-xs">?thread_id=...</code> on the webhook URL.
        </li>
        <li>Fill in the form below and save your manage token.</li>
      </ol>

      <form onSubmit={handleRegister} className="mt-4 space-y-3">
        <div>
          <FieldLabel required className={labelClass}>
            Discord webhook URL
          </FieldLabel>
          <input
            className={inputClass}
            type="url"
            required
            value={webhookUrl}
            onChange={(e) => setWebhookUrl(e.target.value)}
            placeholder="https://discord.com/api/webhooks/..."
            autoComplete="off"
          />
        </div>

        <div>
          <FieldLabel className={labelClass}>Forum thread / post ID</FieldLabel>
          <input
            className={inputClass}
            type="text"
            inputMode="numeric"
            value={threadId}
            onChange={(e) =>
              setThreadId(e.target.value.replace(/\D/g, '').slice(0, 20))
            }
            placeholder="Optional — for posting inside a forum post"
            autoComplete="off"
          />
        </div>

        <div>
          <FieldLabel className={labelClass}>Label</FieldLabel>
          <input
            className={inputClass}
            type="text"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="e.g. Golf Discord"
            maxLength={120}
          />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <FieldLabel required className={labelClass}>
              City
            </FieldLabel>
            <input
              className={inputClass}
              type="text"
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Athens"
            />
          </div>
          <div>
            <FieldLabel required className={labelClass}>
              State
            </FieldLabel>
            <select
              className={inputClass}
              required
              value={state}
              onChange={(e) => setState(e.target.value)}
            >
              <option value="">Select state</option>
              {stateOptions.map((s) => (
                <option key={s.abbr} value={s.abbr}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <FieldLabel className={labelClass}>Radius (miles)</FieldLabel>
          <input
            className={inputClass}
            type="number"
            min={1}
            max={500}
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="min-h-11 w-full rounded-lg bg-green-mid px-4 py-3 font-display text-base font-bold text-white disabled:opacity-60"
        >
          {submitting ? 'Registering…' : 'Register Discord webhook'}
        </button>
      </form>

      <div className="mt-6 border-t border-green-pale pt-4">
        <h3 className="font-display text-lg font-bold text-green-dark">
          Manage an existing subscription
        </h3>
        <p className="mt-1 text-sm text-green-dark/70">
          Paste the manage token you received when you registered.
        </p>

        <div className="mt-3 space-y-3">
          <input
            className={inputClass}
            type="text"
            value={tokenInput}
            onChange={(e) => setTokenInput(e.target.value)}
            placeholder="ocr_..."
            autoComplete="off"
          />
          <button
            type="button"
            disabled={manageBusy || !tokenInput.trim()}
            onClick={() => void loadManaged()}
            className="min-h-11 w-full rounded-lg border-2 border-green-mid px-4 py-2 font-display text-base font-bold text-green-mid disabled:opacity-60"
          >
            {manageBusy ? 'Loading…' : 'Look up subscription'}
          </button>
        </div>

        {managed && (
          <div className="mt-4 space-y-3">
            <p className="text-sm text-green-dark/80">
              Status:{' '}
              <strong>{managed.enabled ? 'Enabled' : 'Disabled'}</strong>
              {managed.label ? ` · ${managed.label}` : ''}
            </p>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <FieldLabel className={labelClass}>City</FieldLabel>
                <input
                  className={inputClass}
                  value={manageCity}
                  onChange={(e) => setManageCity(e.target.value)}
                />
              </div>
              <div>
                <FieldLabel className={labelClass}>State</FieldLabel>
                <select
                  className={inputClass}
                  value={manageState}
                  onChange={(e) => setManageState(e.target.value)}
                >
                  {stateOptions.map((s) => (
                    <option key={s.abbr} value={s.abbr}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <FieldLabel className={labelClass}>Radius (miles)</FieldLabel>
              <input
                className={inputClass}
                type="number"
                min={1}
                max={500}
                value={manageRadius}
                onChange={(e) => setManageRadius(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                disabled={manageBusy}
                onClick={() => void runManageAction('update')}
                className="min-h-11 flex-1 rounded-lg bg-green-mid px-4 py-2 font-display font-bold text-white disabled:opacity-60"
              >
                Update location
              </button>
              {managed.enabled ? (
                <button
                  type="button"
                  disabled={manageBusy}
                  onClick={() => void runManageAction('disable')}
                  className="min-h-11 flex-1 rounded-lg border-2 border-green-mid px-4 py-2 font-display font-bold text-green-mid disabled:opacity-60"
                >
                  Disable
                </button>
              ) : (
                <button
                  type="button"
                  disabled={manageBusy}
                  onClick={() => void runManageAction('enable')}
                  className="min-h-11 flex-1 rounded-lg border-2 border-green-mid px-4 py-2 font-display font-bold text-green-mid disabled:opacity-60"
                >
                  Enable
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
