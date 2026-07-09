'use client'
import { useEffect, useState } from 'react'
import { Compass, MapPin, Grid2x2 } from 'lucide-react'
import { PoiCard } from './PoiCard'
import { useUserLocation } from '@/features/geolocation/hooks/useUserLocation'
import { haversineKm } from '@/features/geolocation/lib/user-location'
import type { PoiCard as PoiCardType } from '../types'

interface Props {
  primary: PoiCardType[]
  nearby: PoiCardType[]
  citySlug: string
  categorySlug: string
  cityCenter: { latitude: number; longitude: number }
  categoryIcon?: string
  categoryColor?: string
  subcategoryCount?: number
  subcategorySlug?: string
  sort?: 'distance' | 'rating'
  page?: number
  limit?: number
  totalPages?: number
  lodgingId?: string
}

function withDisplayedDistance(
  pois: PoiCardType[],
  userLocation: { latitude: number; longitude: number } | null,
): PoiCardType[] {
  if (!userLocation) return pois
  return pois.map(poi => ({
    ...poi,
    distance_km: haversineKm(userLocation.latitude, userLocation.longitude, poi.latitude, poi.longitude),
    distance_source: 'user_location' as const,
  }))
}

export function CategoryViewWrapper({
  primary,
  nearby,
  citySlug,
  categorySlug,
  subcategoryCount = 0,
  subcategorySlug,
  sort = 'distance',
  page = 1,
  limit = 20,
  totalPages = 1,
  lodgingId,
}: Props) {
  const [primaryItems, setPrimaryItems] = useState(primary)
  const [nearbyItems, setNearbyItems] = useState(nearby)
  const [currentPage, setCurrentPage] = useState(page)
  const [currentTotalPages, setCurrentTotalPages] = useState(totalPages)
  const { location: userLocation } = useUserLocation()
  const [isLoadingMore, setIsLoadingMore] = useState(false)
  const [loadMoreError, setLoadMoreError] = useState<string | null>(null)
  const [openPoiId, setOpenPoiId] = useState<string | null>(null)

  useEffect(() => {
    setPrimaryItems(primary)
    setNearbyItems(nearby)
    setCurrentPage(page)
    setCurrentTotalPages(totalPages)
  }, [primary, nearby, page, totalPages])

  useEffect(() => {
    const visiblePoiIds = new Set([...primaryItems, ...nearbyItems].map(poi => poi.id))
    if (openPoiId && !visiblePoiIds.has(openPoiId)) {
      setOpenPoiId(null)
    }
  }, [primaryItems, nearbyItems, openPoiId])

  const displayedPrimary = withDisplayedDistance(primaryItems, userLocation)
  const displayedNearby = withDisplayedDistance(nearbyItems, userLocation)
  const pois = [...displayedPrimary, ...displayedNearby]
  const canLoadMore = currentPage < currentTotalPages

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

  function scrollToList() {
    document.getElementById('poi-list-section')?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <>
      {/* La géolocalisation se pilote désormais depuis la nav du footer (GeoNavButton) ;
          les distances ci-dessous se recalculent automatiquement quand elle est activée. */}

      {/* Récap + Explorer */}

      {/* <section className="mt-6 px-5">
        <div className="rounded-[2rem] border border-gray-100 bg-white p-5 shadow-sm">
          <div className="grid grid-cols-3 divide-x divide-gray-100">
            <div className="px-2 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-ivory text-pine">
                <MapPin className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold">{pois.length}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                lieux
              </p>
            </div>

            <div className="px-2 text-center">
              <div className="mx-auto mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-ivory text-pine">
                <Grid2x2 className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold">{subcategoryCount}</p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                sous-cat.
              </p>
            </div>

            <div className="px-2 text-center">
              <button
                type="button"
                onClick={scrollToList}
                className="flex h-full min-h-[86px] w-full flex-col items-center justify-center gap-2 rounded-[1.5rem] bg-pine text-white transition active:scale-[0.98]"
              >
                <Compass className="h-5 w-5" />
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  Explorer
                </span>
              </button>
            </div>
          </div>
        </div>
      </section> */}

      {/* Liste des POI */}
      <section id="poi-list-section" className="mt-6 " data-testid="poi-list-view">
        {/* <h2 className="mb-4 px-4 text-[10px] font-bold uppercase tracking-[0.3em] text-pink-600">
          Quelques recommandations 
        </h2> */}

        <div className="space-y-3">
          {displayedPrimary.map(poi => (
            <PoiCard
              key={poi.id}
              poi={poi}
              citySlug={citySlug}
              categorySlug={categorySlug}
              isExpanded={openPoiId === poi.id}
              onToggleExpanded={() => setOpenPoiId(current => current === poi.id ? null : poi.id)}
            />
          ))}
          {displayedPrimary.length === 0 && displayedNearby.length === 0 && (
            <p className="py-8 text-center text-sm text-charcoal/50">Aucun résultat</p>
          )}
        </div>

        {displayedNearby.length > 0 && (
          <div className="mt-6">
            <h3 className="mb-3 text-xs font-bold uppercase tracking-widest text-charcoal/40">
              Autres activités aux alentours
            </h3>
            <div className="space-y-3">
              {displayedNearby.map(poi => (
                <PoiCard
                  key={poi.id}
                  poi={poi}
                  citySlug={citySlug}
                  categorySlug={categorySlug}
                  isExpanded={openPoiId === poi.id}
                  onToggleExpanded={() => setOpenPoiId(current => current === poi.id ? null : poi.id)}
                />
              ))}
            </div>
          </div>
        )}

        {canLoadMore && (
          <div className="py-6">
            <button
              onClick={loadMore}
              disabled={isLoadingMore}
              className="w-full rounded-full border border-pine/30 px-4 py-2 text-sm font-semibold text-pine transition-transform active:scale-[0.99] disabled:opacity-60"
            >
              {isLoadingMore ? 'Chargement...' : 'Charger plus'}
            </button>
            {loadMoreError && (
              <p className="mt-2 text-center text-xs text-red-700">{loadMoreError}</p>
            )}
          </div>
        )}
      </section>
    </>
  )
}
