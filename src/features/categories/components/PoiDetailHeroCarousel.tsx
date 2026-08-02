'use client'

import Image from 'next/image'
import { useRef, useState, type ReactNode, type UIEvent } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { reportDeadPhoto } from '@/features/poi-photos/lib/report-dead-photo'

interface Props {
  photos: string[]
  name: string
  /** Si fourni, une photo qui échoue au chargement est signalée au serveur (lien-mort). */
  poiId?: string
  /** Si true, flèches et pastilles restent masquées (opacity-0) et n'apparaissent qu'au survol du hero. */
  revealControlsOnHover?: boolean
  /** Variante paysage utilisée par les articles du blog. */
  variant?: 'default' | 'blog'
  /** Navigation tactile moderne ; le mode historique à flèches reste le défaut. */
  navigation?: 'arrows' | 'swipe'
  children?: ReactNode
}

export function PoiDetailHeroCarousel({
  photos,
  name,
  poiId,
  revealControlsOnHover = false,
  variant = 'default',
  navigation = 'arrows',
  children,
}: Props) {
  const [photoIndex, setPhotoIndex] = useState(0)
  const [deadPhotos, setDeadPhotos] = useState<Set<string>>(new Set())
  const swipeRef = useRef<HTMLDivElement>(null)
  const galleryPhotos = photos.filter(Boolean).filter(url => !deadPhotos.has(url))
  const hasMultiplePhotos = galleryPhotos.length > 1
  const currentPhoto = galleryPhotos[photoIndex] ?? null
  const isBlogVariant = variant === 'blog'
  const usesNativeSwipe = navigation === 'swipe' && hasMultiplePhotos
  const controlReveal = revealControlsOnHover
    ? 'opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100'
    : ''

  function showPrevPhoto() {
    setPhotoIndex(index => (index - 1 + galleryPhotos.length) % galleryPhotos.length)
  }

  function showNextPhoto() {
    setPhotoIndex(index => (index + 1) % galleryPhotos.length)
  }

  function handlePhotoError(photo: string) {
    if (poiId) reportDeadPhoto(poiId, photo)
    setDeadPhotos(prev => new Set(prev).add(photo))
    setPhotoIndex(0)
    swipeRef.current?.scrollTo({ left: 0 })
  }

  function handleSwipeScroll(event: UIEvent<HTMLDivElement>) {
    const container = event.currentTarget
    if (container.clientWidth === 0) return
    const nextIndex = Math.round(container.scrollLeft / container.clientWidth)
    setPhotoIndex(Math.min(nextIndex, galleryPhotos.length - 1))
  }

  function showPhoto(index: number) {
    const container = swipeRef.current
    if (!container) return
    setPhotoIndex(index)
    container.scrollTo({
      left: index * container.clientWidth,
      behavior: 'smooth',
    })
  }

  return (
    <div
      className={isBlogVariant
        ? 'group relative aspect-[2/1] h-auto w-full overflow-hidden rounded-[28px] bg-slate-200'
        : 'group relative h-[450px] w-full overflow-hidden bg-gradient-to-br from-pink-600/20 to-pink-600/5'}
      data-testid="poi-detail-hero-carousel"
    >
      {usesNativeSwipe ? (
        <div
          ref={swipeRef}
          data-testid="poi-detail-hero-swipe"
          onScroll={handleSwipeScroll}
          className="no-scrollbar flex h-full w-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain touch-pan-x touch-pan-y"
        >
          {galleryPhotos.map((photo, index) => (
            <div
              key={photo}
              className="relative h-full w-full shrink-0 snap-center snap-always overflow-hidden"
            >
              {!isBlogVariant && (
                <Image
                  src={photo}
                  alt=""
                  aria-hidden
                  fill
                  priority={index === 0}
                  unoptimized
                  sizes="(max-width: 480px) 100vw, 480px"
                  className="scale-110 object-cover blur-xl"
                />
              )}
              <Image
                src={photo}
                alt={index === 0 ? name : `${name} — photo ${index + 1}`}
                fill
                priority={index === 0}
                unoptimized
                sizes="(max-width: 480px) 100vw, 480px"
                onError={() => handlePhotoError(photo)}
                className={`${isBlogVariant ? 'object-cover' : 'object-contain'} object-center`}
              />
            </div>
          ))}
        </div>
      ) : currentPhoto ? (
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
            onError={() => handlePhotoError(currentPhoto)}
            className={`${isBlogVariant ? 'object-cover' : 'object-contain'} object-center transition-transform duration-500`}
          />
        </>
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-pink-600/20 to-pink-600/5" />
      )}

      {!isBlogVariant && <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40" />}

      {children}

      {hasMultiplePhotos && !usesNativeSwipe && (
        <>
          <button
            type="button"
            onClick={showPrevPhoto}
            aria-label="Photo précédente"
            className={`absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-gray-800 shadow-lg backdrop-blur-sm transition-colors hover:text-white/60 ${controlReveal}`.trim()}
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={showNextPhoto}
            aria-label="Photo suivante"
            className={`absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-gray-800 shadow-lg backdrop-blur-sm transition-colors hover:text-white/60 ${controlReveal}`.trim()}
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

      {usesNativeSwipe && (
        <div className="absolute bottom-12 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5">
          {galleryPhotos.map((photo, index) => (
            <button
              key={photo}
              type="button"
              onClick={() => showPhoto(index)}
              aria-label={`Photo ${index + 1} sur ${galleryPhotos.length}`}
              aria-current={index === photoIndex ? 'true' : undefined}
              className={`h-1.5 rounded-full transition-all ${
                index === photoIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
