'use client'

import { useEffect, useState } from 'react'
import { Play, RotateCcw, Images, X } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { YouTubeEmbed } from '@/shared/components/YouTubeEmbed'
import { extractYouTubeId, youTubeThumbnailUrl } from '@/shared/lib/youtube'

type Props = {
  icon: LucideIcon
  title: string
  description: string
  photoUrl?: string
  videoUrl?: string
}

const thumbClass =
  'group relative h-20 w-28 shrink-0 overflow-hidden rounded-2xl border border-white/15 bg-white/5 transition-transform active:scale-95'

/**
 * Carte pratique média : recto texte, verso vignettes photo/vidéo (flip). Un
 * clic sur une vignette ouvre le média dans un modal (cadre blanc 5px). Sans
 * média, la carte reste un simple bloc d'info (pas de flip).
 */
export function PracticalMediaCard({
  icon: Icon,
  title,
  description,
  photoUrl,
  videoUrl,
}: Props) {
  const [open, setOpen] = useState<'photo' | 'video' | null>(null)
  const [flipped, setFlipped] = useState(false)
  const videoId = videoUrl ? extractYouTubeId(videoUrl) : null
  const hasPhoto = Boolean(photoUrl)
  const hasVideo = Boolean(videoId)
  const hasMedia = hasPhoto || hasVideo

  useEffect(() => {
    if (!open) return
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  const header = (
    <div className="flex items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-white/10 text-white">
        <Icon className="h-4 w-4" />
      </span>
      <div>
        <h2 className="text-sm font-semibold leading-9 text-white">{title}</h2>
        <p className="mt-1 text-xs leading-5 text-white/60">{description}</p>
      </div>
    </div>
  )

  const thumbnails = (
    <div className="flex gap-3">
      {hasPhoto && photoUrl && (
        <button
          type="button"
          onClick={() => setOpen('photo')}
          aria-label={`Voir la photo — ${title}`}
          className={thumbClass}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photoUrl} alt="" className="h-full w-full object-cover" />
        </button>
      )}
      {hasVideo && videoId && (
        <button
          type="button"
          onClick={() => setOpen('video')}
          aria-label={`Voir la vidéo — ${title}`}
          className={thumbClass}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={youTubeThumbnailUrl(videoId)}
            alt=""
            className="h-full w-full object-cover"
          />
          <span className="absolute inset-0 grid place-items-center bg-black/30">
            <span className="grid h-9 w-9 place-items-center rounded-full bg-white/95 text-slate-900">
              <Play className="h-4 w-4 translate-x-0.5 fill-current" aria-hidden="true" />
            </span>
          </span>
        </button>
      )}
    </div>
  )

  return (
    <article className="rounded-[26px] bg-slate-900 p-5 text-white shadow-[0_10px_28px_rgba(15,23,42,0.14)]">
      {hasMedia ? (
        <div className="[perspective:1200px]">
          <div
            className={`grid transition-transform duration-500 [transform-style:preserve-3d] ${
              flipped ? '[transform:rotateY(180deg)]' : ''
            }`}
          >
            {/* Recto : texte */}
            <div className="[grid-area:1/1] [backface-visibility:hidden]">
              {header}
              <button
                type="button"
                aria-pressed={flipped}
                aria-label={`Voir les médias — ${title}`}
                onClick={() => setFlipped(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-[11px] font-semibold uppercase tracking-widest text-white transition-colors hover:bg-white/15"
              >
                <Images className="h-4 w-4" aria-hidden="true" />
                Voir les médias
              </button>
            </div>

            {/* Verso : vignettes */}
            <div className="[grid-area:1/1] [backface-visibility:hidden] [transform:rotateY(180deg)]">
              <div className="flex items-center justify-between gap-3">
                <h2 className="text-sm font-semibold text-white">{title}</h2>
                <button
                  type="button"
                  onClick={() => setFlipped(false)}
                  aria-label="Retour"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-white transition-colors hover:bg-white/15"
                >
                  <RotateCcw className="h-3.5 w-3.5" aria-hidden="true" />
                  Retour
                </button>
              </div>
              <div className="mt-4">{thumbnails}</div>
            </div>
          </div>
        </div>
      ) : (
        header
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
