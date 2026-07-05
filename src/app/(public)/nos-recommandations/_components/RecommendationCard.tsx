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
  const { poi } = row
  const citySlug = poi.city?.slug ?? fallbackCitySlug
  const href = `/guide/${citySlug}/${poi.category.slug}/${poi.slug}`
  const photo = poi.photos?.[0] ?? null

  if (variant === 'bigImage') {
    return (
      <Link
        href={href}
        className="group relative col-span-2 min-h-[360px] overflow-hidden rounded-[2rem] bg-charcoal shadow-[0_10px_28px_rgba(0,0,0,0.10)]"
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
        <div className="relative flex h-full min-h-[360px] flex-col justify-center p-5 text-white">
          {showCategory && (
            <div className="mb-3 w-fit rounded-full bg-white/15 px-3 py-1 text-[9px] font-bold uppercase tracking-[0.25em] backdrop-blur">
              {poi.category.name}
            </div>
          )}
          <h3 className=" text-2xl uppercase  leading-none">{poi.name}</h3>
          {/* {poi.description && (
            <p className="mt-3 max-w-lg text-sm leading-6 text-white/65 line-clamp-2">{poi.description}</p>
          )} */}
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
        className="group flex flex-col justify-center relative min-h-[180px] overflow-hidden rounded-[1.75rem] bg-charcoal shadow-[0_10px_28px_rgba(0,0,0,0.10)]"
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
        <div className="relative flex h-full min-h-[180px] flex-col justify-center p-4 text-white">
          {showCategory && (
            <p className="mb-2 text-[9px] font-bold uppercase tracking-[0.25em] text-pink-600">{poi.category.name}</p>
          )}
          <h3 className="uppercase text-md  leading-tight">{poi.name}</h3>
          {/* {poi.description && (
            <p className="mt-2 text-xs leading-5 text-white/75 line-clamp-2">{poi.description}</p>
          )} */}
        </div>
      </Link>
    )
  }

  // variant 'white' | 'sand'
  const bg = variant === 'sand' ? 'bg-sand' : 'bg-white'
  return (
    <Link
      href={href}
      className={`group relative min-h-[180px] overflow-hidden rounded-[1.75rem] ${bg} p-4 shadow-[0_10px_28px_rgba(0,0,0,0.10)] transition hover:-translate-y-0.5`}
    >
      <div className="flex h-full flex-col justify-center text-center items-center">
        <div>
          {showCategory && (
            <p className="text-[9px] font-bold uppercase tracking-[0.25em] text-pink-600">{poi.category.name}</p>
          )}
          <h3 className="mt-2 uppercase text-sm leading-tight text-charcoal">{poi.name}</h3>
          {poi.description && (
            <p className="mt-2 text-xs leading-5 text-gray-500 line-clamp-3">{poi.description}</p>
          )}
        </div>
        <span className="mt-4 inline-flex self-center items-center gap-2 text-[10px] font-bold rounded-full p-2 uppercase tracking-widest bg-black text-white/80 w-auto shadow-md transition hover:bg-white hover:text-charcoal">
          Voir
          <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
        </span>
      </div>
    </Link>
  )
}
