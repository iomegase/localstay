import Link from 'next/link'
import type { ReactNode } from 'react'
import { AlertTriangle, ArrowLeft, Car, Clock, Footprints, Heart, MapPin, Mountain, Share2 } from 'lucide-react'
import type { PoiDetail, TrailDetailData } from '@/features/categories/types'
import { TrailAccessActions } from './TrailAccessActions'
import { TrailPreviewMap } from './TrailPreviewMap'
import { isValidTrailGeometry } from '../lib/geo'

interface Props {
  poi: PoiDetail
  citySlug: string
  categorySlug: string
}

const DIFFICULTY_LABELS: Record<TrailDetailData['difficulty'], string> = {
  easy: 'Facile',
  medium: 'Moyen',
  hard: 'Difficile',
  expert: 'Expert',
  unknown: 'Non précisé',
}

export function TrailPoiDetailBody({ poi, citySlug, categorySlug }: Props) {
  const trail = poi.trail_detail
  if (!trail) return null

  const hasGeometry = isValidTrailGeometry(trail.geometry_geojson) && trail.data_quality_status === 'complete'
  const hasStart = trail.start_latitude !== null && trail.start_longitude !== null
  const attribution = trail.source_refs.map(source => source.attribution).filter(Boolean).join(' · ')

  return (
    <>
      <header className="relative h-[560px] overflow-hidden bg-[#E8E6DF]">
        {poi.photos[0] && <img src={poi.photos[0]} alt={poi.name} className="absolute inset-0 h-full w-full object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/25" />
        <div className="absolute left-6 right-6 top-8 z-10 flex items-center justify-between">
          <Link
            href={`/guide/${citySlug}/${categorySlug}`}
            aria-label="Retour"
            className="flex h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-[#FAF9F6]/85 text-[#121212] shadow-sm backdrop-blur active:scale-95"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <button type="button" aria-label="Partager" className="flex h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-[#FAF9F6]/85 text-[#121212] shadow-sm backdrop-blur">
              <Share2 className="h-4 w-4" />
            </button>
            <button type="button" aria-label="Ajouter aux favoris" className="flex h-12 w-12 items-center justify-center rounded-full border border-white/60 bg-[#FAF9F6]/85 text-[#121212] shadow-sm backdrop-blur">
              <Heart className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      <main className="relative z-20 -mt-[82px] rounded-t-[56px] bg-[#FAF9F6] pb-36 shadow-[0_-18px_35px_rgba(0,0,0,0.08)]">
        <section className="px-5 pb-2 pt-8">
          <div className="mb-8">
            <div className="mb-5 flex items-center gap-2">
              <span className="rounded-full border border-gray-100 bg-white px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-[#455E4C] shadow-sm">
                {DIFFICULTY_LABELS[trail.difficulty]}
              </span>
              <span className="rounded-full bg-[#121212] px-4 py-2 text-[9px] font-bold uppercase tracking-widest text-white shadow-sm">
                {poi.category.name}
              </span>
            </div>
            <h1 className="font-serif text-4xl font-light italic leading-none text-[#121212]">{poi.name}</h1>
            {poi.description && <p className="mt-5 max-w-[340px] text-xs leading-6 text-gray-500">{poi.description}</p>}
          </div>
        </section>

        <section className="px-4">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#A68E69]">Description</p>
          {poi.description && <p className="text-justify text-xs leading-7 text-gray-500">{poi.description}</p>}
        </section>

        <section className="mb-8 mt-8 flex gap-3 px-6" data-testid="trail-quick-stats">
          <TrailStat icon={<Mountain className="h-5 w-5 text-gray-400" />} label="Dénivelé" value={trail.elevation_gain_m ? `D+ ${trail.elevation_gain_m}m` : 'n/a'} />
          <TrailStat icon={<Clock className="h-5 w-5 text-gray-400" />} label="Durée" value={formatDuration(trail.estimated_duration_min)} />
          <TrailStat icon={<Footprints className="h-5 w-5 text-[#455E4C]" />} label="Distance" value={trail.distance_km ? `${trail.distance_km.toFixed(1)} km` : 'n/a'} />
        </section>

        {poi.photos.length > 1 && (
          <section className="mt-4">
            <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto px-6 pb-4">
              {poi.photos.slice(1).map((photo, index) => (
                <div key={`${photo}-${index}`} className="relative h-44 w-64 shrink-0 snap-center overflow-hidden rounded-md shadow-sm">
                  <img src={photo} alt={`${poi.name} — photo ${index + 1}`} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
          </section>
        )}

        <TrailPreviewMap
          name={poi.name}
          geometry={trail.geometry_geojson}
          startLatitude={trail.start_latitude}
          startLongitude={trail.start_longitude}
        />

        <section className="px-4 pt-8">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.3em] text-[#A68E69]">Comment s’y rendre</p>
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
                StayLocal ne remplace pas une carte officielle, la météo, le balisage terrain ou un équipement adapté.
              </p>
            </InfoCard>
          </div>
        </section>

        <section className="mb-10 mt-8 px-4">
          <TrailAccessActions
            citySlug={citySlug}
            trailSlug={poi.slug}
            startLabel={trail.start_label}
            startLatitude={trail.start_latitude}
            startLongitude={trail.start_longitude}
            hasGeometry={hasGeometry}
          />
        </section>

        <section className="px-4" data-testid="trail-detail-block">
          <div className="rounded-[28px] border border-charcoal/5 bg-white p-5 shadow-sm">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#A68E69]">Randonnée</p>
            <p className="mt-3 text-xs leading-5 text-charcoal/60">
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
    <div className="flex flex-1 flex-col items-center justify-center rounded-2xl border border-gray-100 bg-white p-4 text-center shadow-sm">
      {icon}
      <span className="mt-2 text-sm font-semibold">{value}</span>
      <span className="mt-0.5 text-[9px] uppercase tracking-widest text-gray-400">{label}</span>
    </div>
  )
}

function InfoCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <article className="flex gap-4 rounded-[1.8rem] border border-gray-100 bg-white p-5 shadow-sm">
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
