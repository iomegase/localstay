import { shortDescriptionText } from '@/features/lodging-showcase/lib/short-description'
import { ExternalBookingCta } from '@/features/lodging-showcase/components/ExternalBookingCta'
import type { MarketingLodgingCard } from '@/features/lodging-showcase/queries/public-lodgings'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowRight, ArrowUpRight, BedDouble, Scan, ShowerHead, Users } from 'lucide-react'

function verifiedAirbnbUrl(lodging: MarketingLodgingCard): string | null {
  return lodging.external_booking_platform === 'airbnb'
    && lodging.external_booking_url?.startsWith('https://') === true
    ? lodging.external_booking_url
    : null
}

// Carte dédiée à la landing locations (spec 046 AC-03-07) : la commune n'est pas répétée.
export function LocalRentalCard({
  lodging,
  priority = false,
}: {
  lodging: MarketingLodgingCard
  priority?: boolean
}) {
  const airbnbUrl = verifiedAirbnbUrl(lodging)
  const specs = [
    { icon: Scan, value: lodging.surface_m2 ? `${lodging.surface_m2} m²` : null },
    { icon: Users, value: `${lodging.max_guests} ${lodging.max_guests > 1 ? 'voyageurs' : 'voyageur'}` },
    { icon: BedDouble, value: lodging.bedroom_count == null ? null : `${lodging.bedroom_count} ch.` },
    { icon: ShowerHead, value: lodging.bathroom_count == null ? null : `${lodging.bathroom_count} sdb` },
  ].filter((spec): spec is { icon: typeof Scan; value: string } => spec.value !== null)

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[24px] bg-white ring-1 ring-slate-200/70 transition-shadow hover:shadow-[0_22px_50px_rgba(15,23,42,0.10)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 bg-[url('/marketing/guide-interior.png')] bg-cover bg-center">
        {lodging.cover_photo_url && (
          <Image
            src={lodging.cover_photo_url}
            alt={`${lodging.title} — ${lodging.city_name}`}
            fill
            priority={priority}
            unoptimized
            className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
            sizes="(max-width: 767px) 100vw, 560px"
          />
        )}
        {lodging.property_type && (
          <span className="absolute left-4 top-4 inline-block rounded-full first-letter:uppercase bg-white/90 px-3 py-1 text-[11px] font-bold text-slate-800 backdrop-blur">
            {lodging.property_type}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col px-6 pb-5 pt-5">
        <h3 className="text-[21px] font-bold leading-tight tracking-[-0.035em] text-slate-900">
          <Link
            href={lodging.href}
            aria-label={`Découvrir ${lodging.title}`}
            className="after:absolute after:inset-0 after:rounded-[24px] focus-visible:outline-none focus-visible:after:outline focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-pink-600"
          >
            {lodging.title}
          </Link>
        </h3>
        <p className="mt-2 line-clamp-3 text-[15px] leading-6 text-slate-500">
          {shortDescriptionText(lodging.short_description)}
        </p>

        <ul className="mb-5 mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[13px] font-semibold text-slate-700">
          {specs.map(({ icon: Icon, value }) => (
            <li key={value} className="inline-flex items-center gap-1.5">
              <Icon aria-hidden="true" className="h-4 w-4 text-slate-400" strokeWidth={1.7} />
              <span>{value}</span>
            </li>
          ))}
        </ul>

        <div className="mt-auto flex items-center justify-between gap-4 border-t border-slate-100 pt-4">
          <span aria-hidden="true" className="inline-flex items-center whitespace-nowrap text-[13px] font-bold text-slate-900">
            Découvrir le logement
            <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
          {airbnbUrl && (
            <span className="relative z-10 inline-flex items-center whitespace-nowrap">
              <ExternalBookingCta
                externalBookingUrl={airbnbUrl}
                platform={lodging.external_booking_platform}
                citySlug={lodging.city_slug}
                lodgingId={lodging.id}
                label="Voir sur Airbnb"
                className="text-[13px] font-semibold text-slate-500 underline-offset-4 hover:text-pink-600 hover:underline"
              />
              <ArrowUpRight aria-hidden="true" className="ml-1 h-3.5 w-3.5 text-slate-400" />
            </span>
          )}
        </div>
      </div>
    </article>
  )
}
