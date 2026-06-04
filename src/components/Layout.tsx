import { Outlet, useLocation } from 'react-router-dom'
import { BottomNav } from './BottomNav'

const HIDE_NAV_PREFIXES = ['/embed/', '/report/']

export function Layout() {
  const { pathname } = useLocation()
  const hideNav = HIDE_NAV_PREFIXES.some((p) => pathname.startsWith(p))

  return (
    <div className="min-h-dvh bg-sand">
      <main
        className={`mx-auto max-w-lg px-4 ${hideNav ? 'pb-6 pt-6' : 'pb-24 pt-4'}`}
      >
        <Outlet />
      </main>
      {!hideNav && <BottomNav />}
    </div>
  )
}
