'use client'

import { useEffect, useRef, useState } from 'react'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { ShortVideoPlayer } from './ShortVideoPlayer'

export type LightboxContent =
  | { kind: 'photos'; photos: string[]; startIndex: number }
  | { kind: 'video'; url: string }

// Déplacement minimal (px) pour qu'un glisser change de photo.
const SWIPE_THRESHOLD_PX = 40

/**
 * Modal média, contenu dans l'écran du guide. Mode photos = carrousel
 * scroll-snap : glisser au doigt (natif) ou à la souris, flèches clavier et
 * boutons (masqués sur écran tactile) ; mode vidéo = lecteur YouTube.
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
  const [dragging, setDragging] = useState(false)
  const indexRef = useRef(index)
  indexRef.current = index
  // Un glisser qui se termine hors du cadre ne doit pas fermer la modal.
  const suppressCloseRef = useRef(false)

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose()
      if (event.key === 'ArrowRight') goTo(indexRef.current + 1)
      if (event.key === 'ArrowLeft') goTo(indexRef.current - 1)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
    // goTo ne lit que des refs et l'état courant via indexRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onClose])

  // Positionne le carrousel sur la photo cliquée à l'ouverture.
  useEffect(() => {
    if (content.kind !== 'photos') return
    const el = scrollRef.current
    if (el) el.scrollLeft = content.startIndex * el.clientWidth
  }, [content])

  function goTo(next: number) {
    const el = scrollRef.current
    if (!el || photoCount === 0) return
    const clamped = Math.max(0, Math.min(next, photoCount - 1))
    el.scrollTo({ left: clamped * el.clientWidth, behavior: 'smooth' })
    setIndex(clamped)
  }

  // Glisser à la souris (le tactile utilise le défilement natif).
  function startMouseDrag(event: React.MouseEvent<HTMLDivElement>) {
    const el = scrollRef.current
    if (!el || event.button !== 0 || photoCount < 2) return
    event.preventDefault()
    const startX = event.clientX
    const startScroll = el.scrollLeft
    const startIndex = indexRef.current
    setDragging(true)

    function onMove(move: MouseEvent) {
      if (el) el.scrollLeft = startScroll - (move.clientX - startX)
    }
    function onUp(up: MouseEvent) {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
      setDragging(false)
      const delta = up.clientX - startX
      if (Math.abs(delta) > 5) suppressCloseRef.current = true
      if (delta <= -SWIPE_THRESHOLD_PX) goTo(startIndex + 1)
      else if (delta >= SWIPE_THRESHOLD_PX) goTo(startIndex - 1)
      else goTo(startIndex)
    }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      onClick={() => {
        if (suppressCloseRef.current) {
          suppressCloseRef.current = false
          return
        }
        onClose()
      }}
      className="absolute inset-0 z-[100] flex items-center justify-center bg-black/60 p-6 backdrop-blur-xl"
    >
      <div
        data-testid="media-modal-frame"
        onClick={event => event.stopPropagation()}
        className={`relative w-full overflow-hidden rounded-[24px] bg-black shadow-[0_24px_60px_rgba(0,0,0,0.5)] ${
          content.kind === 'video' ? 'max-w-[340px]' : 'max-w-[420px]'
        }`}
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
          <ShortVideoPlayer url={content.url} />
        ) : (
          <>
            <div
              ref={scrollRef}
              data-testid="media-lightbox-track"
              onMouseDown={startMouseDrag}
              onScroll={event => {
                if (dragging || !event.currentTarget.clientWidth) return
                setIndex(Math.round(event.currentTarget.scrollLeft / event.currentTarget.clientWidth))
              }}
              className={`no-scrollbar flex overflow-x-auto overscroll-x-contain ${
                photoCount > 1 ? 'cursor-grab' : ''
              } ${dragging ? 'cursor-grabbing select-none' : 'snap-x snap-mandatory'}`}
            >
              {content.photos.map((src, i) => (
                <div key={i} className="w-full shrink-0 snap-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={src}
                    alt={`${title} — photo ${i + 1}`}
                    draggable={false}
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
                  className="absolute left-2 top-1/2 z-10 hidden [@media(pointer:fine)]:grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  type="button"
                  onClick={() => goTo(index + 1)}
                  aria-label="Photo suivante"
                  className="absolute right-2 top-1/2 z-10 hidden [@media(pointer:fine)]:grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-black/50 text-white backdrop-blur transition-colors hover:bg-black/70"
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
