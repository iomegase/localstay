import Image from 'next/image'
import {
  ArrowLeft,
  ExternalLink,
  Globe2,
  Map,
  MapPin,
  Mountain,
  Phone,
  Route,
  Star,
  TrendingUp,
} from 'lucide-react'
import { canStartTrail } from '@/features/guide-app/lib/trail-access'
import type { GuideMode, GuidePoi } from '@/features/guide-app/types'

export function GuidePoiDetails({
  mode,
  poi,
  onBack,
  onShowOnMap,
}: {
  mode: GuideMode
  poi: GuidePoi
  onBack: () => void
  onShowOnMap: (poi: GuidePoi) => void
}) {
  return (
    <article className="min-h-full bg-slate-50 pb-24">
      <section className="relative h-[265px] overflow-hidden bg-slate-900 text-white">
        <Image
          src={poi.photos[0]}
          alt={poi.name}
          fill
          priority
          sizes="360px"
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/25 to-slate-900/30" />
        <button
          type="button"
          onClick={onBack}
          aria-label="Retour aux coups de cœur"
          className="absolute left-4 top-4 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-slate-900 shadow-lg backdrop-blur"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <div className="absolute inset-x-5 bottom-6">
          <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-pink-300">
            {poi.category.name}
          </p>
          <h1 className="mt-2 text-[28px] font-semibold leading-[0.98] tracking-[-0.04em]">
            {poi.name}
          </h1>
        </div>
      </section>

      <div className="relative -mt-4 space-y-4 rounded-t-[28px] bg-slate-50 px-4 pt-6">
        <div className="flex items-start justify-between gap-3">
          <p className="flex items-start gap-2 text-[10px] leading-4 text-slate-500">
            <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-pink-600" />
            {poi.address}
          </p>
          {poi.rating !== undefined && (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-bold shadow-sm">
              <Star className="h-3 w-3 fill-pink-600 text-pink-600" />
              {poi.rating.toFixed(1)}
            </span>
          )}
        </div>

        <p className="text-xs leading-5 text-slate-600">{poi.description}</p>

        {poi.trail && (
          <section className="rounded-[22px] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                <Mountain className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-emerald-700">
                  Randonnée {formatDifficulty(poi.trail.difficulty)}
                </p>
                <h2 className="text-sm font-semibold text-slate-900">
                  Les informations du parcours
                </h2>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Metric
                icon={Route}
                value={
                  poi.trail.distanceKm === null
                    ? '—'
                    : `${String(poi.trail.distanceKm).replace('.', ',')} km`
                }
                label="Distance"
              />
              <Metric
                icon={TrendingUp}
                value={
                  poi.trail.elevationGainM === null
                    ? '—'
                    : `${poi.trail.elevationGainM} m`
                }
                label="Dénivelé"
              />
              <Metric
                icon={Mountain}
                value={poi.durationLabel ?? '—'}
                label="Durée"
              />
            </div>
            {canStartTrail(mode, poi.trail) && (
              <button
                type="button"
                aria-label="Démarrer la randonnée"
                className="mt-4 w-full rounded-full bg-emerald-700 px-4 py-3 text-xs font-bold text-white"
              >
                Démarrer
              </button>
            )}
            {mode === 'demo' && (
              <p className="mt-4 rounded-xl bg-slate-50 p-3 text-[9px] leading-4 text-slate-500">
                Le suivi GPS est volontairement désactivé dans le guide de démonstration.
              </p>
            )}
          </section>
        )}

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => onShowOnMap(poi)}
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-slate-900 px-3 text-[9px] font-bold uppercase tracking-[0.1em] text-white"
          >
            <Map className="h-4 w-4" />
            Voir sur la carte
          </button>
          <a
            href={poi.directionsUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-3 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-900 shadow-sm"
          >
            <ExternalLink className="h-4 w-4 text-pink-600" />
            Itinéraire
          </a>
          {poi.website && (
            <a
              href={poi.website}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-3 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-900 shadow-sm"
            >
              <Globe2 className="h-4 w-4 text-blue-600" />
              Site
            </a>
          )}
          {poi.phone && (
            <a
              href={`tel:${poi.phone.replace(/\s/g, '')}`}
              className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-3 text-[9px] font-bold uppercase tracking-[0.1em] text-slate-900 shadow-sm"
            >
              <Phone className="h-4 w-4 text-emerald-600" />
              Appeler
            </a>
          )}
        </div>
      </div>
    </article>
  )
}

function Metric({
  icon: Icon,
  value,
  label,
}: {
  icon: typeof Route
  value: string
  label: string
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-2.5 text-center">
      <Icon className="mx-auto h-4 w-4 text-emerald-700" />
      <strong className="mt-2 block text-xs text-slate-900">{value}</strong>
      <span className="mt-1 block text-[8px] text-slate-400">{label}</span>
    </div>
  )
}

function formatDifficulty(difficulty: NonNullable<GuidePoi['trail']>['difficulty']) {
  const labels = {
    easy: 'facile',
    medium: 'modérée',
    hard: 'difficile',
    expert: 'expert',
    unknown: '',
  }
  return labels[difficulty]
}
