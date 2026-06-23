import { Link } from 'react-router-dom'

const GITHUB_URL = 'https://github.com/AddisonHicks/OpenCourseReport'

export function About() {
  return (
    <div>
      <h1 className="mb-2 font-display text-3xl font-bold text-green-dark">
        OpenCourseReport
      </h1>
      <p className="mb-6 text-lg text-green-mid">
        Crowdsourced golf course conditions, by golfers for golfers.
      </p>

      <p className="mb-6 leading-relaxed text-green-dark/90">
        OpenCourseReport is a free, open-source platform where you can read and
        share real-time reports on greens speed, fairway conditions, pace of
        play, fees, and more — before you book your tee time. Every report helps
        the next foursome play smarter.
      </p>

      <div className="mb-6 rounded-xl border-2 border-green-mid/30 bg-white p-4">
        <p className="font-display text-lg font-bold text-green-dark">
          No login required
        </p>
        <p className="mt-1 text-sm text-green-dark/70">
          Submit and browse reports instantly. Your browser remembers recent
          courses and votes — nothing else is stored on our servers about you.
        </p>
      </div>

      <p className="mb-4 text-sm">
        <Link
          to="/courses"
          className="text-link min-h-11 inline-flex items-center"
        >
          Browse all courses by state
        </Link>
      </p>

      <p className="mb-4 text-sm">
        <Link
          to="/add-course"
          className="text-link min-h-11 inline-flex items-center"
        >
          Add a course to the database
        </Link>
      </p>

      <p className="mb-4 text-sm">
        <a
          href={GITHUB_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-link min-h-11 inline-flex items-center"
        >
          View on GitHub
        </a>
      </p>

      <p className="text-xs text-green-dark/50">
        OpenCourseReport is open source under the MIT License.
      </p>
    </div>
  )
}
