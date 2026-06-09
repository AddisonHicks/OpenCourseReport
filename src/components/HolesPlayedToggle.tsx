import type { HolesPlayed } from '../types'

interface HolesPlayedToggleProps {
  value: HolesPlayed | null
  onChange: (holes: HolesPlayed) => void
}

const optionClass = (selected: boolean) =>
  `h-full min-w-0 flex-1 rounded-md px-1 text-xs font-semibold transition-colors sm:px-2 sm:text-sm ${
    selected
      ? 'bg-green-dark text-sand'
      : 'text-green-dark active:bg-green-pale/50'
  }`

export function HolesPlayedToggle({ value, onChange }: HolesPlayedToggleProps) {
  return (
    <div className="flex h-11 rounded-lg border border-green-pale bg-white p-1 shadow-sm">
      <button
        type="button"
        onClick={() => onChange(9)}
        className={optionClass(value === 9)}
      >
        9 Holes
      </button>
      <button
        type="button"
        onClick={() => onChange(18)}
        className={optionClass(value === 18)}
      >
        18 Holes
      </button>
    </div>
  )
}
