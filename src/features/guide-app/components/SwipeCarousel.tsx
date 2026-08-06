'use client'

import { useRef, useState } from 'react'

type Photo = { url: string; alt: string }

/**
 * Carrousel horizontal à défilement natif (swipe) — scroll-snap, SANS flèches.
 * Un indicateur de points signale la position. Réutilisé pour le header (grand)
 * et pour les vignettes par pièce (petit).
 */
export function SwipeCarousel({
  photos,
  aspectClass = 'aspect-[4/3]',
  roundedClass = 'rounded-[22px]',
  dots = true,
}: {
  photos: Photo[]
  aspectClass?: string
  roundedClass?: string
  dots?: boolean
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  function onScroll() {
    const el = trackRef.current
    if (!el || el.clientWidth === 0) return
    setActive(Math.round(el.scrollLeft / el.clientWidth))
  }

  return (
    <div className={`relative overflow-hidden ${roundedClass}`}>
      <div
        ref={trackRef}
        onScroll={onScroll}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {photos.map((photo, index) => (
          // eslint-disable-next-line @next/next/no-img-element -- image distante (parité guide)
          <img
            key={index}
            src={photo.url}
            alt={photo.alt}
            loading={index === 0 ? undefined : 'lazy'}
            className={`${aspectClass} w-full shrink-0 snap-center object-cover`}
          />
        ))}
      </div>

      {dots && photos.length > 1 && (
        <div className="pointer-events-none absolute inset-x-0 bottom-2 flex items-center justify-center gap-1.5">
          {photos.map((_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full bg-white transition-all ${
                index === active ? 'w-4 opacity-100' : 'w-1.5 opacity-60'
              }`}
            />
          ))}
        </div>
      )}
    </div>
  )
}
