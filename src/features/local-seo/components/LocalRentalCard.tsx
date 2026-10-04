import { shortDescriptionText } from '@/features/lodging-showcase/lib/short-description'
import { ExternalBookingCta } from '@/features/lodging-showcase/components/ExternalBookingCta'
import type { MarketingLodgingCard } from '@/features/lodging-showcase/queries/public-lodgings'
import { PropertyStat } from '@/features/marketing/components/MarketingPropertyCard'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, BedDouble, Scan, ShowerHead, Users } from 'lucide-react'

function verifiedAirbnbUrl(lodging: MarketingLodgingCard): string | null {
  return lodging.external_booking_platform === 'airbnb'
    && lodging.external_booking_url?.startsWith('https://') === true
    ? lodging.external_booking_url
    : null
}

// Carte dédiée à la landing locations, style MarketingPropertyCard (spec 046 AC-03-07) :
// l'eyebrow porte le type de bien, la commune n'est pas répétée.
export function LocalRentalCard({
  lodging,
  priority = false,
}: {
  lodging: MarketingLodgingCard
  priority?: boolean
}) {
  const airbnbUrl = verifiedAirbnbUrl(lodging)

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[26px] bg-white shadow-[0_22px_58px_rgba(15,23,42,0.10)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 bg-[url('/marketing/guide-interior.png')] bg-cover bg-center">
        {lodging.cover_photo_url && (
          <Image
            src={lodging.cover_photo_url}
            alt={`${lodging.title} — ${lodging.city_name}`}
            fill
            priority={priority}
            unoptimized
            className="object-cover transition-opacity group-hover:opacity-90"
            sizes="(max-width: 767px) 100vw, 360px"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col px-6 pb-5 pt-6 md:max-lg:px-4">
        {lodging.property_type && (
          <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-pink-600">{lodging.property_type}</p>
        )}
        <h3 className="mt-2 text-xl font-bold tracking-[-0.035em] text-slate-800">
          <Link
            href={lodging.href}
            aria-label={`Découvrir ${lodging.title}`}
            className="after:absolute after:inset-0 after:rounded-[26px] focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-pink-600"
          >
            {lodging.title}
          </Link>
        </h3>
        <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-500">
          {shortDescriptionText(lodging.short_description)}
        </p>

        <dl className="mb-4 mt-5 grid grid-cols-2 border-t border-slate-200 text-slate-800">
          <PropertyStat icon={Scan} label="Surface" dense value={lodging.surface_m2 ? `${lodging.surface_m2} m²` : '—'} />
          <PropertyStat icon={Users} label="Voyageurs" dense value={String(lodging.max_guests)} borderLeft />
          <PropertyStat icon={BedDouble} label="Chambres" dense value={lodging.bedroom_count == null ? '—' : String(lodging.bedroom_count)} borderTop />
          <PropertyStat
            icon={ShowerHead}
            label="Salles de bain"
            dense
            value={lodging.bathroom_count == null ? '—' : String(lodging.bathroom_count)}
            borderLeft
            borderTop
          />
        </dl>

        <div className="mt-auto flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-slate-200 pt-4">
          <span aria-hidden="true" className="inline-flex items-center whitespace-nowrap text-xs font-bold text-slate-900">
            Découvrir
            <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </span>
          {airbnbUrl && (
            <span className="relative z-10 inline-flex items-center whitespace-nowrap">
              <ExternalBookingCta
                externalBookingUrl={airbnbUrl}
                platform={lodging.external_booking_platform}
                citySlug={lodging.city_slug}
                lodgingId={lodging.id}
                label="Voir sur Airbnb"
                className="text-xs font-semibold text-slate-500 underline-offset-4 hover:text-pink-600 hover:underline"
              />
              <ArrowUpRight aria-hidden="true" className="ml-1 h-3.5 w-3.5 text-slate-400" />
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
