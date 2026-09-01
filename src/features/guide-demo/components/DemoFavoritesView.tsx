'use client'

import { MapPinned, Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import { DemoPoiImage } from './DemoPoiImage'
import type { DemoPoi } from '@/features/guide-demo/types'

type DemoFavoritesViewProps = {
  pois: readonly DemoPoi[]
  onOpenPoi: (poi: DemoPoi) => void
  onShowOnMap: (poi: DemoPoi) => void
}

export function DemoFavoritesView({
  pois,
  onOpenPoi,
  onShowOnMap,
}: DemoFavoritesViewProps) {
  const [categorySlug, setCategorySlug] = useState<string | null>(null)
  const categories = useMemo(
    () =>
      Array.from(
        new Map(pois.map(poi => [poi.category.slug, poi.category])).values(),
      ),
    [pois],
  )
  const visiblePois = categorySlug
    ? pois.filter(poi => poi.category.slug === categorySlug)
    : pois

  return (
    <section className="min-h-full bg-[#faf9f6] pb-32 pt-6">
      <div className="px-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#a68e69]">
          Saint-Gervais-les-Bains
        </p>
        <h1 className="mt-2 font-serif text-4xl italic tracking-[-0.04em] text-[#121212]">
          Nos coups de cœur
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Des adresses publiques sélectionnées pour cette démonstration.
        </p>
      </div>

      <div
        role="group"
        aria-label="Filtrer les catégories"
        className="no-scrollbar sticky top-0 z-10 mt-5 flex gap-2 overflow-x-auto border-y border-stone-200 bg-[#faf9f6]/95 px-5 py-3 backdrop-blur"
      >
        <button
          type="button"
          aria-pressed={categorySlug === null}
          onClick={() => setCategorySlug(null)}
          className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold transition-colors ${
            categorySlug === null
              ? 'bg-[#121212] text-white'
              : 'bg-white text-slate-700 ring-1 ring-stone-200'
          }`}
        >
          Tous
        </button>
        {categories.map(category => (
          <button
            key={category.slug}
            type="button"
            aria-pressed={categorySlug === category.slug}
            onClick={() => setCategorySlug(category.slug)}
            className={`shrink-0 rounded-full px-3 py-2 text-xs font-bold transition-colors ${
              categorySlug === category.slug
                ? 'bg-[#455e4c] text-white'
                : 'bg-white text-slate-700 ring-1 ring-stone-200'
            }`}
          >
            {category.name}
          </button>
        ))}
      </div>

      {visiblePois.length > 0 ? (
        <div
          data-testid="favorites-bento-grid"
          className="grid grid-cols-2 gap-3 px-4 pt-5"
        >
          {visiblePois.map((poi, index) => {
            const big = index === 0
            return (
              <article
                key={poi.id}
                data-testid="favorite-bento-card"
                data-variant={big ? 'big' : 'compact'}
                className={`group relative overflow-hidden rounded-[26px] bg-stone-200 shadow-sm ${
                  big ? 'col-span-2 aspect-square' : 'aspect-square'
                }`}
              >
                <DemoPoiImage
                  primarySrc={poi.photos[0]}
                  category={poi.category}
                  name={poi.name}
                  decorative
                  className="absolute inset-0 h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                  <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/80">
                    {poi.category.name}
                  </p>
                  <h2 className={`mt-1 font-serif italic leading-tight ${big ? 'text-3xl' : 'text-xl'}`}>
                    {poi.name}
                  </h2>
                  {poi.rating ? (
                    <p className="mt-1 flex items-center gap-1 text-xs font-semibold">
                      <Star className="h-3 w-3 fill-current" aria-hidden="true" />
                      {poi.rating.toFixed(1)}
                    </p>
                  ) : null}
                  <p className="mt-2 line-clamp-2 text-xs leading-4 text-white/90">
                    {poi.shortDescription}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => onOpenPoi(poi)}
                      className="rounded-full bg-white px-3 py-1.5 text-[10px] font-bold text-slate-900"
                    >
                      Ouvrir {poi.name}
                    </button>
                    <button
                      type="button"
                      onClick={() => onShowOnMap(poi)}
                      className="inline-flex items-center gap-1 rounded-full bg-black/35 px-3 py-1.5 text-[10px] font-bold text-white ring-1 ring-white/40"
                    >
                      <MapPinned className="h-3 w-3" aria-hidden="true" />
                      Afficher {poi.name} sur la carte
                    </button>
                  </div>
                </div>
              </article>
            )
          })}
        </div>
      ) : (
        <p className="px-5 pt-10 text-sm text-slate-600">
          Aucun coup de cœur dans cette catégorie.
        </p>
      )}
    </section>
  )
}
