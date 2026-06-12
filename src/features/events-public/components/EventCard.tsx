import Link from 'next/link'
import { CalendarDays, MapPin } from 'lucide-react'
import type { AgendaListItem } from '../types'
import { typeLabel } from '../lib/event-type-labels'

export function EventCard({
  event,
  citySlug,
  lodgingId,
}: {
  event: AgendaListItem
  citySlug: string
  lodgingId?: string
}) {
  const href = lodgingId
    ? `/guide/${citySlug}/agenda/${event.slug}?lodging=${encodeURIComponent(lodgingId)}`
    : `/guide/${citySlug}/agenda/${event.slug}`

  return (
    <Link
      href={href}
      data-testid={`event-card-${event.slug}`}
      className="group flex gap-4 overflow-hidden rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition active:scale-[0.99]"
    >
      <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-xl bg-gray-100">
        {event.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={event.imageUrl}
            alt=""
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <CalendarDays className="h-7 w-7" />
          </div>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap gap-1">
          {event.types.map((t) => (
            <span
              key={t}
              className="rounded-full bg-pine/10 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-pine"
            >
              {typeLabel(t)}
            </span>
          ))}
        </div>
        <h3 className="mt-1 line-clamp-2 text-sm font-medium text-charcoal">{event.title}</h3>
        <p className="mt-1 flex items-center gap-1 text-xs text-gold">
          <CalendarDays className="h-3 w-3" /> {event.dateLabel}
        </p>
        <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-gray-400">
          <MapPin className="h-3 w-3 shrink-0" /> {event.venueName ?? event.communeName}
        </p>
      </div>
    </Link>
  )
}
