import { useState } from 'react'
import { useToast } from '../context/ToastContext'

interface EmbedSnippetProps {
  courseId: string
}

export function EmbedSnippet({ courseId }: EmbedSnippetProps) {
  const [open, setOpen] = useState(false)
  const { showToast } = useToast()
  const origin = typeof window !== 'undefined' ? window.location.origin : ''
  const snippet = `<iframe src="${origin}/embed/${courseId}" width="100%" height="400" frameborder="0" title="OpenCourseReport course conditions"></iframe>`

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(snippet)
      showToast('Embed code copied!')
    } catch {
      showToast('Could not copy — select and copy manually')
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="min-h-11 w-full rounded-lg border border-green-pale bg-white px-4 py-3 text-sm font-semibold text-green-dark active:bg-green-pale/40"
      >
        {open ? 'Hide Embed Widget' : 'Embed Widget'}
      </button>
      {open && (
        <div className="mt-2 rounded-lg border border-green-pale bg-white p-3">
          <pre className="mb-2 overflow-x-auto whitespace-pre-wrap break-all text-xs text-green-dark/80">
            {snippet}
          </pre>
          <button
            type="button"
            onClick={() => void copy()}
            className="min-h-11 w-full rounded-lg bg-gold/20 px-4 py-2 text-sm font-semibold text-green-dark active:bg-gold/30"
          >
            Copy iframe code
          </button>
        </div>
      )}
    </div>
  )
}
