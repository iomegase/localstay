'use client'

import { useEffect, useState } from 'react'
import { ChevronRight, Video, X } from 'lucide-react'
import { YouTubeEmbed } from '@/shared/components/YouTubeEmbed'
import { extractYouTubeId } from '@/shared/lib/youtube'

export function GuideLodgingVideoButton({ url }: { url?: string }) {
  const [open, setOpen] = useState(false)
  const videoId = url ? extractYouTubeId(url) : null

  useEffect(() => {
    if (!open) return

    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [open])

  if (!videoId || !url) return null

  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setOpen(true)}
        className="flex w-full items-center justify-between rounded-[22px] bg-white shadow-md transition-[transform,box-shadow] duration-200 hover:shadow-sm p-3 text-left tracking-[-0.025em] text-black"
      >
        <span className="flex items-center gap-2.5">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-[16px] bg-[#EEF1F4]">
            <Video className="h-7 w-7 stroke-1 text-black" strokeWidth={1} aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm font-semibold">
             Vidéo du logement
            </span>
            {/* <span className="mt-0.5 block text-[10px] text-black/60">
              Découvrez votre logement en vidéo
            </span> */}
          </span>
        </span>
        <ChevronRight strokeWidth={1} className="h-5 w-5 stroke-1" aria-hidden="true" />
      </button>

      {open && (
        <div
          data-testid="lodging-video-backdrop"
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Vidéo du logement"
            onClick={event => event.stopPropagation()}
            className="relative w-[min(390px,calc((100dvh-40px)*9/16))] overflow-hidden rounded-[24px] bg-black shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
          >
            <h2 className="sr-only">Vidéo du logement</h2>
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Fermer"
              className="absolute right-3 top-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-black/60 text-white transition-colors hover:bg-black/80"
            >
              <X className="h-5 w-5" aria-hidden="true" />
            </button>
            <YouTubeEmbed
              url={url}
              title="Vidéo du logement"
              aspectRatio="portrait"
            />
          </section>
        </div>
      )}
    </>
  )
}
