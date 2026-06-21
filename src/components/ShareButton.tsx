import { useToast } from '../context/ToastContext'
import { shareLink, shareResultMessage } from '../lib/share'

interface ShareButtonProps {
  url: string
  title?: string
  text?: string
  label?: string
  className?: string
}

const defaultClassName =
  'min-h-11 rounded-lg border border-green-mid/40 px-4 py-2 font-body text-sm font-semibold text-green-mid active:bg-green-pale'

export function ShareButton({
  url,
  title,
  text,
  label = 'Share',
  className = defaultClassName,
}: ShareButtonProps) {
  const { showToast } = useToast()

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const result = await shareLink({ url, title, text })
    const message = shareResultMessage(result)
    if (message) showToast(message)
  }

  return (
    <button type="button" onClick={(e) => void handleShare(e)} className={className}>
      {label}
    </button>
  )
}
