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
  variant?: 'default' | 'icon'
}

export function FavoriteToggleButton({ poi, className, variant = 'default' }: Props) {
  const [isFav, setIsFav] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsFav(readIsFavorite(poi.poi_id))
    return subscribeToFavorites(() => setIsFav(readIsFavorite(poi.poi_id)))
  }, [poi.poi_id])

  if (variant === 'icon') {
    return (
      <button
        type="button"
        onClick={() => toggleFavorite(poi)}
        aria-pressed={isFav}
        aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
        data-testid="btn-favorite"
        className={`flex h-10 w-10 items-center justify-center rounded-full bg-white/30 backdrop-blur text-charcoal/60 shadow-sm transition-transform active:scale-95 hover:bg-white/40 ${
          mounted && isFav ? 'text-red-600 bg-red-100/30' : ''
        } ${className ?? ''}`.trim()}
      >
        <Heart className={`h-4 w-4 ${mounted && isFav ? 'fill-current' : ''}`} />
      </button>
    )
  }

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
