'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { YouTubeEmbed } from '@/shared/components/YouTubeEmbed'

export type LightboxContent =
  | { kind: 'photos'; photos: string[]; startIndex: number }
  | { kind: 'video'; url: string }

/**
 * Modal média (cadre blanc 5px), contenu dans l'écran du guide. Mode photos =
 * carrousel scroll-snap (swipe natif) + flèches ; mode vidéo = lecteur YouTube.
 */
export function MediaLightbox({
  title,
  content,
  onClose,
}: {
  title: string
  content: LightboxContent
  onClose: () => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const photoCount = content.kind === 'photos' ? content.photos.length : 0
  const [index, setIndex] = useState(
    content.kind === 'photos' ? content.startIndex : 0,
  )

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  // Positionne le carrousel sur la photo cliquée à l'ouverture.
  useEffect(() => {
    if (content.kind !== 'photos') return
    const el = scrollRef.current
    if (el) el.scrollLeft = content.startIndex * el.clientWidth
  }, [content])

  function goTo(next: number) {
    const el = scrollRef.current
    if (!el) return
    const clamped = Math.max(0, Math.min(next, photoCount - 1))
    el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' })
    setIndex(clamped)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={onClose}
      className="absolute inset-0 z-[100] flex items-center justify-center bg-black/70 p-6 backdrop-blur-sm"
    >
      <div
        data-testid="media-modal-frame"
        onClick={event => event.stopPropagation()}
        className="relative w-full max-w-[420px] overflow-hidden rounded-[24px] border-[5px] border-white bg-black shadow-[0_24px_60px_rgba(0,0,0,0.5)]"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-2 top-2 z-20 grid h-9 w-9 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
        >
          <X className="h-4 w-4" />
        </button>

        {content.kind === 'video' ? (
          <YouTubeEmbed url={content.url} title={title} />
        ) : (
          <>
            <div
              ref={scrollRef}
              onScroll={event =>
                setIndex(
                  Math.round(
                    event.currentTarget.scrollLeft /
                      (event.currentTarget.clientWidth || 1),
                  ),
                )
              }
              className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto"
            >
              {content.photos.map((src, i) => (
                <div key={i} className="w-full shrink-0 snap-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`${title} — photo ${i + 1}`}
                    className="max-h-[70vh] w-full object-contain"
                  />
                </div>
              ))}
            </div>

            {photoCount > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => goTo(index - 1)}
                  aria-label="Photo précédente"
                  className="absolute left-2 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => goTo(index + 1)}
                  aria-label="Photo suivante"
                  className="absolute right-2 top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
                <div className="absolute bottom-2 left-1/2 z-10 -translate-x-1/2 rounded-full bg-black/50 px-2.5 py-1 text-[10px] font-semibold text-white">
                  {index + 1} / {photoCount}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
