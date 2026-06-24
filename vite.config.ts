import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'
import { resolveSupabaseConfig } from './lib/supabaseEnv'

function ogMetaPlugin(siteUrl: string, supabaseUrl: string): Plugin {
  const base = supabaseUrl.replace(/\/$/, '')
  const storageBase = base
    ? `${base}/storage/v1/object/public/share-og`
    : ''
  const ogHome = `${storageBase}/og-home.png`
  const ogCourse = `${storageBase}/og-course.png`
  const ogReport = `${storageBase}/og-report.png`

  return {
    name: 'og-meta-inject',
    transformIndexHtml(html) {
      return html
        .replaceAll('__SITE_URL__', siteUrl)
        .replaceAll('__OG_IMAGE_HOME__', ogHome)
        .replaceAll('__OG_IMAGE_COURSE__', ogCourse)
        .replaceAll('__OG_IMAGE_REPORT__', ogReport)
    },
  }
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const supabaseUrl =
    env.VITE_SUPABASE_URL ?? process.env.VITE_SUPABASE_URL ?? ''
  const supabaseCfg = resolveSupabaseConfig({
    ...env,
    VITE_SUPABASE_URL: supabaseUrl,
  })
  const supabaseKey = supabaseCfg?.key ?? ''
  const siteUrl = (
    env.SITE_URL ??
    process.env.SITE_URL ??
    'https://open-course-report.vercel.app'
  ).replace(/\/$/, '')

  if (mode === 'production' && (!supabaseUrl.trim() || !supabaseKey.trim())) {
    throw new Error(
      'Missing VITE_SUPABASE_URL or VITE_SUPABASE_PUBLISHABLE_KEY. ' +
        'Set both in Vercel → Settings → Environment Variables (Production), then redeploy.',
    )
  }

  return {
  plugins: [react(), tailwindcss(), ogMetaPlugin(siteUrl, supabaseUrl)],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  }
})
