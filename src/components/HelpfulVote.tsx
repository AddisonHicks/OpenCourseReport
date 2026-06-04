import { useState } from 'react'
import { hasVoted, markVoted } from '../lib/localStorage'
import { incrementHelpfulVote } from '../lib/reports'

interface HelpfulVoteProps {
  reportId: string
  initialCount: number
}

export function HelpfulVote({ reportId, initialCount }: HelpfulVoteProps) {
  const [count, setCount] = useState(initialCount)
  const [voted, setVoted] = useState(() => hasVoted(reportId))
  const [busy, setBusy] = useState(false)

  const handleVote = async () => {
    if (voted || busy) return
    setBusy(true)
    const next = await incrementHelpfulVote(reportId)
    if (next != null) {
      markVoted(reportId)
      setCount(next)
      setVoted(true)
    }
    setBusy(false)
  }

  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation()
        void handleVote()
      }}
      disabled={voted || busy}
      aria-label={voted ? 'You found this helpful' : 'Mark as helpful'}
      className={`inline-flex min-h-11 min-w-11 items-center justify-center gap-1 rounded-lg px-3 text-sm font-medium transition-colors ${
        voted
          ? 'bg-green-pale text-green-dark'
          : 'border border-green-pale bg-white text-green-dark active:bg-green-pale/60'
      }`}
    >
      <span aria-hidden>👍</span>
      <span>{count}</span>
    </button>
  )
}
