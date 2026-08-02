export function isValidDiscordWebhookUrl(url: string): boolean {
  try {
    const parsed = new URL(url.trim())
    if (parsed.protocol !== 'https:') return false
    const host = parsed.hostname.toLowerCase()
    if (host !== 'discord.com' && host !== 'discordapp.com') return false
    return /^\/api\/webhooks\/\d+\/[\w-]+\/?$/.test(parsed.pathname)
  } catch {
    return false
  }
}

export function normalizeThreadId(value: string | null | undefined): string | null {
  if (!value?.trim()) return null
  const id = value.trim()
  return /^\d{17,20}$/.test(id) ? id : null
}

export function buildWebhookExecuteUrl(
  webhookUrl: string,
  threadId: string | null,
): string {
  const url = new URL(webhookUrl.trim())
  url.searchParams.set('wait', 'true')
  // Required for incoming (non-app) webhooks to honor link buttons / components
  url.searchParams.set('with_components', 'true')
  if (threadId) url.searchParams.set('thread_id', threadId)
  return url.toString()
}
