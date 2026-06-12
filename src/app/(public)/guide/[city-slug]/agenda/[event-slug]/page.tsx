import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { CalendarDays, MapPin, ExternalLink, ArrowLeft } from 'lucide-react'
import { getEventBySlug } from '@/features/events-public/queries/agenda'
import { typeLabel } from '@/features/events-public/lib/event-type-labels'

interface Props {
  params: Promise<{ 'city-slug': string; 'event-slug': string }>
  searchParams?: Promise<{ lodging?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { 'city-slug': citySlug, 'event-slug': eventSlug } = await params
  const event = await getEventBySlug(citySlug, eventSlug)
  if (!event) return { title: 'Événement introuvable', robots: { index: false } }
  return { title: event.title, description: event.description ?? undefined }
}

export default async function EventDetailPage({ params, searchParams }: Props) {
  const { 'city-slug': citySlug, 'event-slug': eventSlug } = await params
  const sp = (await searchParams) ?? {}
  const lodging = sp.lodging

  const event = await getEventBySlug(citySlug, eventSlug)
  if (!event) {
    notFound()
    return null
  }

  const agendaHref = lodging
    ? `/guide/${citySlug}/agenda?lodging=${encodeURIComponent(lodging)}`
    : `/guide/${citySlug}/agenda`
  const hero = event.images[0] ?? null

  return (
    <article className="pb-12">
      <div className="relative h-64 w-full overflow-hidden bg-gray-100">
        {hero ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={hero} alt="" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-gray-300">
            <CalendarDays className="h-12 w-12" />
          </div>
        )}
        <Link
          href={agendaHref}
          aria-label="Retour à l'agenda"
          className="absolute left-4 top-4 flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-charcoal shadow-lg backdrop-blur-md"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
      </div>

      <div className="p-5">
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

        <h1 className="mt-2 text-2xl font-light text-charcoal">{event.title}</h1>

        <p className="mt-3 flex items-center gap-2 text-sm text-gold">
          <CalendarDays className="h-4 w-4" /> {event.dateLabel}
        </p>
        {(event.venueName || event.address) && (
          <p className="mt-1 flex items-center gap-2 text-sm text-gray-500">
            <MapPin className="h-4 w-4 shrink-0" />
            {[event.venueName, event.address, event.communeName].filter(Boolean).join(' · ')}
          </p>
        )}

        {event.description && (
          <p className="mt-5 whitespace-pre-line text-sm leading-relaxed text-charcoal">{event.description}</p>
        )}

        {event.priceInfo && <p className="mt-4 text-sm text-gray-500">Tarif : {event.priceInfo}</p>}

        {event.website && (
          <a
            href={event.website}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-charcoal px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white"
          >
            Site officiel / billetterie <ExternalLink className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </article>
  )
}
