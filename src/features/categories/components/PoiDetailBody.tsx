import Link from 'next/link'
import { ArrowLeft, Star, MapPin } from 'lucide-react'
import { PhotoCarousel } from './PhotoCarousel'
import { ActionButtons } from './ActionButtons'
import { HoursBlock } from './HoursBlock'
import { HikingBlock } from './HikingBlock'
import { MiniMap } from './MiniMap'
import { MerchantOffersBlock } from './MerchantOffersBlock'
import type { PoiDetail } from '../types'

interface Props {
  poi: PoiDetail
  citySlug: string
  categorySlug: string
}

export function PoiDetailBody({ poi, citySlug, categorySlug }: Props) {
  const distanceLabel =
    poi.distance_km === null
      ? null
      : poi.distance_km < 1
      ? `${Math.round(poi.distance_km * 1000)} m`
      : `${poi.distance_km.toFixed(1)} km`

  const poiUrl = `/guide/${citySlug}/${categorySlug}/${poi.slug}`

  return (
    <>
      {/* Hero */}
      <div className="relative h-[450px] w-full bg-gradient-to-br from-gold/20 to-gold/5">
        {poi.photos[0] && (
          <img
            src={poi.photos[0]}
            alt={poi.name}
            className="absolute inset-0 w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/40" />
        <div className="absolute top-8 left-6 right-6 flex justify-between items-center z-10">
          <Link
            href={`/guide/${citySlug}/${categorySlug}`}
            className="w-11 h-11 rounded-full bg-white/85 backdrop-blur flex items-center justify-center text-charcoal active:scale-95 transition-transform"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Content sheet */}
      <main className="relative bg-ivory rounded-t-[40px] -mt-8 pt-8 pb-32 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] space-y-6">

        {/* Header */}
        <div className="px-6 flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-bold uppercase tracking-widest text-gold">
              {poi.subcategory?.name ?? poi.category.name}
            </span>
            <h1 className="text-3xl font-serif italic leading-tight text-charcoal mt-1">{poi.name}</h1>
            <p className="text-xs text-charcoal/50 mt-1 truncate">{poi.address}</p>
          </div>
          {poi.rating !== null && (
            <div className="flex flex-col items-end ml-4 shrink-0">
              <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-2xl shadow-sm border border-gray-100">
                <Star className="w-3.5 h-3.5 text-charcoal fill-charcoal" />
                <span className="text-sm font-bold" data-testid="poi-detail-rating">
                  {poi.rating.toFixed(1)}
                </span>
              </div>
              <span className="text-[10px] text-charcoal/40 mt-1" data-testid="poi-detail-rating-count">
                {poi.rating_count} avis
              </span>
            </div>
          )}
        </div>

        {/* Distance */}
        {distanceLabel && (
          <div className="px-6">
            <span className="inline-flex items-center gap-1.5 text-sm text-charcoal/60">
              <MapPin className="w-4 h-4" />
              <span data-testid="poi-detail-distance">{distanceLabel}</span>
            </span>
          </div>
        )}

        {/* Description */}
        {poi.description && (
          <p className="px-6 text-sm text-charcoal/70 leading-relaxed">{poi.description}</p>
        )}

        <div className="px-6">
          <MerchantOffersBlock offers={poi.merchant_offers} />
        </div>

        {/* Photo carousel (additional photos) */}
        {poi.photos.length > 1 && (
          <PhotoCarousel photos={poi.photos.slice(1)} name={poi.name} />
        )}

        {/* Hours */}
        {poi.hours && (
          <div className="px-6">
            <HoursBlock is_open_now={poi.is_open_now} hours={poi.hours} />
          </div>
        )}

        {/* Mini map */}
        <div className="px-6">
          <MiniMap latitude={poi.latitude} longitude={poi.longitude} poiName={poi.name} />
        </div>

        {/* Action buttons */}
        <div className="px-6">
          <ActionButtons
            phone={poi.phone}
            website={poi.website}
            latitude={poi.latitude}
            longitude={poi.longitude}
            poiName={poi.name}
            poiUrl={poiUrl}
          />
        </div>

        {/* Hiking block */}
        {poi.hiking_detail && (
          <div className="px-6">
            <HikingBlock hiking={poi.hiking_detail} />
          </div>
        )}
      </main>
    </>
  )
}
