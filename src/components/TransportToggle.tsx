import type { TransportMode } from '../types'

interface TransportToggleProps {
  value: TransportMode | null
  onChange: (mode: TransportMode) => void
}

const optionClass = (selected: boolean) =>
  `h-full min-w-0 flex-1 rounded-md px-1.5 text-xs font-semibold transition-colors sm:px-2 sm:text-sm ${
    selected
      ? 'bg-green-dark text-sand'
      : 'text-green-dark active:bg-green-pale/50'
  }`

export function TransportToggle({ value, onChange }: TransportToggleProps) {
  return (
    <div className="flex h-11 rounded-lg border border-green-pale bg-white p-1 shadow-sm">
      <button
        type="button"
        onClick={() => onChange('walking')}
        className={optionClass(value === 'walking')}
      >
        Walk
      </button>
      <button
        type="button"
        onClick={() => onChange('cart')}
        className={optionClass(value === 'cart')}
      >
        Cart
      </button>
    </div>
  )
}
