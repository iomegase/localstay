'use client'

import {
  ArrowLeft,
  Globe,
  Map,
  MapPin,
  Mountain,
  Navigation,
  Phone,
  Play,
  Route,
  Star,
  TrendingUp,
  type LucideIcon,
} from 'lucide-react'
import { DemoPoiImage } from './DemoPoiImage'
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

function lodgingDistanceLabel(distanceKm: number) {
  if (distanceKm < 1) return `Situé à ${Math.round(distanceKm * 1000)} m du logement`
  return `Situé à ${distanceKm.toFixed(1).replace('.', ',')} km du logement`
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
  const lines = geometry.coordinates
    .map(line =>
      line.filter(
        ([longitude, latitude]) =>
          Number.isFinite(longitude) && Number.isFinite(latitude),
      ),
    )
    .filter(line => line.length >= 2)
  if (lines.length === 0) return []

  const points = lines.flat()
  const longitudes = points.map(([longitude]) => longitude)
  const latitudes = points.map(([, latitude]) => latitude)
  const minLongitude = Math.min(...longitudes)
  const maxLongitude = Math.max(...longitudes)
  const minLatitude = Math.min(...latitudes)
  const maxLatitude = Math.max(...latitudes)
  const padding = 8
  const width = 240
  const height = 140
  const longitudeRange = maxLongitude - minLongitude
  const latitudeRange = maxLatitude - minLatitude

  return lines.map(line =>
    line
      .map(([longitude, latitude]) => {
        const x = longitudeRange === 0
          ? width / 2
          : padding + ((longitude - minLongitude) / longitudeRange) * (width - padding * 2)
        const y = latitudeRange === 0
          ? height / 2
          : height - padding - ((latitude - minLatitude) / latitudeRange) * (height - padding * 2)
        return `${x.toFixed(1)},${y.toFixed(1)}`
      })
      .join(' '),
  )
}

function formatDuration(minutes: number | null) {
  if (minutes === null) return 'Indisponible'
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
    <article className="min-h-full overflow-x-hidden bg-slate-50 pb-10">
      <div className="relative h-[360px]">
        <DemoPoiImage
          primarySrc={poi.photos[0]}
          category={poi.category}
          name={poi.name}
          decorative
          loading="eager"
          className="absolute inset-0 h-full w-full object-cover"
        />
        <div className="absolute inset-0 bg-black/10" />
        {poi.isOpenNow === true ? (
          <div className="absolute bottom-8 left-6 z-10 pb-4">
            <span className="inline-flex rounded-full border border-green-200 bg-green-50/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-green-700 shadow-sm backdrop-blur">
              Ouvert
            </span>
          </div>
        ) : null}
        <button
          type="button"
          onClick={onBack}
          aria-label={returnLabel}
          className="absolute left-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-slate-900 shadow-lg backdrop-blur active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>

      <main className="relative z-10 -mt-8 space-y-6 rounded-t-[28px] bg-slate-50 pb-8 pt-8 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
        <div className="flex items-start justify-between gap-3 px-6">
          <div className="min-w-0 flex-1">
            <p className="text-[9px] font-bold uppercase tracking-widest text-pink-600">
              {poi.category.name}
            </p>
            <h1
              data-demo-view-heading="true"
              tabIndex={-1}
              className="mt-1 text-xl uppercase leading-tight text-charcoal"
            >
              {poi.name}
            </h1>
            <p className="mt-4 truncate text-xs text-charcoal/50">{poi.address}</p>
          </div>
          {poi.rating ? (
            <div className="ml-4 flex shrink-0 items-center">
              <span className="inline-flex items-center gap-1 rounded-2xl border border-gray-100 bg-white px-3 py-1.5 shadow-sm">
                <Star className="h-3.5 w-3.5 fill-pink-600 text-pink-600" aria-hidden="true" />
                <span data-testid="poi-detail-rating" className="text-sm font-bold">{poi.rating.toFixed(1)}</span>
              </span>
              {poi.reviewCount ? (
                <span data-testid="poi-detail-rating-count" className="ml-3 mt-1 text-[10px] text-charcoal/40">
                  {poi.reviewCount} avis
                </span>
              ) : null}
            </div>
          ) : null}
        </div>

        <span data-testid="poi-detail-distance" className="mx-6 inline-flex items-center gap-1.5 text-[10px] font-semibold text-pink-600">
          <MapPin className="h-3 w-3" aria-hidden="true" />
          {lodgingDistanceLabel(distanceKm)}
        </span>

        <p className="whitespace-pre-line px-6 text-justify text-[12px] leading-[1.9] text-charcoal/70">{poi.description}</p>

        {poi.ownerNote ? (
          <section aria-label="Le mot de votre hôte" className="mx-6 rounded-[30px] bg-stone-200/40 p-6">
            <h2 className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-600">Le mot de votre hôte</h2>
            <p data-testid="owner-recommendation-note-text" className="mt-2 break-words whitespace-pre-line text-[15px] leading-snug text-gray-700">
              {poi.ownerNote}
            </p>
          </section>
        ) : null}

        {poi.hours ? (
          <section aria-label="Horaires" className="px-6 pb-2">
            <ul className="space-y-1.5 text-[10px]">
              {DAYS.map(([day, label]) => {
                const slot = poi.hours?.[day]
                return (
                  <li key={day} className="flex justify-between text-[11px] text-charcoal/60">
                    <span>{label}</span>
                    <span>{slot ? `${slot.open} – ${slot.close}` : 'Fermé'}</span>
                  </li>
                )
              })}
            </ul>
          </section>
        ) : null}

        {photoAttribution ? (
          <p data-testid="photo-attribution" className="px-6 text-[11px] text-charcoal/45 underline underline-offset-2">
            Photo : {photoAttribution}
          </p>
        ) : null}

        {trail ? (
          <section className="mx-6 rounded-[22px] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                <Mountain className="h-5 w-5" aria-hidden="true" />
              </span>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-emerald-700">
                  Randonnée · <span>{trail.difficulty === 'easy' ? 'Facile' : trail.difficulty}</span>
                </p>
                <h2 className="text-sm font-semibold text-slate-900">Informations du parcours</h2>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <TrailMetric icon={Route} value={trail.distanceKm === null ? 'Indisponible' : `${trail.distanceKm.toLocaleString('fr-FR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} km`} label="Distance" />
              <TrailMetric icon={TrendingUp} value={trail.elevationGainM === null ? 'Indisponible' : `${trail.elevationGainM} m`} label="Dénivelé" />
              <TrailMetric icon={Mountain} value={formatDuration(trail.estimatedDurationMinutes)} label="Durée" />
            </div>
            <p className="mt-3 text-[9px] text-slate-500">Départ : <span>{trail.startLabel}</span></p>
            {polylines.length > 0 ? (
              <svg
                role="img"
                aria-label={`Aperçu de la randonnée ${poi.name}`}
                viewBox="0 0 240 140"
                className="mt-4 h-40 w-full rounded-[18px] bg-[#f0f0eb]"
              >
                {polylines.map((points, index) => (
                  <polyline key={`${points}-${index}`} points={points} fill="none" stroke="#047857" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
                ))}
              </svg>
            ) : null}
            <button type="button" disabled aria-disabled="true" className="mt-4 inline-flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-full bg-emerald-700/35 px-4 py-3 text-xs font-bold text-white">
              <Play className="h-4 w-4 fill-current" aria-hidden="true" />
              Commencer la randonnée
            </button>
            <p className="mt-4 rounded-xl bg-slate-50 p-3 text-[9px] leading-4 text-slate-500">Suivi GPS indisponible dans le guide de démonstration.</p>
          </section>
        ) : null}

        <div data-testid="demo-poi-actions" className="mx-6 grid grid-cols-2 gap-2 px-1 pb-3 pt-2">
          {poi.phone ? <DemoActionButton icon={Phone} label="Appeler" tone="call" disabled /> : null}
          {poi.website ? (
            <DemoActionButton icon={Globe} label="Site web" tone="website" disabled />
          ) : null}
          <DemoActionButton icon={Map} label="Voir sur la carte" tone="map" onClick={() => onShowOnMap(poi)} />
          <DemoActionButton icon={Navigation} label="Obtenir l’itinéraire" tone="directions" disabled />
        </div>
      </main>
    </article>
  )
}

