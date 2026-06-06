'use client'

import Image from 'next/image'
import { useState, type ReactNode } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'

interface Props {
  photos: string[]
  name: string
  children?: ReactNode
}

export function PoiDetailHeroCarousel({ photos, name, children }: Props) {
  const galleryPhotos = photos.filter(Boolean)
  const [photoIndex, setPhotoIndex] = useState(0)
  const hasMultiplePhotos = galleryPhotos.length > 1
  const currentPhoto = galleryPhotos[photoIndex] ?? null

  function showPrevPhoto() {
    setPhotoIndex(index => (index - 1 + galleryPhotos.length) % galleryPhotos.length)
  }

  function showNextPhoto() {
    setPhotoIndex(index => (index + 1) % galleryPhotos.length)
  }

  return (
    <div
      className="relative h-[450px] w-full overflow-hidden bg-gradient-to-br from-gold/20 to-gold/5"
      data-testid="poi-detail-hero-carousel"
    >
      {currentPhoto ? (
        <>
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
          <Image
            src={currentPhoto}
            alt={name}
            fill
            priority
            unoptimized
            sizes="(max-width: 480px) 100vw, 480px"
            className="object-contain object-center transition-transform duration-500"
          />
        </>
      ) : (
        <div className="h-full w-full bg-gradient-to-br from-gold/20 to-gold/5" />
      )}

      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40" />

      {children}

      {hasMultiplePhotos && (
        <>
          <button
            type="button"
            onClick={showPrevPhoto}
            aria-label="Photo précédente"
            className="absolute left-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-gray-800 shadow-lg backdrop-blur-sm transition-colors hover:text-white/60"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={showNextPhoto}
            aria-label="Photo suivante"
            className="absolute right-4 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-gray-800 shadow-lg backdrop-blur-sm transition-colors hover:text-white/60"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
          <div className="absolute bottom-12 left-1/2 z-10 flex -translate-x-1/2 items-center gap-1.5">
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
