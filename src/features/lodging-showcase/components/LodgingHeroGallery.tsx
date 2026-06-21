'use client'

import { useRef, useState } from 'react'
import { ROOM_TYPE_LABELS } from '../lib/detail-view'

type Photo = {
  id: string
  url: string
  alt: string
  room_type: string | null
  room_label?: string | null
  sort_order: number
  is_cover: boolean
}

export function LodgingHeroGallery({ title, photos }: { title: string; photos: Photo[] }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)

  if (photos.length === 0) {
    return <div data-testid="gallery-placeholder" className="h-[320px] w-full bg-gray-100" aria-hidden="true" />
  }

  const handleScroll = () => {
    const el = trackRef.current
    if (!el) return
    setActive(Math.round(el.scrollLeft / el.clientWidth))
  }

  const goTo = (i: number) => {
    const el = trackRef.current
    if (!el) return
    el.scrollTo({ left: i * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <section aria-label={`Photos de ${title}`} className="relative h-[320px] overflow-hidden">
      <div
        ref={trackRef}
        onScroll={handleScroll}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {photos.map(photo => (
          <div key={photo.id} className="relative h-full w-full shrink-0 snap-center">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={photo.url} alt={photo.alt} className="h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
            {photo.room_type && ROOM_TYPE_LABELS[photo.room_type] && (
              <div className="absolute bottom-12 left-0 right-0 px-5">
                <p className="text-[11px] uppercase tracking-widest text-white/70">{photo.room_label ?? ROOM_TYPE_LABELS[photo.room_type]}</p>
              </div>
            )}
          </div>
        ))}
      </div>

      {photos.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5">
          {photos.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Photo ${i + 1}`}
              onClick={() => goTo(i)}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{ width: active === i ? 20 : 6, background: active === i ? '#fff' : 'rgba(255,255,255,0.45)' }}
            />
          ))}
        </div>
      )}

      <span className="absolute right-4 top-4 rounded-full bg-black/30 px-2.5 py-0.5 text-[11px] text-white backdrop-blur-sm">
        {active + 1} / {photos.length}
      </span>
    </section>
  )
}