const ACTION_TONES = {
  call: { bubble: 'bg-[#31B95D]', label: 'text-[#31B95D]' },
  directions: { bubble: 'bg-[#EF5148]', label: 'text-[#EF5148]' },
  website: { bubble: 'bg-[#218F9D]', label: 'text-[#218F9D]' },
  map: { bubble: 'bg-slate-900', label: 'text-slate-900' },
} as const

function DemoActionButton({
  icon: Icon,
  label,
  tone,
  disabled = false,
  onClick,
}: {
  icon: LucideIcon
  label: string
  tone: keyof typeof ACTION_TONES
  disabled?: boolean
  onClick?: () => void
}) {
  const colors = ACTION_TONES[tone]
  return (
    <button
      type="button"
      disabled={disabled}
      aria-disabled={disabled ? 'true' : undefined}
      onClick={onClick}
      className="flex min-h-[42px] w-full min-w-0 items-center justify-center gap-1.5 whitespace-nowrap rounded-full bg-white py-1 pl-1 pr-2 text-[9px] font-bold uppercase tracking-[0.12em] shadow-[0_7px_16px_rgba(17,24,39,0.07)] transition-[transform,box-shadow] duration-200 enabled:hover:shadow-[0_9px_20px_rgba(17,24,39,0.09)] enabled:active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-70"
    >
      <span
        data-testid={`demo-poi-action-icon-${tone}`}
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-white ${colors.bubble}`}
      >
        <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      </span>
      <span className={`shrink-0 ${colors.label}`}>{label}</span>
    </button>
  )
}

function TrailMetric({ icon: Icon, value, label }: { icon: LucideIcon; value: string; label: string }) {
  return (
    <div className="rounded-xl bg-slate-50 p-2.5 text-center">
      <Icon className="mx-auto h-4 w-4 text-emerald-700" aria-hidden="true" />
      <strong className="mt-2 block text-xs text-slate-900">{value}</strong>
      <span className="mt-1 block text-[8px] text-slate-400">{label}</span>
    </div>
  )
}
