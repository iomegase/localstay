'use client'

import { useEffect, useState } from 'react'
import { Heart, MapPin, ChevronRight } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  type FavoritePoi,
  isFavorite as readIsFavorite,
  subscribeToFavorites,
  toggleFavorite,
} from '@/features/public-menu/lib/favorites'
import type { PoiCard as PoiCardType } from '../types'

interface Props {
  poi: PoiCardType
  citySlug: string
  categorySlug: string
}

export function PoiCard({ poi, citySlug, categorySlug }: Props) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isFav, setIsFav] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    setIsFav(readIsFavorite(poi.id))
    return subscribeToFavorites(() => setIsFav(readIsFavorite(poi.id)))
  }, [poi.id])

  const distanceLabel =
    poi.distance_km < 1
      ? `${Math.round(poi.distance_km * 1000)} m`
      : `${poi.distance_km.toFixed(1)} km`

  const description = poi.owner_note || poi.description
  const gallery = poi.photos.length > 0 ? [...poi.photos, ...poi.photos] : []

  function handleToggleFavorite(e: React.MouseEvent) {
    e.stopPropagation()
    const entry: FavoritePoi = {
      poi_id: poi.id,
      name: poi.name,
      city_slug: citySlug,
      category_slug: categorySlug,
      poi_slug: poi.slug,
      photo: poi.photo_url,
      added_at: new Date().toISOString(),
    }
    toggleFavorite(entry)
  }

  return (
    <motion.div
      initial={false}
      animate={{ height: isExpanded ? 'auto' : 480 }}
      className="bg-white rounded-none shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-gray-100 w-full transition-transform duration-300 hover:-translate-y-1 overflow-hidden flex flex-col"
      data-testid={`poi-card-${poi.slug}`}
    >
      {/* Image Header */}
      <div className="relative h-[270px] shrink-0 overflow-hidden group">
        {poi.photo_url ? (
          <img
            src={poi.photo_url}
            alt={poi.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            
          />
          
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#bd9254]/20 to-[#bd9254]/5" />
        )}
        <div className="absolute top-4 right-4">
          <button
            type="button"
            onClick={handleToggleFavorite}
            aria-pressed={isFav}
            aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            data-testid="btn-favorite"
            className="backdrop-blur-sm p-3 text-gray-700 rounded-full shadow-lg hover:bg-white transition-colors group/heart"
          >
            <Heart className={`h-5 w-5 ${mounted && isFav ? 'fill-red-500 text-red-500' : ''}`} />
          </button>
        </div>
        {poi.is_open_now === true && (
          <div className="absolute top-4 left-4">
            <span className="border-green-500/90 border backdrop-blur-sm text-green-900 text-[10px] font-thin px-3 py-1.5 rounded-full tracking-wide uppercase shadow-sm flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-white"></div>
              Ouvert
            </span>
          </div>
        )}
        {poi.is_open_now === false && (
          <div className="absolute top-4 left-4" data-testid="badge-closed">
            <span className="border-red-500/90 border backdrop-blur-sm text-red-900 text-[10px] font-thin px-3 py-1.5 rounded-full tracking-wide uppercase shadow-sm flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-white"></div>
              Fermé
            </span>
          </div>
        )}
      </div>

      {/* Content Body */}
      <div className="p-6 flex flex-col flex-1 justify-between">
        <div
          className="flex justify-between items-center group/card cursor-pointer"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              {poi.subcategory_name && (
                <span className="font-thin text-gray-800 text-[11px]">{poi.subcategory_name}</span>
              )}
              <span className="text-gray-400 text-[11px] font-thin" data-testid="poi-distance">
                à {distanceLabel}
              </span>
            </div>

            <h2 className="text-[18px] font-thin tracking-tight text-gray-900 leading-tight mb-2">
              {poi.name}
            </h2>

            <div className="flex items-start gap-2 hover:bg-gray-50 -mx-2 px-2 py-1.5 rounded-xl transition-colors">
              <MapPin className="h-3 w-3 text-gray-400 shrink-0 mt-0.5" />
              <p className="text-gray-500 font-thin text-[11px] leading-relaxed">
                {poi.address}
              </p>
            </div>
          </div>
          <motion.div
            className="ml-4 shrink-0 flex items-center justify-center"
            animate={{ rotate: isExpanded ? 90 : 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
          >
            <ChevronRight
              className="h-16 w-16 text-gray-200 group-hover/card:translate-x-1 group-hover/card:text-gray-800 transition-all duration-300"
              strokeWidth={0.5}
            />
          </motion.div>
        </div>

        {/* Footer combined details */}
        <div className="flex flex-col mt-2">
          <div className="flex items-end justify-between">
            <div>
              <div className="flex flex-row items-center gap-3">
                {poi.closes_at_label && (
                  <p className="text-[9px] uppercase tracking-wide font-light text-[#86898f]">
                    Ferme à <span className="font-thin text-gray-900">{poi.closes_at_label}</span>
                  </p>
                )}
              </div>
            </div>
            {poi.phone && (
              <a
                href={`tel:${poi.phone}`}
                className="bg-white hover:bg-black border hover:text-white border-black text-black px-5 py-2 rounded-none font-thin text-[11px] tracking-wide transition-all shadow-sm active:scale-95 mb-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                APPELER
              </a>
            )}
          </div>

          <AnimatePresence>
            {isExpanded && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginTop: 0 }}
                animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
                exit={{ opacity: 0, height: 0, marginTop: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden border-t border-gray-50 flex flex-col shrink-0"
              >
                <div className="pt-5">
                  <h3 className="text-[14px] font-medium text-gray-800 mb-1">En savoir plus</h3>
                  {description && (
                    <p className="text-[10px] font-thin text-[#86898f] mb-5 leading-5">
                      {description}
                    </p>
                  )}
                  {gallery.length > 0 && (
                    <div className="relative w-full overflow-hidden rounded-xl h-[100px]">
                      <motion.div
                        className="flex gap-2 absolute top-0 left-0 h-full w-max"
                        animate={{ x: ['0%', '-50%'] }}
                        transition={{ repeat: Infinity, ease: 'linear', duration: 25 }}
                      >
                        {gallery.map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            className="h-full w-36 object-cover rounded-[10px] shrink-0 border border-gray-50/50"
                            alt={`${poi.name} ${i + 1}`}
                          />
                        ))}
                      </motion.div>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  )
}
