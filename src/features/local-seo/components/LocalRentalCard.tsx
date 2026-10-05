import { shortDescriptionText } from '@/features/lodging-showcase/lib/short-description'
import type { MarketingLodgingCard } from '@/features/lodging-showcase/queries/public-lodgings'
import { PropertyStat } from '@/features/marketing/components/MarketingPropertyCard'
import Image from 'next/image'
import Link from 'next/link'
import { BedDouble, Scan, ShowerHead, Users } from 'lucide-react'

// Carte dédiée à la landing locations, style MarketingPropertyCard (spec 046 AC-03-07) :
// l'eyebrow porte le type de bien, la commune n'est pas répétée, aucun CTA de réservation.
export function LocalRentalCard({
  lodging,
  priority = false,
}: {
  lodging: MarketingLodgingCard
  priority?: boolean
}) {
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-[26px] bg-white shadow-[0_22px_58px_rgba(15,23,42,0.10)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 bg-[url('/marketing/guide-interior.png')] bg-cover bg-center">
        {lodging.cover_photo_url && (
          <Image
            src={lodging.cover_photo_url}
            alt={`${lodging.title} — ${lodging.city_name}`}
            fill
            loading={priority ? 'eager' : 'lazy'}
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

        <dl className="mt-5 grid grid-cols-2 border-t border-slate-200 text-slate-800">
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
      </div>
    </article>
  )
}
