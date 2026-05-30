'use client'

import { Share2 } from 'lucide-react'

type Props = {
  poiName: string
  poiUrl: string
}

export function HeroShareButton({ poiName, poiUrl }: Props) {
  async function handleShare() {
    const absoluteUrl = poiUrl.startsWith('http')
      ? poiUrl
      : typeof window !== 'undefined'
        ? new URL(poiUrl, window.location.origin).toString()
        : poiUrl

    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({ title: poiName, url: absoluteUrl })
        return
      } catch {
        // User cancelled or share unsupported — fall through to clipboard
      }
    }

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      try {
        await navigator.clipboard.writeText(absoluteUrl)
      } catch {
        // ignore
      }
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      aria-label="Partager"
      data-testid="btn-share"
      className="flex h-11 w-11 items-center justify-center rounded-full bg-white/85 backdrop-blur text-charcoal shadow-sm transition-transform active:scale-95"
    >
      <Share2 className="h-5 w-5" />
    </button>
  )
}
