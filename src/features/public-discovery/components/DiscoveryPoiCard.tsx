import Link from 'next/link'
import { ArrowUpRight, MapPin, Star } from 'lucide-react'
import type { DiscoveryPoiCard as DiscoveryPoiCardDto } from '../types'
import { RemotePoiImage } from './RemotePoiImage'

const distanceFormatter = new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 1 })

export function DiscoveryPoiCard({
  citySlug,
  poi,
}: {
  citySlug: string
  poi: DiscoveryPoiCardDto
}) {
  const href = `/decouvrir/${citySlug}/${poi.category.slug}/${poi.slug}`

  return (
    <article className="group min-w-0 overflow-hidden rounded-[24px] border border-slate-100 bg-white shadow-[0_14px_38px_rgba(15,23,42,0.08)] transition-transform duration-300 hover:-translate-y-1 motion-reduce:transform-none motion-reduce:transition-none">
      <Link
        href={href}
        aria-label={`Découvrir ${poi.name}`}
        className="block h-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600"
      >
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
          <RemotePoiImage
            src={poi.photo_url}
            alt={`${poi.name} à ${poi.address}`}
            width={800}
            height={600}
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03] motion-reduce:transform-none motion-reduce:transition-none"
          />
          <span className="absolute right-4 top-4 grid h-9 w-9 place-items-center rounded-full bg-white/90 text-slate-800 shadow-sm backdrop-blur-sm">
            <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
          </span>
        </div>

        <div className="p-5 sm:p-6">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-pink-600">
            {poi.subcategory?.name ?? poi.category.name}
          </p>
          <h3 className="mt-2 text-xl font-semibold leading-tight tracking-[-0.035em] text-slate-900">
            {poi.name}
          </h3>
          <p className="mt-3 flex items-start gap-2 text-xs leading-5 text-slate-500">
            <MapPin aria-hidden="true" className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pink-600" />
            <span>{poi.address}</span>
          </p>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] font-semibold text-slate-500">
            {poi.rating !== null ? (
              <span className="inline-flex items-center gap-1 text-slate-800">
                <Star aria-hidden="true" className="h-3.5 w-3.5 fill-pink-600 text-pink-600" />
                {distanceFormatter.format(poi.rating)}
                {poi.rating_count !== null ? ` (${poi.rating_count})` : ''}
              </span>
            ) : null}
            <span>{distanceFormatter.format(poi.distance_km)} km du centre</span>
          </div>
        </div>
      </Link>
    </article>
  )
}
