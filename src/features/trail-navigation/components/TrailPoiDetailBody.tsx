import Link from 'next/link'
import type { ReactNode } from 'react'
import { AlertTriangle, ArrowLeft, Car, Clock, Footprints, MapPin, Mountain } from 'lucide-react'
import type { PoiDetail, TrailDetailData } from '@/features/categories/types'
import { TrailAccessActions } from './TrailAccessActions'
import { TrailPreviewMap } from './TrailPreviewMap'
import { isValidTrailGeometry } from '../lib/geo'
import { reliabilityFromQualityStatus } from '@/features/trails-acquisition/lib/geometry-quality'
import { MarkdownText } from '@/shared/components/MarkdownText'
import { PoiDetailHeroCarousel } from '@/features/categories/components/PoiDetailHeroCarousel'
import { HeroShareButton } from '@/features/categories/components/HeroShareButton'
import { FavoriteToggleButton } from '@/features/public-menu/components/FavoriteToggleButton'

function buildMapboxHeroUrl(latitude: number | null, longitude: number | null): string | null {
  const token = process.env.NEXT_PUBLIC_MAPBOX_TOKEN
  if (!token || latitude === null || longitude === null) return null
  // Vue terrain immersive sans overlay : effet "photo paysage" pour les randos sans image
  return `https://api.mapbox.com/styles/v1/mapbox/satellite-streets-v12/static/${longitude},${latitude},13,0,60/1080x720@2x?access_token=${token}`
}

interface Props {
  poi: PoiDetail
  citySlug: string
  categorySlug: string
  /** Si fourni, le bouton retour ferme la vue (mode modal) au lieu de naviguer vers la liste. */
  onClose?: () => void
}

const DIFFICULTY_LABELS: Record<TrailDetailData['difficulty'], string> = {
  easy: 'Facile',
  medium: 'Moyen',
  hard: 'Difficile',
  expert: 'Expert',
  unknown: 'Non précisé',
}

