'use client'

import Image from 'next/image'
import { useRef, useState } from 'react'

/**
 * Galerie photo du logement : défilement horizontal par geste (scroll-snap natif
 * au toucher / trackpad) + pastilles cliquables indiquant la photo courante.
 */
export function GuideLodgingGallery({ images, alt }: { images: string[]; alt: string }) {
  const [index, setIndex] = useState(0)
  const scrollerRef = useRef<HTMLDivElement>(null)

  function handleScroll() {
    const el = scrollerRef.current
    if (!el || el.clientWidth === 0) return
    setIndex(Math.round(el.scrollLeft / el.clientWidth))
  }

  function goTo(i: number) {
    const el = scrollerRef.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <section aria-label={`Galerie photo — ${alt}`} className="select-none">
      <div
        ref={scrollerRef}
        onScroll={handleScroll}
        className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto overscroll-x-contain rounded-[30px]"
      >
        {images.map((src, i) => (
          <div key={src} className="relative aspect-[5/4] w-full shrink-0 snap-center bg-slate-100">
            <Image
              src={src}
              alt={`${alt} — photo ${i + 1}`}
              fill
              priority={i === 0}
              unoptimized={src.startsWith('https://')}
              sizes="360px"
              draggable={false}
              className="object-cover"
            />
          </div>
        ))}
      </div>

      {images.length > 1 && (
        <div className="mt-3 flex items-center justify-center gap-1.5" aria-label="Photos du logement">
          {images.map((src, i) => (
            <button
              key={src}
              type="button"
              aria-label={`Voir la photo ${i + 1}`}
              aria-current={i === index}
              onClick={() => goTo(i)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                i === index ? 'w-5 bg-slate-800' : 'w-1.5 bg-slate-300'
              }`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
