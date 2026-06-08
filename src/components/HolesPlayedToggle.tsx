import type { HolesPlayed } from '../types'

interface HolesPlayedToggleProps {
  value: HolesPlayed
  onChange: (holes: HolesPlayed) => void
}

export function HolesPlayedToggle({ value, onChange }: HolesPlayedToggleProps) {
  return (
    <div className="flex rounded-lg border border-green-pale bg-white p-1">
      <button
        type="button"
        onClick={() => onChange(9)}
        className={`min-h-11 min-w-0 flex-1 rounded-md px-1 text-xs font-semibold transition-colors sm:px-2 sm:text-sm ${
          value === 9
            ? 'bg-green-dark text-sand'
            : 'text-green-dark active:bg-green-pale/50'
        }`}
      >
        9 Holes
      </button>
      <button
        type="button"
        onClick={() => onChange(18)}
        className={`min-h-11 min-w-0 flex-1 rounded-md px-1 text-xs font-semibold transition-colors sm:px-2 sm:text-sm ${
          value === 18
            ? 'bg-green-dark text-sand'
            : 'text-green-dark active:bg-green-pale/50'
        }`}
      >
        18 Holes
      </button>
    </div>
  )
}
