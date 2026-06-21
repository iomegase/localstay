import { selectRoomPhotos } from '../lib/detail-view'

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
  const rooms = selectRoomPhotos(photos)
  if (rooms.length === 0) return null

  return (
    <section className="mt-6">
      <p className="mx-4 mb-4 text-[14px] font-bold uppercase tracking-wider text-charcoal">L&apos;espace de vie</p>
      <div className="mx-4 grid grid-cols-2 gap-3">
        {rooms.map(room => (
          <div key={room.id} className="relative aspect-square w-full overflow-hidden rounded-2xl shadow-sm">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={room.url} alt={room.alt} className="absolute inset-0 h-full w-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 to-transparent" />
            <span className="absolute bottom-2 left-3 text-[12px] font-semibold text-white drop-shadow">{room.label}</span>
          </div>
        ))}
      </div>
    </section>
  )
}
