'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Video, X } from 'lucide-react'
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
        className="flex w-full items-center justify-between rounded-[22px] bg-slate-900 px-5 py-4 text-left text-white"
      >
        <span className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-violet-600">
            <Video className="h-4 w-4" aria-hidden="true" />
          </span>
          <span>
            <span className="block text-sm font-semibold">
              Voir la vidéo du logement
            </span>
            <span className="mt-0.5 block text-[10px] text-white/60">
              Découvrez votre logement en vidéo
            </span>
          </span>
        </span>
        <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </button>

      {open && (
        <div
          data-testid="lodging-video-backdrop"
          className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70 p-5 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-label="Vidéo du logement"
            onClick={event => event.stopPropagation()}
            className="w-full max-w-[390px] overflow-hidden rounded-[24px] bg-white p-3 shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
          >
            <div className="mb-3 flex items-center justify-between gap-3 px-1">
              <h2 className="text-base font-semibold text-slate-900">
                Vidéo du logement
              </h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Fermer"
                className="inline-flex items-center gap-1 rounded-full px-3 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100"
              >
                <X className="h-4 w-4" aria-hidden="true" />
                Fermer
              </button>
            </div>
            <YouTubeEmbed
              url={url}
              title="Vidéo du logement"
              className="rounded-[16px]"
            />
          </section>
        </div>
      )}
    </>
  )
}