export function TrailPoiDetailBody({ poi, citySlug, categorySlug, onClose }: Props) {
  const trail = poi.trail_detail
  if (!trail) return null

  const hasGeometry = isValidTrailGeometry(trail.geometry_geojson) && trail.data_quality_status === 'complete'
  const reliability = reliabilityFromQualityStatus(trail.data_quality_status)
  const hasStart = trail.start_latitude !== null && trail.start_longitude !== null
  const attribution = trail.source_refs.map(source => source.attribution).filter(Boolean).join(' · ')

  // Galerie intégrée au hero (comme les autres POIs) ; fallback Mapbox si aucune photo.
  const mapboxFallback =
    poi.photos.length === 0 ? buildMapboxHeroUrl(trail.start_latitude, trail.start_longitude) : null
  const heroPhotos = poi.photos.length > 0 ? poi.photos : mapboxFallback ? [mapboxFallback] : []
  const poiUrl = `/guide/${citySlug}/${categorySlug}/${poi.slug}`

  return (
    <>
      <PoiDetailHeroCarousel photos={heroPhotos} name={poi.name} poiId={poi.id}>
        <div className="absolute top-5 left-6 right-6 z-10 flex items-center justify-between">
          {onClose ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Fermer"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/30 text-charcoal/60 backdrop-blur transition-transform active:scale-95 hover:bg-white/40"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>
          ) : (
            <Link
              href={`/guide/${citySlug}/${categorySlug}`}
              aria-label="Retour"
              className="flex h-10 w-10 items-center justify-center rounded-full bg-white/30 text-charcoal/60 backdrop-blur transition-transform active:scale-95 hover:bg-white/40"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
          )}
          <div className="flex items-center gap-2">
            <HeroShareButton poiName={poi.name} poiUrl={poiUrl} />
            <FavoriteToggleButton
              variant="icon"
              poi={{
                poi_id: poi.id,
                name: poi.name,
                city_slug: citySlug,
                category_slug: categorySlug,
                poi_slug: poi.slug,
                photo: poi.photos?.[0] ?? null,
                added_at: '',
              }}
            />
          </div>
        </div>
      </PoiDetailHeroCarousel>

      <main className="relative z-20 -mt-8  bg-[#FAF9F6] pb-36 shadow-[0_-18px_35px_rgba(0,0,0,0.08)]">
        <section className="px-0 pb-2 pt-8">
          {/* En-tête — style standard POI */}
          <div className="flex items-start justify-between px-6">
            <div className="min-w-0 flex-1">
              <span className="text-[9px] font-bold uppercase tracking-widest text-gold">
                {DIFFICULTY_LABELS[trail.difficulty]} · {poi.category.name}
              </span>
              <h1 className="mt-1 text-xl uppercase leading-tight text-charcoal">{poi.name}</h1>
              {poi.address && <p className="mt-5 truncate text-xs text-charcoal/50">{poi.address}</p>}
            </div>
          </div>

          {/* Description — style standard POI */}
          {poi.description && (
            <MarkdownText
              source={poi.description}
              breaks
              className="mt-6 px-6 text-sm leading-relaxed text-charcoal/70"
            />
          )}
        </section>

        <section className="mb-8 mt-8 flex gap-3 px-6" data-testid="trail-quick-stats">
          <TrailStat icon={<Mountain className="h-5 w-5 text-gray-400" />} label="Dénivelé" value={trail.elevation_gain_m ? `D+ ${trail.elevation_gain_m}m` : 'n/a'} />
          <TrailStat icon={<Clock className="h-5 w-5 text-gray-400" />} label="Durée" value={formatDuration(trail.estimated_duration_min)} />
          <TrailStat icon={<Footprints className="h-5 w-5 text-[#455E4C]" />} label="Distance" value={trail.distance_km ? `${trail.distance_km.toFixed(1)} km` : 'n/a'} />
        </section>

        <TrailPreviewMap
          name={poi.name}
          geometry={trail.geometry_geojson}
          startLatitude={trail.start_latitude}
          startLongitude={trail.start_longitude}
          startHref={`/guide/${citySlug}/${categorySlug}/${poi.slug}/start`}
          reliability={reliability}
        />

        <section className="px-4 pt-8">
          {/* <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#A68E69]">Comment s’y rendre</p> */}
          <div className="space-y-3">
            <InfoCard icon={<MapPin className="h-5 w-5" />} title="Départ conseillé">
              <p className="mt-1 text-[11px] uppercase tracking-wider text-[#455E4C]">{trail.start_label ?? poi.address}</p>
              {hasStart && (
                <p className="mt-1 text-[11px] italic leading-4 text-gray-500">
                  Coordonnées départ : {trail.start_latitude?.toFixed(5)}, {trail.start_longitude?.toFixed(5)}
                </p>
              )}
            </InfoCard>
            <InfoCard icon={<Car className="h-5 w-5" />} title="Accès">
              <p className="mt-1 text-[11px] italic leading-4 text-gray-500">
                Utilisez "Rejoindre le départ" pour afficher une route Mapbox depuis votre position vers le point de départ.
              </p>
            </InfoCard>
            <InfoCard icon={<AlertTriangle className="h-5 w-5" />} title="À prévoir">
              <p className="mt-1 text-[11px] italic leading-4 text-gray-500">
                MyStay ne remplace pas une carte officielle, la météo, le balisage terrain ou un équipement adapté.
              </p>
            </InfoCard>
          </div>
        </section>

        <section className="mb-10 mt-8 px-4">
          <TrailAccessActions
            citySlug={citySlug}
            categorySlug={categorySlug}
            trailSlug={poi.slug}
            startLabel={trail.start_label}
            startLatitude={trail.start_latitude}
            startLongitude={trail.start_longitude}
            hasGeometry={hasGeometry}
          />
        </section>

        <section className="px-4" data-testid="trail-detail-block">
          <div className="p-5 ">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#A68E69]">Datas</p>
            <p className="mt-3 text-[10px] leading-5 text-charcoal/60">
              Source principale : {trail.primary_source_type}
              {attribution ? ` · ${attribution}` : ''}
              {trail.data_quality_status === 'incomplete' ? ' · fiche incomplète validée par un administrateur' : ''}
            </p>
          </div>
        </section>
      </main>
    </>
  )
}

function TrailStat({ icon, label, value }: { icon: ReactNode; label: string; value: string }) {
  return (
    <div className="flex flex-1 flex-col rounded-md items-center justify-center  p-4 text-center shadow-sm">
      {icon}
      <span className="mt-2 text-sm font-semibold">{value}</span>
      <span className="mt-0.5 text-[9px] uppercase tracking-widest text-gray-400">{label}</span>
    </div>
  )
}

function InfoCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <article className="flex gap-4 rounded-md  bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#455E4C] text-white">{icon}</div>
      <div>
        <h3 className="text-sm font-bold">{title}</h3>
        {children}
      </div>
    </article>
  )
}

function formatDuration(minutes: number | null): string {
  if (!minutes) return 'n/a'
  const hours = Math.floor(minutes / 60)
  const remaining = minutes % 60
  if (hours === 0) return `${remaining} min`
  if (remaining === 0) return `${hours}h`
  return `${hours}h${remaining}`
}
