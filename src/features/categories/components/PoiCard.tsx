'use client'

import { useEffect, useState } from 'react'
import { Heart, MapPin, ChevronRight, Timer, Route, TrendingUp, Share2, Star, Globe, Navigation } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  type FavoritePoi,
  isFavorite as readIsFavorite,
  subscribeToFavorites,
  toggleFavorite,
} from '@/features/public-menu/lib/favorites'
import type { PoiCard as PoiCardType } from '../types'
import { TrailCardDetails } from './TrailCardDetails'
import { MarkdownText } from '@/shared/components/MarkdownText'

const DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'Facile',
  medium: 'Modéré',
  hard: 'Difficile',
  expert: 'Expert',
}

function formatDuration(minutes: number | null): string | null {
  if (!minutes) return null
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m}min`
  return m === 0 ? `${h}h` : `${h}h${String(m).padStart(2, '0')}`
}

interface Props {
  poi: PoiCardType
  citySlug: string
  categorySlug: string
}

export function PoiCard({ poi, citySlug, categorySlug }: Props) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isFav, setIsFav] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)

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

  const trail = poi.trail_detail ?? null
  const isTrail = trail !== null
  const difficultyLabel =
    trail && trail.difficulty !== 'unknown' ? DIFFICULTY_LABEL[trail.difficulty] ?? null : null
  const trailDuration = trail ? formatDuration(trail.estimated_duration_min) : null
  const trailDistance = trail && trail.distance_km !== null ? `${trail.distance_km.toFixed(1)} km` : null
  const trailElevation = trail && trail.elevation_gain_m !== null ? `${trail.elevation_gain_m} m` : null

  const displayRating = poi.rating ?? poi.owner_rating ?? null

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

  async function handleShare(e: React.MouseEvent) {
    e.stopPropagation()
    const url = `${window.location.origin}/guide/${citySlug}/${categorySlug}/${poi.slug}`
    try {
      if (navigator.share) {
        await navigator.share({ title: poi.name, url })
      } else {
        await navigator.clipboard?.writeText(url)
        setShareCopied(true)
        setTimeout(() => setShareCopied(false), 2000)
      }
    } catch {
      // Partage annulé / indisponible — sans effet
    }
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
        <div className="absolute top-4 right-4 flex items-center gap-2">
          <button
            type="button"
            onClick={handleShare}
            aria-label="Partager"
            title={shareCopied ? 'Lien copié' : 'Partager'}
            data-testid="btn-share"
            className="backdrop-blur-sm p-3 text-gray-700 rounded-full shadow-lg hover:bg-white transition-colors bg-white/70"
          >
            <Share2 className="h-5 w-5" />
          </button>
          <button
            type="button"
            onClick={handleToggleFavorite}
            aria-pressed={isFav}
            aria-label={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
            data-testid="btn-favorite"
            className="backdrop-blur-sm p-3 text-gray-700 rounded-full shadow-lg hover:bg-white transition-colors bg-white/70 group/heart"
          >
            <Heart className={`h-5 w-5 ${mounted && isFav ? 'fill-red-500 text-red-500' : ''}`} />
          </button>
        </div>
        {isTrail && difficultyLabel && (
          <div className="absolute top-4 left-4" data-testid="badge-difficulty">
            <span className="border-charcoal/40 border bg-white/80 backdrop-blur-sm text-charcoal text-[10px] font-thin px-3 py-1.5 rounded-full tracking-wide uppercase shadow-sm flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3" />
              {difficultyLabel}
            </span>
          </div>
        )}
        {!isTrail && poi.is_open_now === true && (
          <div className="absolute top-4 left-4">
            <span className="border-green-500/90 border backdrop-blur-sm text-green-500/90 text-[10px] font-thin px-3 py-1.5 rounded-full tracking-wide uppercase shadow-sm flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-white"></div>
              Ouvert
            </span>
          </div>
        )}
        {!isTrail && poi.is_open_now === false && (
          <div className="absolute top-4 left-4" data-testid="badge-closed">
            <span className="border-red-500/90 border backdrop-blur-sm text-red-500/90 text-[10px] font-thin px-3 py-1.5 rounded-full tracking-wide uppercase shadow-sm flex items-center gap-1.5">
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
            {!isTrail && displayRating !== null && (
              <div className="flex items-center gap-1 mb-1" data-testid="poi-rating" aria-label={`Note ${displayRating} sur 5`}>
                {[1, 2, 3, 4, 5].map(n => (
                  <Star
                    key={n}
                    className={`h-3 w-3 ${n <= Math.round(displayRating) ? 'fill-[#bd9254] text-[#bd9254]' : 'text-gray-300'}`}
                  />
                ))}
                <span className="ml-1 text-[10px] font-thin text-gray-500">{displayRating.toFixed(1)}</span>
              </div>
            )}
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
              {isTrail ? (
                <div
                  className="flex flex-row items-center gap-4 text-[9px] uppercase tracking-wide font-light text-[#86898f]"
                  data-testid="trail-stats"
                >
                  {trailDuration && (
                    <span className="flex items-center gap-1.5">
                      <Timer className="h-3.5 w-3.5" />
                      <span className="font-thin text-gray-900">{trailDuration}</span>
                    </span>
                  )}
                  {trailDistance && (
                    <span className="flex items-center gap-1.5">
                      <Route className="h-3.5 w-3.5" />
                      <span className="font-thin text-gray-900">{trailDistance}</span>
                    </span>
                  )}
                  {trailElevation && (
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span className="font-thin text-gray-900">{trailElevation}</span>
                    </span>
                  )}
                </div>
              ) : (
                <div className="flex flex-row items-center gap-3">
                  {poi.closes_at_label && (
                    <p className="text-[9px] uppercase tracking-wide font-light text-[#86898f]">
                      Ferme à <span className="font-thin text-gray-900">{poi.closes_at_label}</span>
                    </p>
                  )}
                </div>
              )}
            </div>
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
                  {/* <h3 className="text-[14px] font-medium text-gray-800 mb-1">En savoir plus</h3> */}
                  {description && (
                    <MarkdownText
                      source={description}
                      breaks
                      className="text-[10px] font-thin text-[#86898f] mb-5 leading-5"
                    />
                  )}
                  {gallery.length > 0 && (
                    <div className="relative w-full overflow-hidden rounded-none h-[100px]">
                      <motion.div
                        className="flex gap-2 absolute top-0 left-0 h-full w-max"
                        animate={{ x: ['0%', '-50%'] }}
                        transition={{ repeat: Infinity, ease: 'linear', duration: 25 }}
                      >
                        {gallery.map((img, i) => (
                          <img
                            key={i}
                            src={img}
                            className="h-full w-36 object-cover rounded-none shrink-0 border border-gray-50/50"
                            alt={`${poi.name} ${i + 1}`}
                          />
                        ))}
                      </motion.div>
                    </div>
                  )}
                  {!isTrail && (
                    <div className="mt-1 space-y-2 text-[11px] font-thin text-gray-600" data-testid="poi-more-info">
                      {poi.website && (
                        <a
                          href={poi.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="flex items-center gap-1.5 text-[#bd9254] hover:underline"
                        >
                          <Globe className="h-3 w-3" />
                          Site web
                        </a>
                      )}

                      <div className="flex gap-2 pt-3">
                        <a
                          href={`https://www.google.com/maps/dir/?api=1&destination=${poi.latitude},${poi.longitude}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="flex flex-1 items-center justify-center gap-1.5 border border-black bg-black text-white hover:bg-white hover:text-black px-5 py-2 rounded-none font-thin text-[11px] tracking-wide transition-all shadow-sm active:scale-95"
                        >
                          <Navigation className="h-3.5 w-3.5" />
                          Google Maps
                        </a>
                        {poi.phone && (
                          <a
                            href={`tel:${poi.phone}`}
                            onClick={e => e.stopPropagation()}
                            className="flex flex-1 items-center justify-center border border-black bg-white text-black hover:bg-black hover:text-white px-5 py-2 rounded-none font-thin text-[11px] tracking-wide transition-all shadow-sm active:scale-95"
                          >
                            APPELER
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                  {isTrail && (
                    <TrailCardDetails
                      citySlug={citySlug}
                      categorySlug={categorySlug}
                      poiSlug={poi.slug}
                      poiName={poi.name}
                      address={poi.address}
                    />
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
