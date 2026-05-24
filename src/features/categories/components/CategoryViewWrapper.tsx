'use client'
import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { LocateFixed, Map, List } from 'lucide-react'
import { PoiCard } from './PoiCard'
import type { PoiCard as PoiCardType } from '../types'

const FullMap = dynamic(
  () => import('./FullMap').then(m => ({ default: m.FullMap })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[520px] rounded-[2.4rem] bg-stone/20 animate-pulse" data-testid="map-loading" />
    ),
  },
)

interface Props {
  primary: PoiCardType[]
  nearby: PoiCardType[]
  citySlug: string
  categorySlug: string
  cityCenter: { latitude: number; longitude: number }
  subcategorySlug?: string
  sort?: 'distance' | 'rating'
  page?: number
  limit?: number
  totalPages?: number
  lodgingId?: string
}

function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLon = ((lon2 - lon1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function withDisplayedDistance(
  pois: PoiCardType[],
  userLocation: { latitude: number; longitude: number } | null,
): PoiCardType[] {
  if (!userLocation) return pois
  return pois.map(poi => ({
    ...poi,
    distance_km: haversineKm(userLocation.latitude, userLocation.longitude, poi.latitude, poi.longitude),
  }))
}

export function CategoryViewWrapper({
  primary,
  nearby,
  citySlug,
  categorySlug,
  cityCenter,
  subcategorySlug,
  sort = 'distance',
  page = 1,
  limit = 20,
  totalPages = 1,
  lodgingId,
}: Props) {
  const [view, setView] = useState<'list' | 'map'>('list')
  const [primaryItems, setPrimaryItems] = useState(primary)
  const [nearbyItems, setNearbyItems] = useState(nearby)
  const [currentPage, setCurrentPage] = useState(page)
  const [currentTotalPages, setCurrentTotalPages] = useState(totalPages)
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [geoStatus, setGeoStatus] = useState<'idle' | 'loading' | 'ready' | 'unavailable' | 'denied'>('idle')
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null)

  useEffect(() => {
    setPrimaryItems(primary)
    setNearbyItems(nearby)
    setCurrentPage(page)
    setCurrentTotalPages(totalPages)
  }, [primary, nearby, page, totalPages])

  const displayedPrimary = withDisplayedDistance(primaryItems, userLocation)
  const displayedNearby = withDisplayedDistance(nearbyItems, userLocation)
  const pois = [...displayedPrimary, ...displayedNearby]
  const canLoadMore = currentPage < currentTotalPages

  function requestUserLocation() {
    if (!navigator.geolocation) {
      setGeoStatus('unavailable')
      return
    }

    setGeoStatus('loading')
    navigator.geolocation.getCurrentPosition(
      position => {
        setUserLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        })
        setGeoStatus('ready')
      },
      () => {
        setGeoStatus('denied')
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 },
    )
  }

  async function loadMore() {
    if (!canLoadMore || isLoadingMore) return

    setIsLoadingMore(true)
    setLoadMoreError(null)
    const nextPage = currentPage + 1
    const params = new URLSearchParams({
      sort,
      page: String(nextPage),
      limit: String(limit),
    })
    if (subcategorySlug) params.set('subcategory', subcategorySlug)
    if (lodgingId) params.set('lodging', lodgingId)

    try {
      const response = await fetch(`/api/cities/${citySlug}/categories/${categorySlug}/pois?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to load more POIs')
      const payload = await response.json() as {
        data: { primary: PoiCardType[]; nearby: PoiCardType[] }
        meta: { page: number; total_pages: number }
      }
      setPrimaryItems(items => [...items, ...payload.data.primary])
      setNearbyItems(items => [...items, ...payload.data.nearby])
      setCurrentPage(payload.meta.page)
      setCurrentTotalPages(payload.meta.total_pages)
    } catch {
      setLoadMoreError('Impossible de charger plus de résultats.')
    } finally {
      setIsLoadingMore(false)
    }
  }

  return (
    <>
      <div className="px-4 pb-2 flex items-center justify-between gap-2">
        <button
          onClick={requestUserLocation}
          disabled={geoStatus === 'loading'}
          className="flex items-center gap-1.5 text-xs font-semibold text-charcoal/70 border border-charcoal/15 px-3 py-1.5 rounded-full active:scale-95 transition-transform disabled:opacity-60"
        >
          <LocateFixed className="w-3.5 h-3.5" />
          {geoStatus === 'ready' ? 'Position utilisée' : geoStatus === 'loading' ? 'Localisation...' : 'Utiliser ma position'}
        </button>
        <button
          onClick={() => setView(v => v === 'list' ? 'map' : 'list')}
          data-testid="map-toggle"
          className="flex items-center gap-1.5 text-xs font-semibold text-pine border border-pine/30 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
        >
          {view === 'list' ? (
            <><Map className="w-3.5 h-3.5" /> Voir la carte</>
          ) : (
            <><List className="w-3.5 h-3.5" /> Voir la liste</>
          )}
        </button>
      </div>

      {view === 'list' ? (
        <div data-testid="poi-list-view">
          {(geoStatus === 'denied' || geoStatus === 'unavailable') && (
            <p className="px-4 pt-1 text-xs text-charcoal/50">
              Position indisponible, distances affichées depuis le centre-ville.
            </p>
          )}

          <div className="px-4 pt-2 space-y-2">
            {displayedPrimary.map(poi => (
              <PoiCard key={poi.id} poi={poi} citySlug={citySlug} categorySlug={categorySlug} />
            ))}
            {displayedPrimary.length === 0 && displayedNearby.length === 0 && (
              <p className="text-sm text-charcoal/50 py-8 text-center">Aucun résultat</p>
            )}
          </div>

          {displayedNearby.length > 0 && (
            <div className="mt-6 px-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-charcoal/40 mb-3">
                Autres activités aux alentours
              </h2>
              <div className="space-y-2">
                {displayedNearby.map(poi => (
                  <PoiCard key={poi.id} poi={poi} citySlug={citySlug} categorySlug={categorySlug} />
                ))}
              </div>
            </div>
          )}

          {canLoadMore && (
            <div className="px-4 py-6">
              <button
                onClick={loadMore}
                disabled={isLoadingMore}
                className="w-full rounded-full border border-pine/30 px-4 py-2 text-sm font-semibold text-pine active:scale-[0.99] transition-transform disabled:opacity-60"
              >
                {isLoadingMore ? 'Chargement...' : 'Charger plus'}
              </button>
              {loadMoreError && (
                <p className="mt-2 text-center text-xs text-red-700">{loadMoreError}</p>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="px-4 pt-2" data-testid="map-view">
          <FullMap
            pois={pois}
            cityCenter={cityCenter}
            citySlug={citySlug}
            categorySlug={categorySlug}
          />
        </div>
      )}
    </>
  )
}
