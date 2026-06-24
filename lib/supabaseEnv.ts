/** Resolve Supabase URL + publishable API key from process or Vite env. */
export function resolveSupabaseConfig(
  env: Record<string, string | undefined>,
): { url: string; key: string } | null {
  const url = (env.SUPABASE_URL ?? env.VITE_SUPABASE_URL ?? '').replace(/\/$/, '')
  const key =
    env.SUPABASE_PUBLISHABLE_KEY ??
    env.VITE_SUPABASE_PUBLISHABLE_KEY ??
    env.SUPABASE_ANON_KEY ??
    env.VITE_SUPABASE_ANON_KEY ??
    ''
  if (!url || !key) return null
  return { url, key }
}
