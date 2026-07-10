import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { CategoryIcon } from '@/features/city-guide/lib/category-icon'
import type { CardVariant, RecRow } from './variants'

type Props = {
  row: RecRow
  variant: CardVariant
  fallbackCitySlug: string
  showCategory?: boolean
}

export function RecommendationCard({ row, variant, fallbackCitySlug, showCategory = true }: Props) {
  const { poi } = row
  const citySlug = poi.city?.slug ?? fallbackCitySlug
  const href = `/guide/${citySlug}/${poi.category.slug}/${poi.slug}`
  const photo = poi.photos?.[0] ?? null
  const status = getOpeningStatus(poi)

  if (variant === 'bigImage') {
    return (
      <Link
        href={href}
        className="group relative col-span-2 aspect-square overflow-hidden rounded-[2rem] bg-charcoal shadow-[0_10px_28px_rgba(0,0,0,0.10)]"
      >
        {photo && (
          <img
            src={photo}
            alt={poi.name}
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent" />
        {status && (
          <div className="absolute left-4 top-4">
            <OpeningStatusBadge poiId={poi.id} status={status} />
          </div>
        )}
        <div className="relative flex h-full flex-col justify-center p-5 text-white">
          {showCategory && (
            <div
              className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur"
              role="img"
              aria-label={poi.category.name}
            >
              <CategoryIcon iconSlug={poi.category.icon ?? 'map-pin'} className="h-5 w-5" />
            </div>
          )}
          <h3 className=" text-2xl uppercase  leading-none">{poi.name}</h3>
          {status?.timingLabel && (
            <p
              data-testid={`recommendation-timing-${poi.id}`}
              className="mt-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/85"
            >
              {status.timingLabel}
            </p>
          )}
          <span className="mt-5 inline-flex self-start items-center gap-2 text-[10px] font-bold rounded-full p-2 uppercase tracking-widest bg-black text-white/80 w-auto shadow-md transition hover:bg-white hover:text-charcoal">
            Voir le lieu
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    )
  }

  if (variant === 'image') {
    return (
      <Link
        href={href}
        className="group relative flex aspect-square flex-col justify-center overflow-hidden rounded-[1.75rem] bg-charcoal shadow-[0_10px_28px_rgba(0,0,0,0.10)]"
      >
        {photo && (
          <img
            src={photo}
            alt={poi.name}
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
        {status && (
          <div className="absolute left-3 top-3">
            <OpeningStatusBadge poiId={poi.id} status={status} />
          </div>
        )}
        <div className="relative flex h-full flex-col justify-center p-4 text-white">
          {showCategory && (
            <div
              className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur"
              role="img"
              aria-label={poi.category.name}
            >
              <CategoryIcon iconSlug={poi.category.icon ?? 'map-pin'} className="h-4 w-4" />
            </div>
          )}
          <h3 className="uppercase text-md  leading-tight">{poi.name}</h3>
          {status?.timingLabel && (
            <p
              data-testid={`recommendation-timing-${poi.id}`}
              className="mt-3 text-[9px] font-bold uppercase tracking-[0.16em] text-white/85"
            >
              {status.timingLabel}
            </p>
          )}
        </div>
      </Link>
    )
  }

  // variant 'white' | 'sand'
  const bg = variant === 'sand' ? 'bg-sand' : 'bg-white'
  return (
    <Link
      href={href}
      className={`group relative aspect-square overflow-hidden rounded-[1.75rem] ${bg} p-4 shadow-[0_10px_28px_rgba(0,0,0,0.10)] transition hover:-translate-y-0.5`}
    >
      <div className="flex h-full flex-col justify-center text-center items-center">
        <div>
          {showCategory && (
            <div
              className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-pink-600/10 text-pink-600"
              role="img"
              aria-label={poi.category.name}
            >
              <CategoryIcon iconSlug={poi.category.icon ?? 'map-pin'} className="h-5 w-5" />
            </div>
          )}
          {status && (
            <div className="mb-3 flex flex-col items-center gap-1.5">
              <OpeningStatusBadge poiId={poi.id} status={status} />
              {status.timingLabel && (
                <p
                  data-testid={`recommendation-timing-${poi.id}`}
                  className="text-[9px] font-bold uppercase tracking-[0.14em] text-gray-500"
                >
                  {status.timingLabel}
                </p>
              )}
            </div>
          )}
          <h3 className="mt-2 uppercase text-sm leading-tight text-charcoal">{poi.name}</h3>
        </div>
      </div>
    </Link>
  )
}

type OpeningStatus = {
  label: 'Ouvert' | 'Fermé'
  kind: 'open' | 'closed'
  timingLabel: string | null
}

function getOpeningStatus(poi: RecRow['poi']): OpeningStatus | null {
  if (poi.is_open_now === true) {
    return {
      label: 'Ouvert',
      kind: 'open',
      timingLabel: poi.closes_at_label ? `Ferme à ${poi.closes_at_label}` : null,
    }
  }

  if (poi.is_open_now === false) {
    return {
      label: 'Fermé',
      kind: 'closed',
      timingLabel: poi.next_open_label ? `Ouvre ${poi.next_open_label}` : null,
    }
  }

  return null
}

function OpeningStatusBadge({ poiId, status }: { poiId: string; status: OpeningStatus }) {
  const colorClass = status.kind === 'open' ? 'border-green-500 bg-green-500' : 'border-red-500 bg-red-500'

  return (
    <span
      data-testid={`recommendation-status-${poiId}`}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[9px] font-bold uppercase tracking-[0.18em] text-white shadow-sm ${colorClass}`}
    >
      <span className="h-1 w-1 rounded-full bg-white" aria-hidden="true" />
      {status.label}
    </span>
  )
}
