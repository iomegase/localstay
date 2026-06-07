'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import { Heart, MapPin, ChevronRight, ChevronLeft, Timer, Route, TrendingUp, Share2, Star, Globe, Navigation } from 'lucide-react'
import { motion } from 'framer-motion'
import {
  type FavoritePoi,
  isFavorite as readIsFavorite,
  subscribeToFavorites,
  toggleFavorite,
} from '@/features/public-menu/lib/favorites'
import type { PoiCard as PoiCardType } from '../types'
import { TrailCardDetails } from './TrailCardDetails'
import { MarkdownText } from '@/shared/components/MarkdownText'
import { reportDeadPhoto } from '@/features/poi-photos/lib/report-dead-photo'

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
  isExpanded?: boolean
  onToggleExpanded?: () => void
}

export function PoiCard({
  poi,
  citySlug,
  categorySlug,
  isExpanded: isExpandedProp,
  onToggleExpanded,
}: Props) {
  const [internalIsExpanded, setInternalIsExpanded] = useState(false)
  const [isFav, setIsFav] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [shareCopied, setShareCopied] = useState(false)
  const [photoIndex, setPhotoIndex] = useState(0)
  const [deadPhotos, setDeadPhotos] = useState<Set<string>>(new Set())

  const isExpanded = isExpandedProp ?? internalIsExpanded

  useEffect(() => {
    setMounted(true)
    setIsFav(readIsFavorite(poi.id))
    return subscribeToFavorites(() => setIsFav(readIsFavorite(poi.id)))
  }, [poi.id])

  const distanceLabel =
    poi.distance_km < 1
      ? `${Math.round(poi.distance_km * 1000)} m`
      : `${poi.distance_km.toFixed(1)} km`

  const description = poi.description
  // Galerie classique en en-tête : 1 photo visible à la fois, navigation par flèches.
  const galleryPhotos = (poi.photos.length > 0 ? poi.photos : poi.photo_url ? [poi.photo_url] : [])
    .filter(url => !deadPhotos.has(url))
  const hasMultiplePhotos = galleryPhotos.length > 1
  const currentPhoto = galleryPhotos[photoIndex] ?? null
  const actionGridColumns = poi.website && poi.phone
    ? 'grid-cols-3'
    : poi.website || poi.phone
      ? 'grid-cols-2'
      : 'grid-cols-1'

  function showPrevPhoto(e: React.MouseEvent) {
    e.stopPropagation()
    setPhotoIndex(i => (i - 1 + galleryPhotos.length) % galleryPhotos.length)
  }
  function showNextPhoto(e: React.MouseEvent) {
    e.stopPropagation()
    setPhotoIndex(i => (i + 1) % galleryPhotos.length)
  }

  // Photo morte (URL cassée) : on la signale au serveur et on la retire localement.
  function handlePhotoError() {
    if (!currentPhoto) return
    reportDeadPhoto(poi.id, currentPhoto)
    setDeadPhotos(prev => new Set(prev).add(currentPhoto))
    setPhotoIndex(0)
  }

  const trail = poi.trail_detail ?? null
  const isTrail = trail !== null
  const difficultyLabel =
    trail && trail.difficulty !== 'unknown' ? DIFFICULTY_LABEL[trail.difficulty] ?? null : null
  const trailDuration = trail ? formatDuration(trail.estimated_duration_min) : null
  const trailDistance = trail && trail.distance_km !== null ? `${trail.distance_km.toFixed(1)} km` : null
  const trailElevation = trail && trail.elevation_gain_m !== null ? `${trail.elevation_gain_m} m` : null

  const displayRating = poi.rating

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

  function handleToggleExpanded() {
    if (onToggleExpanded) {
      onToggleExpanded()
      return
    }
    setInternalIsExpanded(current => !current)
  }

  return (
    <motion.div
      initial={false}
      animate={{ height: isExpanded ? 'auto' : 480 }}
      className="bg-white rounded-none shadow-[0_20px_50px_rgba(0,0,0,0.08)] border border-gray-100 w-full transition-transform duration-300 hover:-translate-y-1 overflow-hidden flex flex-col"
      data-testid={`poi-card-${poi.slug}`}
    >
      {/* Image Header — galerie classique (1 photo visible, flèches si plusieurs) */}
      <div className="relative h-[270px] shrink-0 overflow-hidden group">
        {currentPhoto ? (
          <>
            {/* Fond flou : remplit le box edge-to-edge, supprime toute bande vide */}
            <Image
              src={currentPhoto}
              alt=""
              aria-hidden
              fill
              unoptimized
              sizes="(max-width: 480px) 100vw, 480px"
              data-testid="poi-photo-backdrop"
              className="scale-110 object-cover blur-xl"
            />
            {/* Image entière, jamais rognée (logos / texte préservés) */}
            <Image
              src={currentPhoto}
              alt={poi.name}
              fill
              unoptimized
              sizes="(max-width: 480px) 100vw, 480px"
              onError={handlePhotoError}
              className="object-contain object-center transition-transform duration-500 group-hover:scale-105"
            />
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[#bd9254]/20 to-[#bd9254]/5" />
        )}
        {hasMultiplePhotos && (
          <>
            <button
              type="button"
              onClick={showPrevPhoto}
              aria-label="Photo précédente"
              data-testid="poi-photo-prev"
              className="absolute left-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-gray-800 shadow-lg backdrop-blur-sm transition-colors hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={showNextPhoto}
              aria-label="Photo suivante"
              data-testid="poi-photo-next"
              className="absolute right-3 top-1/2 -translate-y-1/2 flex h-9 w-9 items-center justify-center rounded-full bg-white/70 text-gray-800 shadow-lg backdrop-blur-sm transition-colors hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
              {galleryPhotos.map((_, i) => (
                <span
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${i === photoIndex ? 'w-4 bg-white' : 'w-1.5 bg-white/60'}`}
                />
              ))}
            </div>
          </>
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
            <span className="border-charcoal/40 border bg-white/80 backdrop-blur-sm text-charcoal text-[10px] font-semibold px-3 py-1.5 rounded-full tracking-wide uppercase shadow-sm flex items-center gap-1.5">
              <TrendingUp className="h-3 w-3" />
              {difficultyLabel}
            </span>
          </div>
        )}
        {!isTrail && poi.is_open_now === true && (
          <div className="absolute top-4 left-4">
            <span data-testid="badge-open" className="border-green-500/90 border bg-green-500/90 backdrop-blur-sm text-white text-[10px] font-semibold px-3 py-1.5 rounded-full tracking-widest uppercase shadow-sm flex items-center gap-1.5">
              <div className="w-1 h-1 rounded-full bg-white"></div>
              Ouvert
            </span>
          </div>
        )}
        {!isTrail && poi.is_open_now === false && (
          <div className="absolute top-4 left-4">
            <span data-testid="badge-closed" className="border-red-500/90 border bg-red-500/90 backdrop-blur-sm text-white text-[10px] font-semibold tracking-widest px-3 py-1.5 rounded-full uppercase shadow-sm flex items-center gap-1.5">
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
          onClick={handleToggleExpanded}
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
                <span className="ml-1 text-[10px] font-semibold text-gray-500">{displayRating.toFixed(1)}</span>
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
              <Link
                href={`/guide/${citySlug}/${categorySlug}/${poi.slug}`}
                className="underline-offset-4 decoration-gray-300 hover:underline"
              >
                {poi.name}
              </Link>
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
                <div className="flex flex-row items-center gap-3 pb-2" data-testid="poi-hours-line">
                  {poi.is_open_now === false && poi.next_open_label ? (
                    <p className="text-[9px] uppercase tracking-widest font-bold text-green-500">
                      Ouvre <span className="font-bold text-green-500">{poi.next_open_label}</span>
                    </p>
                  ) : poi.closes_at_label ? (
                    <p className="text-[9px] uppercase tracking-widest font-bold text-red-500">
                      Ferme à <span className="font-bold text-red-500">{poi.closes_at_label}</span>
                    </p>
                  ) : null}
                </div>
              )}
            </div>
          </div>

          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, height: 0, marginTop: 0 }}
              animate={{ opacity: 1, height: 'auto', marginTop: 24 }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden border-t border-gray-50 flex flex-col shrink-0"
            >
              <div className="">
                {/* <h3 className="text-[14px] font-medium text-gray-800 mb-1">En savoir plus</h3> */}
                {description && (
                  <MarkdownText
                    source={description}
                    breaks
                    className="text-[10px] font-thin text-[#555556] mb-5 leading-5 tracking-wide"
                  />
                )}
                {!isTrail && (
                  <div className="mt-1 text-[11px] font-thin text-gray-600" data-testid="poi-more-info">
                    <div className={`grid gap-4 pt-3 ${actionGridColumns}`}>
                      <a
                        href={`https://www.google.com/maps/dir/?api=1&destination=${poi.latitude},${poi.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={e => e.stopPropagation()}
                        className="flex h-14 min-w-0 items-center justify-center gap-2 border border-black bg-black px-3 text-[11px] font-medium uppercase tracking-[0.12em] text-white shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-white hover:text-black hover:shadow-md active:translate-y-0 active:scale-[0.98]"
                      >
                        <Navigation className="h-4 w-4 shrink-0" />
                        ITINÉRAIRE
                      </a>
                      {poi.website && (
                        <a
                          href={poi.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={e => e.stopPropagation()}
                          className="flex h-14 min-w-0 items-center justify-center gap-2 border border-black bg-white px-3 text-[11px] font-medium uppercase tracking-[0.12em] text-black shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-black hover:text-white hover:shadow-md active:translate-y-0 active:scale-[0.98]"
                        >
                          <Globe className="h-4 w-4 shrink-0" />
                          SITE
                        </a>
                      )}
                      {poi.phone && (
                        <a
                          href={`tel:${poi.phone}`}
                          onClick={e => e.stopPropagation()}
                          className="flex h-14 min-w-0 items-center justify-center border border-black bg-white px-3 text-[11px] font-medium uppercase tracking-[0.12em] text-black shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-black hover:text-white hover:shadow-md active:translate-y-0 active:scale-[0.98]"
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
        </div>
      </div>
    </motion.div>
  )
}
