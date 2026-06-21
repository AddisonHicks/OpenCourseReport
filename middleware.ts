import { rewrite } from '@vercel/functions'

const CRAWLER_RE =
  /bot|facebookexternalhit|facebot|twitterbot|discordbot|whatsapp|telegrambot|linkedinbot|slackbot|applebot|embedly|pinterest|reddit|preview/i

export const config = {
  matcher: ['/', '/course/:path*', '/report/:path*'],
}

export default function middleware(request: Request) {
  const ua = request.headers.get('user-agent') ?? ''
  if (!CRAWLER_RE.test(ua)) return

  const { pathname } = new URL(request.url)
  const dest = new URL('/api/og', request.url)
  dest.searchParams.set('path', pathname)
  return rewrite(dest)
}
