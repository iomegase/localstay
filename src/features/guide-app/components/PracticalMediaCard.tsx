'use client'

import { useEffect, useState } from 'react'
import { Eye, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { YouTubeEmbed } from '@/shared/components/YouTubeEmbed'
import { extractYouTubeId } from '@/shared/lib/youtube'
import { GuideDarkMarkdown } from '@/features/guide-app/components/GuideDarkMarkdown'

type Props = {
  icon: LucideIcon
  title: string
  description: string
  photoUrl?: string
  videoUrl?: string
}

/**
 * Carte pratique média : texte + bouton « Voir » qui ouvre le média (une photo
 * OU une vidéo) directement dans un modal (cadre blanc 5px). Sans média, la
 * carte reste un simple bloc d'info.
 */
export function PracticalMediaCard({
  icon: Icon,
  title,
  description,
  photoUrl,
  videoUrl,
}: Props) {
  const [open, setOpen] = useState<'photo' | 'video' | null>(null)
  const videoId = videoUrl ? extractYouTubeId(videoUrl) : null
  const hasVideo = Boolean(videoId)
  const hasMedia = Boolean(photoUrl) || hasVideo

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <article className="rounded-[26px] bg-slate-900 p-5 text-white shadow-[0_10px_28px_rgba(15,23,42,0.14)]">
      <div className="flex items-start gap-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-white">
          <Icon className="h-4 w-4" />
        </span>
        <div className="min-w-0">
          <h2 className="text-sm font-semibold leading-9 text-white">{title}</h2>
          <div className="mt-1">
            <GuideDarkMarkdown source={description} />
          </div>
        </div>
      </div>

      {hasMedia && (
        <div className="mt-3 flex justify-end">
          <button
            type="button"
            aria-label={`Voir — ${title}`}
            onClick={() => setOpen(hasVideo ? 'video' : 'photo')}
            className="inline-flex shrink-0 items-center gap-2 rounded-full bg-white py-1 pl-1 pr-3 text-[9px] font-bold uppercase tracking-[0.12em] text-pink-600 shadow-[0_7px_16px_rgba(17,24,39,0.14)] transition-transform active:scale-[0.98]"
          >
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-pink-600 text-white">
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            </span>
            Voir
          </button>
        </div>
      )}

      {open && (
        <div
          className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
          onClick={() => setOpen(null)}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={title}
            data-testid="media-modal-frame"
            onClick={event => event.stopPropagation()}
            className="relative w-full max-w-[420px] overflow-hidden rounded-[24px] border-[5px] border-white bg-black shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
          >
            <button
              type="button"
              onClick={() => setOpen(null)}
              aria-label="Fermer"
              className="absolute right-2 top-2 z-10 grid h-9 w-9 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
            >
              <X className="h-4 w-4" />
            </button>

            {open === 'photo' && photoUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={photoUrl}
                alt={title}
                className="max-h-[70vh] w-full object-contain"
              />
            )}
            {open === 'video' && videoUrl && (
              <YouTubeEmbed url={videoUrl} title={title} />
            )}
          </div>
        </div>
      )}
    </article>
  )
}
