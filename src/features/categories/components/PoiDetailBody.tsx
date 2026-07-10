import { ArrowLeft, Star } from 'lucide-react'
import { ActionButtons, type ActionButtonsVariant } from './ActionButtons'
import { HoursBlock } from './HoursBlock'
import { HikingBlock } from './HikingBlock'
import { MiniMap } from './MiniMap'
import { MerchantOffersBlock } from './MerchantOffersBlock'
import { HeroShareButton } from './HeroShareButton'
import { OwnerRecommendationNote } from './OwnerRecommendationNote'
import { PoiDetailHeroCarousel } from './PoiDetailHeroCarousel'
import { PoiDetailDistance } from './PoiDetailDistance'
import { PoiDetailTopBar } from './PoiDetailTopBar'
import { PoiBackButton } from './PoiBackButton'
import { TrailDetailBlock } from '@/features/trails-acquisition/components/TrailDetailBlock'
import { TrailPoiDetailBody } from '@/features/trail-navigation/components/TrailPoiDetailBody'
import { FavoriteToggleButton } from '@/features/public-menu/components/FavoriteToggleButton'
import { MarkdownText } from '@/shared/components/MarkdownText'
import type { PoiDetail } from '../types'
import { getPoiFallbackImage } from '../lib/poi-fallback-image'

interface Props {
  poi: PoiDetail
  citySlug: string
  categorySlug: string
  /** Si fourni, le bouton retour ferme la vue (mode modal) au lieu de naviguer vers la liste. */
  onClose?: () => void
  actionVariant?: ActionButtonsVariant
  ownerRecommendationNote?: string | null
}

export function PoiDetailBody({
  poi,
  citySlug,
  categorySlug,
  onClose,
  actionVariant = 'default',
  ownerRecommendationNote,
}: Props) {
  if (categorySlug === 'rando' && poi.trail_detail) {
    return (
      <TrailPoiDetailBody
        poi={poi}
        citySlug={citySlug}
        categorySlug={categorySlug}
        onClose={onClose}
        ownerRecommendationNote={ownerRecommendationNote}
      />
    )
  }

  const poiUrl = `/guide/${citySlug}/${categorySlug}/${poi.slug}`
  const photoAttributionHost = getWebsiteHost(poi.website)
  const fallbackPhoto = getPoiFallbackImage(poi.category.slug, poi.subcategory?.slug ?? poi.subcategory?.name)
  const heroPhotos = poi.photos.length > 0 ? poi.photos : fallbackPhoto ? [fallbackPhoto] : []

  return (
    <>
      {/* Barre d'actions épinglée, masquée au scroll vers le bas */}
      <PoiDetailTopBar>
        {onClose ? (
          <button
            type="button"
            onClick={onClose}
            aria-label="Fermer"
            className="w-10 h-10 mt-4 rounded-full bg-white/10 backdrop-blur flex items-center justify-center text-charcoal/60 active:scale-95 transition-transform hover:bg-white/40"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
        ) : (
          <PoiBackButton />
        )}
        <div className="flex mt-2 mr-14 items-center gap-2">
          <HeroShareButton poiName={poi.name} poiUrl={poiUrl} />
          <FavoriteToggleButton
            variant="icon"
            poi={{
              poi_id: poi.id,
              name: poi.name,
              city_slug: citySlug,
              category_slug: categorySlug,
              poi_slug: poi.slug,
              photo: poi.photos?.[0] ?? null,
              added_at: '',
            }}
          />
        </div>
      </PoiDetailTopBar>

      {/* Hero */}
      <PoiDetailHeroCarousel photos={heroPhotos} name={poi.name} poiId={poi.id}>
        {poi.is_open_now === true && (
          <div
            data-testid="poi-detail-hero-open-badge-wrapper"
            className="absolute bottom-8 left-6 z-10 pb-4"
          >
            <span
              data-testid="poi-detail-hero-open-badge"
              className="inline-flex rounded-full border border-green-200 bg-green-50/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-green-700 shadow-sm backdrop-blur"
            >
              Ouvert
            </span>
          </div>
        )}
      </PoiDetailHeroCarousel>

      {/* Content sheet */}
      <main className="relative bg-slate-50  -mt-8 pt-8 pb-32 z-20 shadow-[0_-10px_40px_rgba(0,0,0,0.08)] space-y-6">

        {/* Header */}
        <div className="px-6 flex justify-between items-start">
          <div className="flex-1 min-w-0">
            <span className="text-[9px] font-bold uppercase tracking-widest text-pink-600">
              {poi.subcategory?.name ?? poi.category.name}
            </span>
            <h1 className="text-xl uppercase leading-tight text-charcoal mt-1">{poi.name}</h1>
            <p className="mt-5 text-xs text-charcoal/50  truncate">{poi.address}</p>
          </div>
          {poi.rating !== null && (
            <div className="flex flex-row items-center justify-between ml-4 shrink-0">
              <div className="flex items-center gap-1 bg-white px-3 py-1.5 rounded-2xl shadow-sm border border-gray-100">
                <Star className="w-3.5 h-3.5 text-pink-600 fill-pink-600" />
                <span className="text-sm font-bold" data-testid="poi-detail-rating">
                  {poi.rating.toFixed(1)}
                </span>
              </div>
              <span className="text-[10px] ml-3 text-charcoal/40 mt-1" data-testid="poi-detail-rating-count">
                {poi.rating_count} avis
              </span>
            </div>
          )}
        </div>

        {/* Distance */}
        <PoiDetailDistance
          distanceKm={poi.distance_km}
          distanceSource={poi.distance_source}
          latitude={poi.latitude}
          longitude={poi.longitude}
        />

        {/* Description */}
        {poi.description && (
          <MarkdownText
            source={poi.description}
            breaks
            className="px-6 text-sm text-charcoal/70 leading-relaxed"
          />
        )}

        <OwnerRecommendationNote note={ownerRecommendationNote ?? null} />

        <div className="px-6">
          <MerchantOffersBlock offers={poi.merchant_offers} />
        </div>

     

        {/* Hours */}
        {poi.hours && (
          <div className="px-4">
            <HoursBlock is_open_now={poi.is_open_now} hours={poi.hours} showOpenBadge={false} />
          </div>
        )}

        {/* Mini map */}
        <div className="">
          <MiniMap latitude={poi.latitude} longitude={poi.longitude} poiName={poi.name} />
        </div>

        {poi.photos.length > 0 && poi.website && photoAttributionHost && (
          <div className="px-6">
            <a
              href={poi.website}
              target="_blank"
              rel="noreferrer"
              data-testid="photo-attribution"
              className="text-[11px] text-charcoal/45 underline underline-offset-2"
            >
              Photos : {photoAttributionHost}
            </a>
          </div>
        )}

        {/* Action buttons */}
        <div className="px-6">
          <ActionButtons
            phone={poi.phone}
            website={poi.website}
            latitude={poi.latitude}
            longitude={poi.longitude}
            address={poi.address}
            variant={actionVariant}
          />
        </div>

        {/* Trail block, with legacy hiking fallback */}
        {poi.trail_detail && (
          <div className="px-6">
            <TrailDetailBlock trail={poi.trail_detail} />
          </div>
        )}

        {!poi.trail_detail && poi.hiking_detail && (
          <div className="px-6">
            <HikingBlock hiking={poi.hiking_detail} />
          </div>
        )}
      </main>
    </>
  )
}

function getWebsiteHost(website: string | null): string | null {
  if (!website) return null

  try {
    return new URL(website).hostname
  } catch {
    return null
  }
}
