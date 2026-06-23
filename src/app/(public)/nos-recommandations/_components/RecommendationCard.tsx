import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import type { CardVariant, RecRow } from './variants'

type Props = {
  row: RecRow
  variant: CardVariant
  fallbackCitySlug: string
  showCategory?: boolean
}

export function RecommendationCard({ row, variant, fallbackCitySlug, showCategory = true }: Props) {
  const { poi, owner_note } = row
  const citySlug = poi.city?.slug ?? fallbackCitySlug
  const href = `/guide/${citySlug}/${poi.category.slug}/${poi.slug}`
  const photo = poi.photos?.[0] ?? null

  const note = owner_note ? (
    <p
      data-testid="owner-recommendation-comment"
      className="text-sm font-medium leading-relaxed"
    >
      {owner_note}
    </p>
  ) : null

  if (variant === 'bigImage') {
    return (
      <Link
        href={href}
        className="group relative col-span-2 min-h-[360px] overflow-hidden rounded-[2rem] bg-charcoal shadow-soft"
      >
        {photo && (
          <img
            src={photo}
            alt={poi.name}
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
            loading="lazy"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
        <div className="relative flex h-full min-h-[360px] flex-col justify-end p-5 text-white">
          {showCategory && (
            <div className="mb-3 w-fit rounded-full bg-white/15 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.25em] backdrop-blur">
              {poi.category.name}
            </div>
          )}
          <h3 className="font-serif text-3xl italic leading-none">{poi.name}</h3>
          {note && <div className="mt-4 max-w-lg text-white/90">{note}</div>}
          {poi.description && (
            <p className="mt-3 max-w-lg text-sm leading-6 text-white/65 line-clamp-2">{poi.description}</p>
          )}
          <span className="mt-5 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/80">
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
        className="group relative min-h-[180px] overflow-hidden rounded-[1.75rem] bg-charcoal shadow-soft"
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
        <div className="relative flex h-full min-h-[180px] flex-col justify-end p-4 text-white">
          {showCategory && (
            <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.25em] text-gold">{poi.category.name}</p>
          )}
          <h3 className="font-serif text-2xl italic leading-tight">{poi.name}</h3>
          {poi.description && (
            <p className="mt-2 text-xs leading-5 text-white/75 line-clamp-2">{poi.description}</p>
          )}
        </div>
      </Link>
    )
  }

  if (variant === 'note') {
    return (
      <Link
        href={href}
        className="group relative min-h-[180px] overflow-hidden rounded-[1.75rem] bg-charcoal p-4 text-white shadow-soft"
      >
        <div className="flex h-full flex-col justify-between">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-gold">Note de l’hôte</p>
            {note ? (
              <div className="mt-3 font-serif text-xl italic leading-tight">{owner_note}</div>
            ) : (
              <h3 className="mt-3 font-serif text-xl italic leading-tight">{poi.name}</h3>
            )}
          </div>
          <span className="mt-4 inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-white/70">
            {poi.name}
            <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
          </span>
        </div>
      </Link>
    )
  }

  // variant 'white' | 'sand'
  const bg = variant === 'sand' ? 'bg-sand' : 'bg-white'
  return (
    <Link
      href={href}
      className={`group relative min-h-[180px] overflow-hidden rounded-[1.75rem] ${bg} p-4 shadow-soft transition hover:-translate-y-0.5`}
    >
      <div className="flex h-full flex-col justify-between">
        <div>
          {showCategory && (
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-gold">{poi.category.name}</p>
          )}
          <h3 className="mt-2 font-serif text-xl italic leading-tight text-charcoal">{poi.name}</h3>
          {note && <div className="mt-2 text-charcoal">{note}</div>}
          {poi.description && (
            <p className="mt-2 text-xs leading-5 text-gray-500 line-clamp-3">{poi.description}</p>
          )}
        </div>
        <div className="mt-4 flex items-center justify-between">
          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Voir</span>
          <ArrowRight className="h-4 w-4 text-gray-300 transition group-hover:translate-x-1 group-hover:text-charcoal" />
        </div>
      </div>
    </Link>
  )
}
