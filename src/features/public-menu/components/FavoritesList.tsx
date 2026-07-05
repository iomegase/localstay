'use client'

import { useEffect, useState } from 'react'
import { ChevronRight, Heart, Trash2 } from 'lucide-react'
import {
  type FavoritePoi,
  readFavorites,
  removeFavorite,
  subscribeToFavorites,
} from '../lib/favorites'
import { FavoritePoiModal } from './FavoritePoiModal'

export function FavoritesList() {
  const [favorites, setFavorites] = useState<FavoritePoi[] | null>(null)
  const [selected, setSelected] = useState<FavoritePoi | null>(null)

  useEffect(() => {
    setFavorites(readFavorites())
    return subscribeToFavorites(() => setFavorites(readFavorites()))
  }, [])

  if (favorites === null) {
    return <p className="text-sm text-gray-400">Chargement…</p>
  }

  if (favorites.length === 0) {
    return (
      <div className="border border-dashed border-gray-200 bg-white p-8 text-center shadow-sm">
        <Heart className="mx-auto h-8 w-8 text-pink-600" />
        <p className="mt-3 text-sm text-gray-500">
          Aucun favori pour le moment.
        </p>
        <p className="mt-1 text-xs text-gray-400">
          Tapez sur l&apos;icône cœur depuis la fiche d&apos;un lieu pour le sauvegarder.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="mt-4 space-y-3 pb-8">
        {favorites.map(fav => (
          <FavoriteCard key={fav.poi_id} fav={fav} onOpen={() => setSelected(fav)} />
        ))}
      </div>
      {selected && <FavoritePoiModal fav={selected} onClose={() => setSelected(null)} />}
    </>
  )
}

function FavoriteCard({ fav, onOpen }: { fav: FavoritePoi; onOpen: () => void }) {
  const categoryLabel = fav.category_slug.replace(/-/g, ' ')

  return (
    <article
      data-testid={`favorite-card-${fav.poi_id}`}
      className="group flex w-full flex-col overflow-hidden rounded-none border border-gray-100 bg-white shadow-[0_20px_50px_rgba(0,0,0,0.08)] transition-transform duration-300 hover:-translate-y-1"
    >
      <div
        data-testid={`favorite-card-hero-${fav.poi_id}`}
        className="relative h-[220px] shrink-0 overflow-hidden bg-gradient-to-br from-pink-600/20 to-pink-600/5"
      >
        {fav.photo ? (
          <img
            src={fav.photo}
            alt={fav.name}
            className="absolute inset-0 h-full w-full object-cover transition duration-700 group-hover:scale-105"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-pink-600">
            <Heart className="h-8 w-8" />
          </div>
        )}

        <span
          data-testid={`favorite-card-category-${fav.poi_id}`}
          className="absolute left-4 top-4 inline-flex rounded-full border border-charcoal/40 bg-white/80 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wide text-charcoal shadow-sm backdrop-blur-sm"
        >
          {categoryLabel}
        </span>

        <div className="absolute right-4 top-4 flex items-center gap-2">
          <button
            type="button"
            onClick={() => removeFavorite(fav.poi_id)}
            aria-label={`Retirer ${fav.name} des favoris`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-gray-700 shadow-lg backdrop-blur-sm transition-colors hover:bg-white hover:text-red-500"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          {/* <button
            type="button"
            onClick={onOpen}
            aria-label={`Ouvrir ${fav.name}`}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white/70 text-gray-700 shadow-lg backdrop-blur-sm transition-colors hover:bg-white"
          >
            <ArrowRight className="h-4 w-4" />
          </button> */}
        </div>
      </div>

      <button
        type="button"
        onClick={onOpen}
        aria-label={`Ouvrir ${fav.name}`}
        className="flex w-full items-center justify-between gap-4 p-6 text-left"
      >
        <span className="min-w-0 flex-1">
          {/* <span className="mb-1 flex items-center gap-2">
            <span className="font-thin text-[11px] text-gray-800">{categoryLabel}</span>
            <span className="text-[11px] font-thin text-gray-400">favori sauvegardé</span>
          </span> */}
          <span className="block text-[13px] uppercase font-thin leading-tight tracking-widest text-gray-900  decoration-gray-300 group-hover:text-gray-800 ">
            {fav.name}
          </span>
        </span>
        <ChevronRight
          className="h-16 w-16 shrink-0 text-gray-200 transition-all duration-300 group-hover:translate-x-1 group-hover:text-gray-800"
          strokeWidth={0.5}
          aria-hidden="true"
        />
      </button>
    </article>
  )
}
