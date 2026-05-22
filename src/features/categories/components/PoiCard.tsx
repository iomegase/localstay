import Link from 'next/link'
import { Star, MapPin } from 'lucide-react'
import type { PoiCard as PoiCardType } from '../types'

interface Props {
  poi: PoiCardType
  citySlug: string
  categorySlug: string
}

export function PoiCard({ poi, citySlug, categorySlug }: Props) {
  const distanceLabel =
    poi.distance_km < 1
      ? `${Math.round(poi.distance_km * 1000)} m`
      : `${poi.distance_km.toFixed(1)} km`

  return (
    <Link
      href={`/guide/${citySlug}/${categorySlug}/${poi.slug}`}
      className="flex gap-3 bg-white rounded-2xl shadow-sm overflow-hidden active:scale-[0.98] transition-transform"
      data-testid={`poi-card-${poi.slug}`}
    >
      {/* Photo */}
      <div className="w-24 h-24 flex-shrink-0 bg-gold/10 relative">
        {poi.photo_url ? (
          <img
            src={poi.photo_url}
            alt={poi.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-gold/20 to-gold/5" />
        )}
        {poi.is_open_now === false && (
          <span
            className="absolute top-1 left-1 bg-charcoal text-white text-[9px] font-bold uppercase px-1.5 py-0.5 rounded-full"
            data-testid="badge-closed"
          >
            Fermé
          </span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 py-3 pr-3 min-w-0">
        {poi.subcategory_name && (
          <span className="text-[9px] font-bold uppercase tracking-widest text-gold">
            {poi.subcategory_name}
          </span>
        )}
        <h3 className="text-sm font-semibold text-charcoal leading-tight truncate">
          {poi.name}
        </h3>
        <p className="text-xs text-charcoal/50 truncate mt-0.5">{poi.address}</p>
        <div className="flex items-center gap-3 mt-1.5">
          {poi.rating !== null && (
            <span
              className="flex items-center gap-0.5 text-xs text-charcoal/70"
              data-testid="poi-rating"
            >
              <Star className="w-3 h-3 text-gold fill-gold" />
              {poi.rating.toFixed(1)}
            </span>
          )}
          <span
            className="flex items-center gap-0.5 text-xs text-charcoal/50"
            data-testid="poi-distance"
          >
            <MapPin className="w-3 h-3" />
            {distanceLabel}
          </span>
        </div>
      </div>
    </Link>
  )
}
