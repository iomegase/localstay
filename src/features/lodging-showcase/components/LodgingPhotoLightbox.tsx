'use client'

import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

export type LightboxPhoto = { id: string; url: string; alt: string }

/**
 * Spec 091 : photos du logement en plein écran — carrousel scroll-snap (glisser au doigt),
 * boutons et flèches du clavier, fermeture par bouton, Échap ou clic sur le fond.
 */
export function LodgingPhotoLightbox({
  photos,
  startIndex,
  title,
  onClose,
}: {
  photos: LightboxPhoto[]
  startIndex: number
  title: string
  onClose: () => void
}) {
  const [index, setIndex] = useState(startIndex)
  const trackRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)
  const total = photos.length

  const goTo = useCallback((next: number) => {
    const clamped = Math.max(0, Math.min(next, total - 1))
    setIndex(clamped)
    const track = trackRef.current
    if (track?.clientWidth) track.scrollTo({ left: clamped * track.clientWidth, behavior: 'smooth' })
  }, [total])

  // AC-04 : focus sur « Fermer », page figée, focus rendu à la photo cliquée.
  useEffect(() => {
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const track = trackRef.current
    if (track?.clientWidth) track.scrollLeft = startIndex * track.clientWidth
    return () => {
      document.body.style.overflow = overflow
      previous?.focus()
    }
  }, [startIndex])

  // AC-03 : Échap ferme, flèches du clavier pour naviguer.
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') goTo(index + 1)
      if (event.key === 'ArrowLeft') goTo(index - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [goTo, index, onClose])

  const current = photos[index]

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Photos de ${title}`}
      onClick={event => { if (event.target === event.currentTarget) onClose() }}
      className="fixed inset-0 z-[100] flex flex-col bg-slate-950/95 text-white backdrop-blur-sm"
    >
      <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <p className="min-w-0 truncate text-[13px] font-semibold text-white/80">{title}</p>
        <div className="flex shrink-0 items-center gap-3">
          {total > 1 && (
            <span data-testid="lightbox-counter" className="text-[13px] tabular-nums text-white/70">
              {index + 1} / {total}
            </span>
          )}
          <button
            ref={closeRef}
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="grid size-10 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-white"
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="relative min-h-0 flex-1">
        <div
          ref={trackRef}
          data-testid="lightbox-track"
          onScroll={event => {
            const width = event.currentTarget.clientWidth
            if (width) setIndex(Math.round(event.currentTarget.scrollLeft / width))
          }}
          className="flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {photos.map((photo, photoIndex) => (
            <div
              key={photo.id}
              onClick={event => { if (event.target === event.currentTarget) onClose() }}
              className="relative h-full w-full shrink-0 snap-center px-2 sm:px-16"
            >
              <div className="pointer-events-none relative h-full w-full">
                <Image
                  src={photo.url}
                  alt={photo.alt}
                  fill
                  sizes="100vw"
                  loading={Math.abs(photoIndex - startIndex) <= 1 ? 'eager' : 'lazy'}
                  className="object-contain"
                />
              </div>
            </div>
          ))}
        </div>

        {total > 1 && (
          <>
            <button
              type="button"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              aria-label="Photo précédente"
              className="absolute left-3 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20 disabled:opacity-30 sm:grid"
            >
              <ChevronLeft className="size-6" aria-hidden="true" />
            </button>
            <button
              type="button"
              onClick={() => goTo(index + 1)}
              disabled={index === total - 1}
              aria-label="Photo suivante"
              className="absolute right-3 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/10 transition-colors hover:bg-white/20 disabled:opacity-30 sm:grid"
            >
              <ChevronRight className="size-6" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      <p data-testid="lightbox-caption" className="min-h-[52px] px-6 py-4 text-center text-[13px] text-white/70">
        {current?.alt}
      </p>
    </div>,
    document.body,
  )
}
