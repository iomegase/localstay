'use client'

/* eslint-disable @next/next/no-img-element */

import { ArrowLeft, Clock3, MapPinned, Star } from 'lucide-react'
import type { DemoLodging, DemoPoi, DemoTrailGeometry } from '@/features/guide-demo/types'

type DemoPoiDetailViewProps = {
  lodging: DemoLodging
  poi: DemoPoi
  returnLabel: string
  onBack: () => void
  onShowOnMap: (poi: DemoPoi) => void
}

const DAYS = [
  ['0', 'Dimanche'],
  ['1', 'Lundi'],
  ['2', 'Mardi'],
  ['3', 'Mercredi'],
  ['4', 'Jeudi'],
  ['5', 'Vendredi'],
  ['6', 'Samedi'],
] as const

function haversineDistanceKm(lodging: DemoLodging, poi: DemoPoi) {
  const radians = (value: number) => (value * Math.PI) / 180
  const earthRadiusKm = 6371
  const latitudeDelta = radians(poi.latitude - lodging.latitude)
  const longitudeDelta = radians(poi.longitude - lodging.longitude)
  const a =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(radians(lodging.latitude)) *
      Math.cos(radians(poi.latitude)) *
      Math.sin(longitudeDelta / 2) ** 2
  return 2 * earthRadiusKm * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function formatDistance(distanceKm: number) {
  return new Intl.NumberFormat('fr-FR', {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(distanceKm)
}

function hostnameForPhoto(poi: DemoPoi) {
  if (poi.website) {
    return new URL(poi.website).hostname
  }

  const photo = poi.photos[0]
  if (!photo?.startsWith('http')) return null
  return new URL(photo).hostname
}

function geometryToPolylines(geometry: DemoTrailGeometry) {
  const points = geometry.coordinates.flat()
  const longitudes = points.map(([longitude]) => longitude)
  const latitudes = points.map(([, latitude]) => latitude)
  const minLongitude = Math.min(...longitudes)
  const maxLongitude = Math.max(...longitudes)
  const minLatitude = Math.min(...latitudes)
  const maxLatitude = Math.max(...latitudes)
  const padding = 8
  const width = 240
  const height = 140
  const longitudeRange = maxLongitude - minLongitude || 1
  const latitudeRange = maxLatitude - minLatitude || 1

  return geometry.coordinates.map(line =>
    line
      .map(([longitude, latitude]) => {
        const x = padding + ((longitude - minLongitude) / longitudeRange) * (width - padding * 2)
        const y = height - padding - ((latitude - minLatitude) / latitudeRange) * (height - padding * 2)
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' '),
  )
}

function formatDuration(minutes: number | null) {
  if (minutes === null) return null
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60
  return remainingMinutes === 0 ? `${hours} h` : `${hours} h ${remainingMinutes}`
}

export function DemoPoiDetailView({
  lodging,
  poi,
  returnLabel,
  onBack,
  onShowOnMap,
}: DemoPoiDetailViewProps) {
  const distanceKm = haversineDistanceKm(lodging, poi)
  const photoAttribution = hostnameForPhoto(poi)
  const trail = poi.trail
  const polylines = trail?.geometry ? geometryToPolylines(trail.geometry) : []

  return (
    <article className="min-h-full overflow-x-hidden bg-[#faf9f6] pb-10">
      <div className="relative h-[360px]">
        <img
          src={poi.photos[0] ?? '/fallback/fallback-rando.png'}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/55 via-transparent to-black/60" />
        <button
          type="button"
          onClick={onBack}
          aria-label={returnLabel}
          className="absolute left-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/90 text-slate-900 shadow-sm backdrop-blur"
        >
          <ArrowLeft className="h-5 w-5" aria-hidden="true" />
        </button>
      </div>

      <div className="relative -mt-8 rounded-t-[34px] bg-[#faf9f6] px-5 pb-6 pt-7 shadow-[0_-8px_28px_rgba(15,23,42,0.08)]">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#455e4c]">
              {poi.category.name}
            </p>
            <h1 className="mt-2 font-serif text-4xl italic leading-tight tracking-[-0.04em] text-[#121212]">
              {poi.name}
            </h1>
            <p className="mt-3 text-sm leading-5 text-slate-600">{poi.address}</p>
          </div>
          {poi.rating ? (
            <div className="shrink-0 rounded-2xl bg-white px-3 py-2 text-right shadow-sm ring-1 ring-stone-100">
              <p data-testid="poi-detail-rating" className="flex items-center justify-end gap-1 text-sm font-bold">
                <Star className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
                {poi.rating.toFixed(1)}
              </p>
              {poi.reviewCount ? (
                <p data-testid="poi-detail-rating-count" className="mt-0.5 text-[10px] text-slate-500">
                  {poi.reviewCount} avis
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        {poi.isOpenNow !== undefined ? (
          <span className={`mt-4 inline-flex rounded-full px-3 py-1 text-[10px] font-bold ${poi.isOpenNow ? 'bg-emerald-100 text-emerald-800' : 'bg-stone-200 text-slate-600'}`}>
            {poi.isOpenNow ? 'Ouvert actuellement' : 'Fermé actuellement'}
          </span>
        ) : null}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <div data-testid="poi-detail-distance" className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-100">
            <MapPinned className="h-5 w-5 text-[#455e4c]" aria-hidden="true" />
            <p className="mt-2 text-lg font-bold text-[#121212]">{formatDistance(distanceKm)} km</p>
            <p className="text-[10px] uppercase tracking-[0.13em] text-slate-500">du logement</p>
          </div>
          {poi.durationLabel ? (
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-100">
              <Clock3 className="h-5 w-5 text-[#a68e69]" aria-hidden="true" />
              <p className="mt-2 text-lg font-bold text-[#121212]">{poi.durationLabel}</p>
              <p className="text-[10px] uppercase tracking-[0.13em] text-slate-500">sur place</p>
            </div>
          ) : null}
        </div>

        <p className="mt-6 text-sm leading-6 text-slate-700">{poi.description}</p>

        {poi.ownerNote ? (
          <section className="mt-6 rounded-[26px] border border-[#455e4c]/20 bg-[#455e4c]/10 p-5">
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-[#455e4c]">Le mot de votre hôte</p>
            <p data-testid="owner-recommendation-note-text" className="mt-3 text-sm leading-6 text-slate-700">
              {poi.ownerNote}
            </p>
          </section>
        ) : null}

        {poi.hours ? (
          <section className="mt-7">
            <h2 className="font-serif text-2xl italic text-[#121212]">Horaires</h2>
            <ul className="mt-3 divide-y divide-stone-200 rounded-2xl bg-white px-4 shadow-sm ring-1 ring-stone-100">
              {DAYS.map(([day, label]) => {
                const slot = poi.hours?.[day]
                return (
                  <li key={day} className="flex items-center justify-between gap-4 py-3 text-sm">
                    <span className="font-medium text-slate-700">{label}</span>
                    <span className="text-slate-500">{slot ? `${slot.open} – ${slot.close}` : 'Fermé'}</span>
                  </li>
                )
              })}
            </ul>
          </section>
        ) : null}

        {photoAttribution ? (
          <p data-testid="photo-attribution" className="mt-5 text-[10px] text-slate-400">
            Photo : {photoAttribution}
          </p>
        ) : null}

        <div className="mt-7 grid gap-3">
          <button
            type="button"
            onClick={() => onShowOnMap(poi)}
            className="rounded-full bg-[#121212] px-5 py-3.5 text-sm font-bold text-white"
          >
            Voir sur la carte
          </button>
          <button type="button" disabled aria-disabled="true" className="rounded-full border border-stone-200 px-5 py-3 text-sm font-bold text-slate-400">
            Obtenir l’itinéraire
          </button>
          {poi.website ? (
            <button type="button" disabled aria-disabled="true" className="rounded-full border border-stone-200 px-5 py-3 text-sm font-bold text-slate-400">
              Site web
            </button>
          ) : null}
          {poi.phone ? (
            <button type="button" disabled aria-disabled="true" className="rounded-full border border-stone-200 px-5 py-3 text-sm font-bold text-slate-400">
              Appeler
            </button>
          ) : null}
        </div>

        {trail ? (
          <section className="mt-9 rounded-[28px] bg-[#455e4c] p-5 text-white">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/70">Randonnée</p>
            <h2 className="mt-2 font-serif text-3xl italic">Informations du parcours</h2>
            <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <p><span className="block text-xl font-bold">{trail.distanceKm?.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km</span>Distance</p>
              <p><span className="block text-xl font-bold">{trail.elevationGainM} m</span>Dénivelé positif</p>
              <p><span className="block text-xl font-bold">{formatDuration(trail.estimatedDurationMinutes)}</span>Durée</p>
              <p><span className="block text-xl font-bold">{trail.difficulty === 'easy' ? 'Facile' : trail.difficulty}</span>{trail.startLabel}</p>
            </div>
            {polylines.length > 0 ? (
              <svg
                role="img"
                aria-label={`Aperçu de la randonnée ${poi.name}`}
                viewBox="0 0 240 140"
                className="mt-6 h-40 w-full rounded-2xl bg-[#f0f0eb]"
              >
                {polylines.map((points, index) => (
                  <polyline key={`${points}-${index}`} points={points} fill="none" stroke="#455e4c" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                ))}
              </svg>
            ) : null}
            <button type="button" disabled aria-disabled="true" className="mt-5 w-full rounded-full bg-white/20 px-5 py-3.5 text-sm font-bold text-white">
              Commencer la randonnée
            </button>
            <p className="mt-3 text-xs leading-5 text-white/75">Suivi GPS indisponible dans le guide de démonstration.</p>
          </section>
        ) : null}
      </div>
    </article>
  )
}
