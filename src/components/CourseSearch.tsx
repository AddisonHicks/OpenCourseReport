import { useCallback, useEffect, useRef, useState } from 'react'
import { searchCourses, formatCourseLocation } from '../lib/courses'
import type { Course } from '../types'

interface CourseSearchProps {
  value: Course | null
  onSelect: (course: Course) => void
  onClear?: () => void
  onQueryChange?: (query: string) => void
  placeholder?: string
  label?: string
}

export function CourseSearch({
  value,
  onSelect,
  onClear,
  onQueryChange,
  placeholder = 'Search courses…',
  label = 'Course Name',
}: CourseSearchProps) {
  const [query, setQuery] = useState(value?.course_name ?? '')
  const [results, setResults] = useState<Course[]>([])
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const wrapRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) setQuery(value.course_name)
  }, [value])

  useEffect(() => {
    const q = query.trim()
    if (q.length < 3 || (value && value.course_name === q)) {
      setResults([])
      return
    }

    const t = window.setTimeout(async () => {
      setLoading(true)
      const found = await searchCourses(q)
      setResults(found)
      setLoading(false)
      setOpen(true)
    }, 250)

    return () => window.clearTimeout(t)
  }, [query, value])

  useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const pick = useCallback(
    (course: Course) => {
      onSelect(course)
      setQuery(course.course_name)
      setOpen(false)
      setResults([])
    },
    [onSelect],
  )

  const handleChange = (v: string) => {
    setQuery(v)
    onQueryChange?.(v)
    if (value && v !== value.course_name) {
      onClear?.()
    }
  }

  return (
    <div ref={wrapRef} className="relative">
      <label className="mb-1 block font-display text-base text-green-dark">
        {label}
      </label>
      <input
        type="text"
        value={query}
        onChange={(e) => handleChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder={placeholder}
        autoComplete="off"
        className="min-h-11 w-full rounded-lg border-0 bg-white px-4 py-3 text-base text-green-dark shadow-sm placeholder:text-green-dark/40 focus:outline-none focus:ring-2 focus:ring-green-mid/40"
      />
      {loading && (
        <span className="absolute right-3 top-10 text-xs text-green-dark/50">
          …
        </span>
      )}
      {open && results.length > 0 && (
        <ul
          className="absolute z-30 mt-1 max-h-64 w-full overflow-auto rounded-lg border border-green-pale bg-white shadow-lg"
          role="listbox"
        >
          {results.map((c) => (
            <li key={c.id}>
              <button
                type="button"
                role="option"
                onClick={() => pick(c)}
                className="min-h-11 w-full border-b border-green-pale/50 px-4 py-3 text-left last:border-0 active:bg-green-pale/50"
              >
                <div className="font-semibold text-green-dark">
                  {c.course_name}
                </div>
                <div className="text-sm text-green-dark/60">
                  {formatCourseLocation(c)}
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
