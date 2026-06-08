import { Link, useLocation } from 'react-router-dom'

export function SiteHeader() {
  const { pathname } = useLocation()
  const isHome = pathname === '/'

  return (
    <header
      className={`bg-green-dark text-sand ${isHome ? 'pb-8 pt-6' : 'py-4'}`}
    >
      <div className="mx-auto max-w-lg px-4">
      <Link
        to="/"
        className={`block font-display font-bold leading-tight text-sand no-underline active:text-sand/80 ${
          isHome ? 'text-3xl' : 'text-xl'
        }`}
      >
        OpenCourse Report
      </Link>
      {isHome && (
        <p className="mt-1 font-display text-sm leading-snug text-sand/85">
          Real course conditions submitted by real golfers
        </p>
      )}
      </div>
    </header>
  )
}
