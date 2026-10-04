'use client'

import Image from 'next/image'
import { useRef, useState, type ReactNode, type TouchEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { reportDeadPhoto } from '@/features/poi-photos/lib/report-dead-photo'
import { gestureOutcome, resolveGestureIntent, type GestureIntent } from '@/shared/lib/touch-gesture'

interface Props {
  photos: string[]
  name: string
  /** Si fourni, une photo qui échoue au chargement est signalée au serveur (lien-mort). */
  poiId?: string
  /** Si true, flèches et pastilles restent masquées (opacity-0) et n'apparaissent qu'au survol du hero. */
  revealControlsOnHover?: boolean
  /** Variante paysage utilisée par les articles du journal. */
  variant?: 'default' | 'blog'
  /** Spec 060 : glisser au doigt change de photo ; flèches réservées à la souris. */
  swipeable?: boolean
  children?: ReactNode
}

export function PoiDetailHeroCarousel({
  photos,
  name,
  poiId,
  revealControlsOnHover = false,
  variant = 'default',
  swipeable = false,
  children,
}: Props) {
  const [photoIndex, setPhotoIndex] = useState(0)
  const swipeRef = useRef<{ x: number; y: number; startOffsetX: number; intent: GestureIntent | null } | null>(null)
  const [deadPhotos, setDeadPhotos] = useState<Set<string>>(new Set())
  const galleryPhotos = photos.filter(Boolean).filter(url => !deadPhotos.has(url))
  const hasMultiplePhotos = galleryPhotos.length > 1
  const currentPhoto = galleryPhotos[photoIndex] ?? null
  const isBlogVariant = variant === 'blog'
  // Spec 060 AC-01-02 : sur écran tactile, le swipe remplace les flèches.
  const arrowDisplay = swipeable ? 'hidden [@media(pointer:fine)]:flex' : 'flex'
  const controlReveal = revealControlsOnHover
    ? 'opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100'
    : ''

  function showPrevPhoto() {
    setPhotoIndex(index => (index - 1 + galleryPhotos.length) % galleryPhotos.length)
  }

  function showNextPhoto() {
    setPhotoIndex(index => (index + 1) % galleryPhotos.length)
  }

  function startSwipe(event: TouchEvent<HTMLDivElement>) {
    const touch = event.touches[0]
    if (!swipeable || !hasMultiplePhotos || !touch) return
    const left = event.currentTarget.getBoundingClientRect().left
    swipeRef.current = { x: touch.clientX, y: touch.clientY, startOffsetX: touch.clientX - left, intent: null }
  }

  function trackSwipe(event: TouchEvent<HTMLDivElement>) {
    const swipe = swipeRef.current
    const touch = event.touches[0]
    if (!swipe || !touch || swipe.intent !== null) return
    swipe.intent = resolveGestureIntent({
      startOffsetX: swipe.startOffsetX,
      atTop: false,
      onHero: true,
      dx: touch.clientX - swipe.x,
      dy: touch.clientY - swipe.y,
    })
  }

  function endSwipe(event: TouchEvent<HTMLDivElement>) {
    const swipe = swipeRef.current
    const touch = event.changedTouches[0]
    swipeRef.current = null
    if (!swipe || !touch || swipe.intent !== 'photo') return
    const outcome = gestureOutcome('photo', touch.clientX - swipe.x, touch.clientY - swipe.y)
    if (outcome === 'next-photo') showNextPhoto()
    if (outcome === 'previous-photo') showPrevPhoto()
  }

  function handlePhotoError() {
    if (!currentPhoto) return
    if (poiId) reportDeadPhoto(poiId, currentPhoto)
    setDeadPhotos(prev => new Set(prev).add(currentPhoto))
    setPhotoIndex(0)
  }

  return (
    <div
      className={isBlogVariant
        ? 'group relative aspect-[2/1] h-auto w-full overflow-hidden rounded-[28px] bg-slate-200'
        : 'group relative h-[450px] w-full overflow-hidden bg-gradient-to-br from-pink-600/20 to-pink-600/5'}
      data-testid="poi-detail-hero-carousel"
      data-poi-hero
      onTouchStart={swipeable ? startSwipe : undefined}
      onTouchMove={swipeable ? trackSwipe : undefined}
      onTouchEnd={swipeable ? endSwipe : undefined}
      onTouchCancel={swipeable ? () => { swipeRef.current = null } : undefined}
    >
      {currentPhoto ? (
        <>
          {!isBlogVariant && (
            <Image
              src={currentPhoto}
              alt=""
              aria-hidden
              fill
              priority
              unoptimized
              sizes="(max-width: 480px) 100vw, 480px"
              data-testid="poi-detail-hero-backdrop"
              className="scale-110 object-cover blur-xl"
            />
          )}
          <Image
            src={currentPhoto}
            alt={name}
            fill
            priority
            unoptimized
            sizes="(max-width: 480px) 100vw, 480px"
            onError={handlePhotoError}
            className={`${isBlogVariant ? 'object-cover' : 'object-contain'} object-center transition-transform duration-500`}
          />
        </>
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-pink-600/20 to-pink-600/5" />
      )}

      {!isBlogVariant && <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40" />}

      {children}

      {hasMultiplePhotos && (
        <>
          <button
            type="button"
            onClick={showPrevPhoto}
            aria-label="Photo précédente"
            className={`absolute left-4 top-1/2 z-10 ${arrowDisplay} h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-gray-800 shadow-lg backdrop-blur-sm transition-colors hover:text-white/60 ${controlReveal}`.trim()}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={showNextPhoto}
            aria-label="Photo suivante"
            className={`absolute right-4 top-1/2 z-10 ${arrowDisplay} h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-gray-800 shadow-lg backdrop-blur-sm transition-colors hover:text-white/60 ${controlReveal}`.trim()}
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className={`absolute bottom-12 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5 ${controlReveal}`.trim()}>
            {galleryPhotos.map((_, index) => (
              <span
                key={index}
                aria-label={`Photo ${index + 1} sur ${galleryPhotos.length}`}
                aria-current={index === photoIndex ? 'true' : undefined}
                className={`h-1.5 rounded-full transition-all ${
                  index === photoIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/60'
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
