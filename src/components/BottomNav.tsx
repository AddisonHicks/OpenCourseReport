import { NavLink } from 'react-router-dom'

const tabs = [
  { to: '/', label: 'Browse', end: true, icon: '⛳' },
  { to: '/nearby-course-list', label: 'Near You', end: true, icon: '📍' },
  { to: '/submit', label: 'Submit', end: false, icon: '✏️' },
  { to: '/about', label: 'About', end: false, icon: 'ℹ️' },
] as const

export function BottomNav() {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 border-t border-green-pale/60 bg-sand pb-[env(safe-area-inset-bottom)]"
      aria-label="Main navigation"
    >
      <div className="mx-auto flex max-w-lg">
        {tabs.map(({ to, label, end, icon }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              `flex min-h-11 flex-1 flex-col items-center justify-center gap-0.5 px-1 py-2 text-xs font-semibold transition-colors ${
                isActive
                  ? 'text-green-mid'
                  : 'text-green-dark/60 hover:text-green-dark'
              }`
            }
          >
            <span className="text-lg" aria-hidden>
              {icon}
            </span>
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
