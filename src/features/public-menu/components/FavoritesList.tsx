'use client'

import { useEffect, useState } from 'react'
import { ArrowRight, Heart, Trash2 } from 'lucide-react'
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
      <div className="rounded-2xl border border-dashed border-gray-200 bg-white p-8 text-center">
        <Heart className="mx-auto h-8 w-8 text-gray-300" />
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
      <div className="space-y-3 pb-8">
        {favorites.map(fav => (
          <FavoriteCard key={fav.poi_id} fav={fav} onOpen={() => setSelected(fav)} />
        ))}
      </div>
      {selected && <FavoritePoiModal fav={selected} onClose={() => setSelected(null)} />}
    </>
  )
}

function FavoriteCard({ fav, onOpen }: { fav: FavoritePoi; onOpen: () => void }) {
  return (
    <div className="group flex gap-4 overflow-hidden rounded-2xl border border-gray-100 bg-white p-3 shadow-sm transition-all hover:-translate-y-0.5 hover:border-gold/40 hover:shadow-md">
      {fav.photo ? (
        <img
          src={fav.photo}
          alt={fav.name}
          className="h-20 w-20 shrink-0 rounded-xl object-cover"
          loading="lazy"
        />
      ) : (
        <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-gray-100 text-gray-300">
          <Heart className="h-6 w-6" />
        </div>
      )}
      <button type="button" onClick={onOpen} className="flex flex-1 flex-col justify-center text-left">
        <h3 className="font-serif italic text-base text-charcoal">{fav.name}</h3>
        <p className="text-[10px] uppercase tracking-widest text-gray-400">
          {fav.category_slug.replace(/-/g, ' ')}
        </p>
      </button>
      <div className="my-auto flex items-center gap-2">
        <button
          type="button"
          onClick={() => removeFavorite(fav.poi_id)}
          aria-label={`Retirer ${fav.name} des favoris`}
          className="rounded-full p-2 text-gray-300 transition-colors hover:bg-red-50 hover:text-red-500"
        >
          <Trash2 className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onOpen}
          aria-label={`Ouvrir ${fav.name}`}
          className="rounded-full p-2 text-gray-300 hover:text-charcoal"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}
