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

const MAX_DOTS = 5

/** Indices des points affichés : au plus 5, fenêtre centrée sur la photo active. */
function dotWindow(total: number, active: number): number[] {
  const size = Math.min(total, MAX_DOTS)
  const start = Math.min(Math.max(active - Math.floor(size / 2), 0), total - size)
  return Array.from({ length: size }, (_, i) => start + i)
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
        className="pointer-events-none absolute right-2 top-2 max-w-[calc(100%-1rem)] truncate rounded-full bg-white/60 px-2.5 py-1 text-[11px] font-medium text-slate-900 backdrop-blur-sm"
      >
        {group.label}
      </span>

      {multiple && (
        <div
          data-testid="lodging-room-dots"
          className="absolute bottom-2 right-2 flex items-center gap-1 rounded-full bg-black/30 py-1.5 pl-2 pr-2.5 backdrop-blur-sm"
        >
          {dotWindow(group.photos.length, active).map(index => (
            <button
              key={group.photos[index].id}
              type="button"
              aria-label={`Voir la photo ${index + 1} de ${group.label}`}
              onClick={() => goTo(index)}
              className="h-1.5 rounded-full transition-all duration-300"
              style={{
                width: active === index ? 14 : 6,
                background: active === index ? '#fff' : 'rgba(255,255,255,0.65)',
              }}
            />
          ))}
          <span data-testid="lodging-room-count" className="ml-1 text-[11px] font-medium leading-none text-white">
            {group.photos.length}
          </span>
        </div>
      )}
    </div>
  )
}
