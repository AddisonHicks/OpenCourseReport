import { useCallback, useEffect, useRef, useState } from 'react'
import { setUserZipcode } from '../lib/localStorage'
import {
  detectZipFromGeolocation,
  geolocationZipErrorMessage,
  isValidZip,
  isZipFormatValid,
  normalizeZip,
} from '../lib/zipcode'

interface UserAreaZipProps {
  userZip: string | null
  onZipChange: (zip: string | null) => void
}

export function UserAreaZip({ userZip, onZipChange }: UserAreaZipProps) {
  const [editing, setEditing] = useState(() => !userZip)
  const [input, setInput] = useState(() => userZip ?? '')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [detecting, setDetecting] = useState(false)
  const autoDetectAttempted = useRef(false)

  const applyZip = useCallback(
    (zip: string) => {
      setUserZipcode(zip)
      setInput(zip)
      setError('')
      setEditing(false)
      onZipChange(zip)
    },
    [onZipChange],
  )

  const detectLocation = useCallback(async () => {
    setDetecting(true)
    setError('')
    const result = await detectZipFromGeolocation()
    setDetecting(false)

    if (result.zip) {
      applyZip(result.zip)
      return
    }

    setError(geolocationZipErrorMessage(result.error ?? 'unavailable'))
  }, [applyZip])

  useEffect(() => {
    if (userZip || autoDetectAttempted.current) return
    autoDetectAttempted.current = true
    void detectLocation()
  }, [userZip, detectLocation])

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
    applyZip(normalized)
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
          className="text-link"
        >
          Change
        </button>
      </p>
    )
  }

  return (
    <div className="mb-3">
      <p className="mb-2 font-body text-sm text-green-dark/70">
        {detecting
          ? 'Detecting your location…'
          : 'Enter your zip code or use your location to see reports near you.'}
      </p>
      <div className="flex flex-wrap gap-2">
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
          disabled={detecting}
          className="min-h-11 w-28 rounded-lg border-0 bg-white px-3 py-3 font-body text-base text-green-dark shadow-sm focus:outline-none focus:ring-2 focus:ring-green-mid/40 disabled:opacity-60"
        />
        <button
          type="button"
          onClick={() => void save()}
          disabled={saving || detecting}
          className="min-h-11 rounded-lg bg-green-dark px-4 py-2 font-body text-sm font-semibold text-sand disabled:opacity-60"
        >
          {saving ? '…' : 'Save'}
        </button>
        <button
          type="button"
          onClick={() => void detectLocation()}
          disabled={detecting || saving}
          className="min-h-11 rounded-lg border border-green-dark/20 bg-white px-4 py-2 font-body text-sm font-semibold text-green-dark disabled:opacity-60"
        >
          {detecting ? 'Detecting…' : 'Use my location'}
        </button>
        {userZip && (
          <button
            type="button"
            onClick={() => {
              setEditing(false)
              setInput(userZip)
              setError('')
            }}
            disabled={detecting}
            className="min-h-11 px-2 font-body text-sm font-semibold text-green-mid disabled:opacity-60"
          >
            Cancel
          </button>
        )}
      </div>
      {error && <p className="mt-1 font-body text-sm text-gold">{error}</p>}
    </div>
  )
}
