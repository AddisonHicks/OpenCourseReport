import type { TransportMode } from '../types'

interface TransportToggleProps {
  value: TransportMode | null
  onChange: (mode: TransportMode) => void
}

export function TransportToggle({ value, onChange }: TransportToggleProps) {
  return (
    <div className="flex rounded-lg border border-green-pale bg-white p-1">
      <button
        type="button"
        onClick={() => onChange('walking')}
        className={`min-h-11 flex-1 rounded-md px-3 text-sm font-semibold transition-colors ${
          value === 'walking'
            ? 'bg-green-dark text-sand'
            : 'text-green-dark active:bg-green-pale/50'
        }`}
      >
        🚶 Walking
      </button>
      <button
        type="button"
        onClick={() => onChange('cart')}
        className={`min-h-11 flex-1 rounded-md px-3 text-sm font-semibold transition-colors ${
          value === 'cart'
            ? 'bg-green-dark text-sand'
            : 'text-green-dark active:bg-green-pale/50'
        }`}
      >
        🛺 Cart
      </button>
    </div>
  )
}
