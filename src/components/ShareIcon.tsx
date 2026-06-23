interface ShareIconProps {
  className?: string
}

export function ShareIcon({ className = 'h-4 w-4' }: ShareIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M12 21V11M12 11L8 15M12 11L16 15"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M20 8.5V6.8C20 5.12 20 4.28 19.673 3.64C19.385 3.07 18.927 2.61 18.362 2.33C17.72 2 16.88 2 15.2 2H8.8C7.12 2 6.28 2 5.638 2.33C5.074 2.61 4.615 3.07 4.327 3.64C4 4.28 4 5.12 4 6.8V8.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  )
}
