import { useState } from 'react'
import { setUserZipcode } from '../lib/localStorage'
import { isValidZip, isZipFormatValid, normalizeZip } from '../lib/zipcode'

interface UserAreaZipProps {
  userZip: string | null
  onZipChange: (zip: string | null) => void
}

export function UserAreaZip({ userZip, onZipChange }: UserAreaZipProps) {
  const [editing, setEditing] = useState(() => !userZip)
  const [input, setInput] = useState(() => userZip ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    const normalized = normalizeZip(input)
    if (!isZipFormatValid(normalized)) {
      setError('Enter a valid 5-digit US zip code.')
      return
    }
    setSaving(true)
    const valid = await isValidZip(normalized)
    setSaving(false)
    if (!valid) {
      setError('Enter a valid US zip code.')
      return
    }
    setUserZipcode(normalized)
    setError('')
    setEditing(false)
    onZipChange(normalized)
  }

  if (!editing && userZip) {
    return (
      <p className="mb-3 font-body text-sm text-green-dark/70">
        Showing reports within 75 miles of{' '}
        <span className="font-semibold text-green-dark">{userZip}</span>
        {' · '}
        <button
          type="button"
          onClick={() => {
            setInput(userZip)
            setEditing(true)
            setError('')
          }}
          className="font-semibold text-green-mid underline"
        >
          Change
        </button>
      </p>
    )
  }

  return (
    <div className="mb-3">
      <p className="mb-2 font-body text-sm text-green-dark/70">
        Enter your zip code to see reports near you.
      </p>
      <div className="flex gap-2">
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength={5}
          value={input}
          onChange={(e) => {
            setInput(e.target.value.replace(/\D/g, '').slice(0, 5))
            setError('')
          }}
          placeholder="Zip code"
          className="min-h-11 w-28 rounded-lg border-0 bg-white px-3 py-3 font-body text-base text-green-dark shadow-sm focus:outline-none focus:ring-2 focus:ring-green-mid/40"
        />
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving}
          className="min-h-11 rounded-lg bg-green-dark px-4 py-2 font-body text-sm font-semibold text-sand disabled:opacity-60"
        >
          {saving ? '…' : 'Save'}
        </button>
        {userZip && (
          <button
            type="button"
            onClick={() => {
              setEditing(false)
              setInput(userZip)
              setError('')
            }}
            className="min-h-11 px-2 font-body text-sm font-semibold text-green-mid"
          >
            Cancel
          </button>
        )}
      </div>
      {error && <p className="mt-1 font-body text-sm text-gold">{error}</p>}
    </div>
  )
}
