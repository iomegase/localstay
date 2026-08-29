import Link from 'next/link'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { CalendarDays, MapPin, ExternalLink, ArrowLeft } from 'lucide-react'
import { PoiDetailHeroCarousel } from '@/features/categories/components/PoiDetailHeroCarousel'
import { HeroShareButton } from '@/features/categories/components/HeroShareButton'
import { getEventBySlug } from '@/features/events-public/queries/agenda'
import { typeLabel } from '@/features/events-public/lib/event-type-labels'
import { privatePageMetadata } from '@/features/seo/lib/private-metadata'

interface Props {
  params: Promise<{ 'city-slug': string; 'event-slug': string }>
  searchParams?: Promise<{ lodging?: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { 'city-slug': citySlug, 'event-slug': eventSlug } = await params
  const event = await getEventBySlug(citySlug, eventSlug)
  if (!event) return privatePageMetadata('Événement introuvable')
  return privatePageMetadata(event.title)
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
  const heroPhotos = event.images.filter(Boolean)

  return (
    <article className="-mt-6">
      {/* Hero — galerie de toutes les photos */}
      <PoiDetailHeroCarousel photos={heroPhotos} name={event.title} revealControlsOnHover>
        <div className="absolute top-4 left-6 right-6 flex items-center justify-between z-10 opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-within:opacity-100">
          <Link
            href={agendaHref}
            aria-label="Retour à l'agenda"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/30 text-charcoal/60 backdrop-blur transition-transform hover:bg-white/40 active:scale-95"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex items-center gap-2">
            <HeroShareButton poiName={event.title} poiUrl={`/guide/${citySlug}/agenda/${eventSlug}`} />
          </div>
        </div>
      </PoiDetailHeroCarousel>

      {/* Content sheet */}
      <main className="relative z-20 -mt-8 space-y-6 rounded-t-[32px] bg-slate-50 pt-8 pb-16 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
        {/* Header */}
        <header className="px-6">
          {event.types.length > 0 && (
            <span className="text-[9px] font-bold uppercase tracking-widest text-pink-600">
              {event.types.map(typeLabel).join(' · ')}
            </span>
          )}
          <h1 className="mt-1 text-xl uppercase leading-tight text-charcoal">{event.title}</h1>

          <p className="mt-3 flex items-center gap-2 text-sm text-pink-600">
            <CalendarDays className="h-4 w-4" /> {event.dateLabel}
          </p>
          {(event.venueName || event.address) && (
            <p className="mt-1 flex items-center gap-2 text-sm text-charcoal/50">
              <MapPin className="h-4 w-4 shrink-0" />
              {[event.venueName, event.address, event.communeName].filter(Boolean).join(' · ')}
            </p>
          )}
        </header>

        {event.description && (
          <p className="px-6 whitespace-pre-line text-sm leading-relaxed text-charcoal/70">{event.description}</p>
        )}

        {event.priceInfo && <p className="px-6 text-sm text-charcoal/50">Tarif : {event.priceInfo}</p>}

        {event.website && (
          <div className="px-6">
            <a
              href={event.website}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-charcoal px-5 py-2.5 text-xs font-bold uppercase tracking-widest text-white"
            >
              Site officiel / billetterie <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        )}
      </main>
    </article>
  )
}
