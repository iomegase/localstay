'use client'

import { useRef, useState } from 'react'
import type { RoomPhotoGroup } from '../lib/detail-view'
import { ROOM_CATEGORIES, categorizeRoomGroups, type RoomCategoryId } from '../lib/room-categories'

type Photo = {
  id: string
  url: string
  alt: string
  room_type: string | null
  room_label?: string | null
  sort_order: number
  is_cover: boolean
}

export function LodgingRoomsGrid({ photos, compact = false }: { photos: Photo[]; compact?: boolean }) {
  const [filter, setFilter] = useState<RoomCategoryId | 'all'>('all')
  const groups = categorizeRoomGroups(photos)
  if (groups.length === 0) return null

  const categories = ROOM_CATEGORIES.filter(category => groups.some(group => group.category === category.id))
  const visible = filter === 'all' ? groups : groups.filter(group => group.category === filter)

  return (
    <section>
      <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-pink-600">
        En images
      </span>
      <h2 className="mb-5 mt-2 text-[20px] font-semibold leading-[1.08] tracking-[-0.04em] text-slate-800 ">
        L&apos;espace de vie
      </h2>
      {categories.length > 1 && (
        <div
          role="group"
          aria-label="Filtrer les photos par pièce"
          className="-mx-1 mb-5 flex gap-2 overflow-x-auto px-1 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {[{ id: 'all' as const, label: 'Tout' }, ...categories].map(category => {
            const active = filter === category.id
            return (
              <button
                key={category.id}
                type="button"
                aria-pressed={active}
                onClick={() => setFilter(category.id)}
                className={`shrink-0 rounded-full border px-3 py-1 text-[11px] font-medium transition-colors ${
                  active
                    ? 'border-pink-200 bg-pink-50 text-pink-700'
                    : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700'
                }`}
              >
                {category.label}
              </button>
            )
          })}
        </div>
      )}
      <div className={compact ? 'grid grid-cols-2 gap-3' : 'grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5'}>
        {visible.map(group => (
          <RoomGroupCard key={group.label} group={group} />
        ))}
      </div>
    </section>
  )
}

function RoomGroupCard({ group }: { group: RoomPhotoGroup }) {
  const trackRef = useRef<HTMLDivElement>(null)
  const [active, setActive] = useState(0)
  const multiple = group.photos.length > 1

  const handleScroll = () => {
    const el = trackRef.current
    if (!el) return
    setActive(Math.round(el.scrollLeft / el.clientWidth))
  }

  const goTo = (index: number) => {
    const el = trackRef.current
    if (!el) return
    el.scrollTo({ left: index * el.clientWidth, behavior: 'smooth' })
  }

  return (
    <div data-testid="lodging-room-card" className="relative aspect-square w-full overflow-hidden rounded-[20px] bg-slate-100 shadow-sm">
      <div
        ref={trackRef}
        onScroll={multiple ? handleScroll : undefined}
        className="flex h-full w-full snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {group.photos.map(photo => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={photo.id}
            src={photo.url}
            alt={photo.alt}
            className="h-full w-full shrink-0 snap-center object-cover"
          />
        ))}
      </div>

      <span
        data-testid="lodging-room-label"
        className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-slate-900 shadow-sm backdrop-blur-sm"
      >
        {group.label}
      </span>

      {multiple && (
        <>
          <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-slate-900 shadow-sm backdrop-blur-sm">
            {group.photos.length}
          </span>
          <div className="absolute bottom-3.5 right-3 flex gap-1 drop-shadow-[0_1px_2px_rgba(0,0,0,0.45)]">
            {group.photos.map((photo, index) => (
              <button
                key={photo.id}
                type="button"
                aria-label={`Voir la photo ${index + 1} de ${group.label}`}
                onClick={() => goTo(index)}
                className="h-1.5 rounded-full transition-all duration-300"
                style={{
                  width: active === index ? 14 : 6,
                  background: active === index ? '#fff' : 'rgba(255,255,255,0.5)',
                }}
              />
            ))}
          </div>
        </>
      )}
    </div>
  )
}
