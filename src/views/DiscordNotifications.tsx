import { Link } from 'react-router-dom'
import { DiscordWebhookSignup } from '../components/DiscordWebhookSignup'

export function DiscordNotifications() {
  return (
    <div>
      <p className="mb-4 text-sm">
        <Link to="/about" className="text-link min-h-11 inline-flex items-center">
          ← Back to About
        </Link>
      </p>

      <h1 className="mb-2 font-display text-3xl font-bold text-green-dark">
        Discord notifications
      </h1>
      <p className="mb-6 text-green-dark/80">
        Register a Discord webhook so new course condition reports in your area
        are posted automatically — no bot hosting required.
      </p>

      <DiscordWebhookSignup />
    </div>
  )
}
