interface FieldLabelProps {
  children: React.ReactNode
  required?: boolean
  className?: string
}

export function FieldLabel({
  children,
  required = false,
  className = 'mb-1 block font-display text-base text-green-dark',
}: FieldLabelProps) {
  return (
    <label className={`${className}${required ? ' whitespace-nowrap' : ''}`}>
      {children}
      {required && (
        <span className="text-green-mid" aria-hidden="true">
          {' '}
          *
        </span>
      )}
    </label>
  )
}
