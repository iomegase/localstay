'use client'

import { useEffect, useRef, useState } from 'react'
import { PoiCard } from './PoiCard'
import { useUserLocation } from '@/features/geolocation/hooks/useUserLocation'
import { haversineKm } from '@/features/geolocation/lib/user-location'
import type { AllPoisCard } from '../queries/all-poi-cards'

interface Meta {
  page: number
  limit: number
  total: number
  total_pages: number
}

interface Props {
  citySlug: string
  initialItems: AllPoisCard[]
  initialMeta: Meta
  sort?: 'distance' | 'rating'
  lodgingId?: string | null
}

/**
 * Liste « Tous les POI » de la home, en scroll infini (10 par 10). La première page est
 * rendue côté serveur ; les suivantes sont chargées via /api/cities/[slug]/pois quand le
 * sentinel entre dans le viewport (IntersectionObserver). Chaque carte cible sa catégorie.
 */
export function AllPoisList({ citySlug, initialItems, initialMeta, sort = 'distance', lodgingId }: Props) {
  const [items, setItems] = useState<AllPoisCard[]>(initialItems)
  const [page, setPage] = useState(initialMeta.page)
  const [totalPages, setTotalPages] = useState(initialMeta.total_pages)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openPoiId, setOpenPoiId] = useState<string | null>(null)
  const sentinelRef = useRef<HTMLDivElement | null>(null)
  const { location } = useUserLocation()

  // Si la position utilisateur est connue, on recalcule la distance affichée
  // depuis sa vraie position (sans re-trier — parité avec CategoryViewWrapper).
  const displayedItems = location
    ? items.map(poi => ({
        ...poi,
        distance_km: haversineKm(location.latitude, location.longitude, poi.latitude, poi.longitude),
      }))
    : items

  // Re-synchronise si le serveur renvoie une nouvelle première page (changement de tri).
  useEffect(() => {
    setItems(initialItems)
    setPage(initialMeta.page)
    setTotalPages(initialMeta.total_pages)
  }, [initialItems, initialMeta.page, initialMeta.total_pages])

  useEffect(() => {
    if (openPoiId && !items.some(item => item.id === openPoiId)) {
      setOpenPoiId(null)
    }
  }, [items, openPoiId])

  const canLoadMore = page < totalPages

  async function loadMore() {
    if (loading || !canLoadMore) return
    setLoading(true)
    setError(null)
    const next = page + 1
    const qs = new URLSearchParams({ page: String(next), limit: String(initialMeta.limit), sort })
    if (lodgingId) qs.set('lodging', lodgingId)
    try {
      const res = await fetch(`/api/cities/${citySlug}/pois?${qs.toString()}`)
      if (!res.ok) throw new Error('failed')
      const json = (await res.json()) as { data: AllPoisCard[]; meta: Meta }
      setItems(current => [...current, ...json.data])
      setPage(json.meta.page)
      setTotalPages(json.meta.total_pages)
    } catch {
      setError('Impossible de charger plus de lieux.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const node = sentinelRef.current
    if (!node || !canLoadMore || loading) return
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting) void loadMore()
      },
      { rootMargin: '320px' },
    )
    observer.observe(node)
    return () => observer.disconnect()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canLoadMore, loading, page])

  return (
    <div className="space-y-3 mt-4">
      {displayedItems.map(poi => (
        <PoiCard
          key={poi.id}
          poi={poi}
          citySlug={citySlug}
          categorySlug={poi.category_slug}
          isExpanded={openPoiId === poi.id}
          onToggleExpanded={() => setOpenPoiId(current => current === poi.id ? null : poi.id)}
        />
      ))}

      {items.length === 0 && (
        <p className="py-8 text-center text-sm text-charcoal/50">Aucun lieu pour le moment.</p>
      )}

      {canLoadMore && <div ref={sentinelRef} className="h-8" aria-hidden />}

      {loading && <p className="py-4 text-center text-sm text-charcoal/40">Chargement…</p>}

      {error && (
        <div className="py-4 text-center">
          <p className="text-sm text-red-600">{error}</p>
          <button
            type="button"
            onClick={() => void loadMore()}
            className="mt-2 text-xs font-bold uppercase tracking-widest text-pine underline"
          >
            Réessayer
          </button>
        </div>
      )}
    </div>
  )
}
