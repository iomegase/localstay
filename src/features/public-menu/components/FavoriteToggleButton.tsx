'use client'

import { useEffect, useState } from 'react'
import { Heart } from 'lucide-react'
import {
  type FavoritePoi,
  isFavorite as readIsFavorite,
  subscribeToFavorites,
  toggleFavorite,
} from '../lib/favorites'

type Props = {
  poi: FavoritePoi
  className?: string
}

export function FavoriteToggleButton({ poi, className }: Props) {
  const [isFav, setIsFav] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsFav(readIsFavorite(poi.poi_id))
    return subscribeToFavorites(() => setIsFav(readIsFavorite(poi.poi_id)))
  }, [poi.poi_id])

  return (
    <button
      type="button"
      onClick={() => toggleFavorite(poi)}
      aria-pressed={isFav}
      aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
      data-testid="btn-favorite"
      className={`flex-1 py-3 rounded-2xl border flex items-center justify-center gap-1.5 text-xs font-bold uppercase tracking-widest active:scale-95 transition-all ${
        mounted && isFav
          ? 'border-red-300 bg-red-50 text-red-600'
          : 'border-gray-200 text-charcoal'
      } ${className ?? ''}`.trim()}
    >
      <Heart className={`h-4 w-4 ${mounted && isFav ? 'fill-current' : ''}`} />
      {mounted && isFav ? 'Sauvegardé' : 'Favori'}
    </button>
  )
}
