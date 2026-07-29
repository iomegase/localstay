import Image from 'next/image'
import Link from 'next/link'
import { BedDouble, Scan, ShowerHead, Users } from 'lucide-react'
import type { MarketingLodgingCard } from '@/features/lodging-showcase/queries/public-lodgings'

export function MarketingPropertyCard({
  lodging,
  priority = false,
  compact = false,
}: {
  lodging: MarketingLodgingCard
  priority?: boolean
  compact?: boolean
}) {
  const location = lodging.public_area_label || lodging.city_name

  if (compact) {
    return (
      <article data-testid="home-property-card" data-variant="compact">
        <Link
          href={lodging.href}
          className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink-600"
          aria-label={`Découvrir ${lodging.title}`}
        >
          <div
            data-testid="home-property-image"
            className="relative aspect-[4/3] overflow-hidden rounded-[26px] bg-slate-100 bg-[url('/marketing/guide-interior.png')] bg-cover bg-center shadow-[0_18px_45px_rgba(30,41,59,0.08)] xl:h-[344px] xl:aspect-auto xl:rounded-[26px]"
          >
            {lodging.cover_photo_url && (
              <Image
                src={lodging.cover_photo_url}
                alt=""
                fill
                priority={priority}
                unoptimized
                className="object-cover transition-opacity group-hover:opacity-90"
                sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 340px"
              />
            )}
          </div>
          <p className="mt-4 text-[9px] font-extrabold uppercase tracking-[0.16em] text-pink-600">
            {location}
          </p>
          <h3 className="mt-2 text-xl font-bold tracking-[-0.035em] text-slate-800 xl:text-[19px]">
            {lodging.title}
          </h3>
        </Link>
      </article>
    )
  }

  return (
    <article className="overflow-hidden rounded-[26px] bg-white shadow-[0_22px_58px_rgba(15,23,42,0.10)]">
      <Link
        href={lodging.href}
        className="group block focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-pink-600"
        aria-label={`Découvrir ${lodging.title}`}
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100 bg-[url('/marketing/guide-interior.png')] bg-cover bg-center">
          {lodging.cover_photo_url && (
            <Image
              src={lodging.cover_photo_url}
              alt=""
              fill
              priority={priority}
              unoptimized
              className="object-cover transition-opacity group-hover:opacity-90"
              sizes="(max-width: 767px) 100vw, (max-width: 1199px) 50vw, 360px"
            />
          )}
        </div>

        <div className="px-6 pb-5 pt-6">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.16em] text-pink-600">{location}</p>
          <h3 className="mt-2 text-xl font-bold tracking-[-0.035em] text-slate-800">{lodging.title}</h3>
          <p className="mt-3 line-clamp-3 text-xs leading-5 text-slate-500">
            {lodging.short_description}
          </p>

          <dl className="mt-5 grid grid-cols-2 border-t border-slate-200 text-slate-800">
            <PropertyStat icon={Scan} label="Surface" value={lodging.surface_m2 ? `${lodging.surface_m2} m²` : '—'} />
            <PropertyStat icon={Users} label="Voyageurs" value={String(lodging.max_guests)} borderLeft />
            <PropertyStat icon={BedDouble} label="Chambres" value={lodging.bedroom_count == null ? '—' : String(lodging.bedroom_count)} borderTop />
            <PropertyStat
              icon={ShowerHead}
              label="Salles de bain"
              value={lodging.bathroom_count == null ? '—' : String(lodging.bathroom_count)}
              borderLeft
              borderTop
            />
          </dl>
        </div>
      </Link>
    </article>
  )
}

function PropertyStat({
  icon: Icon,
  label,
  value,
  borderLeft = false,
  borderTop = false,
}: {
  icon: typeof Scan
  label: string
  value: string
  borderLeft?: boolean
  borderTop?: boolean
}) {
  return (
    <div
      className={`flex min-h-[74px] items-center gap-3 py-3 ${borderLeft ? 'border-l border-slate-200 pl-4' : 'pr-3'} ${
        borderTop ? 'border-t border-slate-200' : ''
      }`}
    >
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-slate-50">
        <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.6} />
      </span>
      <div>
        <dt className="text-[8px] text-slate-500">{label}</dt>
        <dd className="text-xs font-bold">{value}</dd>
      </div>
    </div>
  )
}
