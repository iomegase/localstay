'use client'

import { useEffect, useState } from 'react'
import { PoiDetailBody } from '@/features/categories/components/PoiDetailBody'
import type { PoiDetail } from '@/features/categories/types'
import type { FavoritePoi } from '../lib/favorites'

/**
 * Affiche une fiche POI (favori) en overlay client — sans changement d'URL. La fiche
 * détaillée est récupérée via l'API ; la fermeture est gérée par le bouton retour du
 * body (transformé en « fermer » via onClose) et par la touche Échap.
 */
export function FavoritePoiModal({ fav, onClose }: { fav: FavoritePoi; onClose: () => void }) {
  const [poi, setPoi] = useState<PoiDetail | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let active = true
    setStatus('loading')
    fetch(`/api/cities/${fav.city_slug}/categories/${fav.category_slug}/pois/${fav.poi_slug}`)
      .then(res => (res.ok ? res.json() : Promise.reject(new Error('not ok'))))
      .then((payload: { data: PoiDetail }) => {
        if (!active) return
        setPoi(payload.data)
        setStatus('ready')
      })
      .catch(() => {
        if (active) setStatus('error')
      })
    return () => {
      active = false
    }
  }, [fav.city_slug, fav.category_slug, fav.poi_slug])

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-[100] overflow-y-auto bg-ivory"
      role="dialog"
      aria-modal="true"
      aria-label={fav.name}
      data-testid="favorite-poi-modal"
    >
      <div className="relative mx-auto min-h-full max-w-[430px] bg-ivory">
        {status === 'loading' && (
          <div className="flex h-screen items-center justify-center" data-testid="favorite-poi-loading">
            <span className="h-8 w-8 animate-spin rounded-full border-[3px] border-gold/30 border-t-gold" />
          </div>
        )}

        {status === 'error' && (
          <div className="flex h-screen flex-col items-center justify-center gap-4 px-8 text-center">
            <p className="text-sm text-gray-500">Impossible de charger cette fiche.</p>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-charcoal px-6 py-2 text-xs font-bold uppercase tracking-widest text-charcoal"
            >
              Fermer
            </button>
          </div>
        )}

        {status === 'ready' && poi && (
          <PoiDetailBody
            poi={poi}
            citySlug={fav.city_slug}
            categorySlug={fav.category_slug}
            onClose={onClose}
          />
        )}
      </div>
    </div>
  )
}
