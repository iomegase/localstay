'use client'

import { useRef, useState } from 'react'
import { groupRoomPhotos, type RoomPhotoGroup } from '../lib/detail-view'

type Photo = {
  id: string
  url: string
  alt: string
  room_type: string | null
  room_label?: string | null
  sort_order: number
  is_cover: boolean
}

export function LodgingRoomsGrid({ photos }: { photos: Photo[] }) {
  const groups = groupRoomPhotos(photos)
  if (groups.length === 0) return null

  return (
    <section>
      <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-pink-600">
        En images
      </span>
      <h2 className="mb-7 mt-2 text-[20px] font-semibold leading-[1.08] tracking-[-0.04em] text-slate-800 md:text-[36px]">
        L&apos;espace de vie
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {groups.map(group => (
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
    <div className="relative aspect-square w-full overflow-hidden rounded-[20px] bg-slate-100 shadow-sm">
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

      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
      <span className="pointer-events-none absolute bottom-2 left-3 text-[12px] font-semibold text-white drop-shadow">
        {group.label}
      </span>

      {multiple && (
        <>
          <span className="pointer-events-none absolute right-2 top-2 rounded-full bg-black/35 px-2 py-0.5 text-[10px] font-medium text-white backdrop-blur-sm">
            {group.photos.length}
          </span>
          <div className="absolute bottom-2.5 right-3 flex gap-1">
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
