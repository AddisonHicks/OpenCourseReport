import { createClient } from '@supabase/supabase-js'
import { resolveSupabaseConfig } from '../../lib/supabaseEnv'

const cfg = resolveSupabaseConfig({
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
  VITE_SUPABASE_PUBLISHABLE_KEY: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY,
})

if (!cfg) {
  console.warn(
    'OpenCourseReport: Set VITE_SUPABASE_URL and VITE_SUPABASE_PUBLISHABLE_KEY in .env.local',
  )
}

export const supabase = createClient(
  cfg?.url ?? 'https://placeholder.supabase.co',
  cfg?.key ?? 'placeholder-key',
)
