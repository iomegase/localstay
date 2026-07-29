import { ArrowLeft, Map, MapPin, Mountain, Route, Star, TrendingUp } from 'lucide-react'
import { PoiDetailHeroCarousel } from '@/features/categories/components/PoiDetailHeroCarousel'
import { HoursBlock } from '@/features/categories/components/HoursBlock'
import { OwnerRecommendationNote } from '@/features/categories/components/OwnerRecommendationNote'
import { ActionButtons } from '@/features/categories/components/ActionButtons'
import { haversineKm } from '@/features/geolocation/lib/user-location'
import { getGuidePoiHeroImage } from '@/features/guide-app/lib/poi-image'
import { canStartTrail } from '@/features/guide-app/lib/trail-access'
import type { GuideLodging, GuideMode, GuidePoi } from '@/features/guide-app/types'

export function GuidePoiDetails({
  mode,
  poi,
  lodging,
  onBack,
  onShowOnMap,
}: {
  mode: GuideMode
  poi: GuidePoi
  lodging: GuideLodging
  onBack: () => void
  onShowOnMap: (poi: GuidePoi) => void
}) {
  const heroPhotos = poi.photos.length > 0
    ? poi.photos
    : [getGuidePoiHeroImage({ categorySlug: poi.category.slug, photos: [] })]
  const attributionHost = getWebsiteHost(poi.website)
  const hasRealPhotos = poi.photos.some(p => p.trim() && !p.startsWith('/fallback/'))
  const distanceKm = haversineKm(lodging.latitude, lodging.longitude, poi.latitude, poi.longitude)

  return (
    <article className="min-h-full bg-slate-50 pb-24">
      {/* Hero carousel */}
      <div className="relative">
        <PoiDetailHeroCarousel photos={heroPhotos} name={poi.name}>
          {poi.isOpenNow === true && (
            <div className="absolute bottom-8 left-6 z-10 pb-4">
              <span className="inline-flex rounded-full border border-green-200 bg-green-50/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-green-700 shadow-sm backdrop-blur">
                Ouvert
              </span>
            </div>
          )}
        </PoiDetailHeroCarousel>
        <button
          type="button"
          onClick={onBack}
          aria-label="Retour aux coups de cœur"
          className="absolute left-4 top-4 z-20 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-slate-900 shadow-lg backdrop-blur active:scale-95"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Content sheet */}
      <main className="relative z-10 -mt-8 space-y-6 rounded-t-[28px] bg-slate-50 pb-8 pt-8 shadow-[0_-10px_40px_rgba(0,0,0,0.08)]">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-6">
          <div className="min-w-0 flex-1">
            <span className="text-[9px] font-bold uppercase tracking-widest text-pink-600">
              {poi.category.name}
            </span>
            <h1 className="mt-1 text-xl uppercase leading-tight text-charcoal">{poi.name}</h1>
            <p className="mt-4 truncate text-xs text-charcoal/50">{poi.address}</p>
          </div>
          {poi.rating != null && (
            <div className="ml-4 flex shrink-0 items-center">
              <span className="inline-flex items-center gap-1 rounded-2xl border border-gray-100 bg-white px-3 py-1.5 shadow-sm">
                <Star className="h-3.5 w-3.5 fill-pink-600 text-pink-600" />
                <span className="text-sm font-bold" data-testid="poi-detail-rating">{poi.rating.toFixed(1)}</span>
              </span>
              {poi.reviewCount != null && poi.reviewCount > 0 && (
                <span className="ml-3 mt-1 text-[10px] text-charcoal/40" data-testid="poi-detail-rating-count">
                  {poi.reviewCount} avis
                </span>
              )}
            </div>
          )}
        </div>

        {/* Distance from lodging */}
        <div className="px-6">
          <span className="inline-flex items-center gap-1.5 text-sm text-charcoal/60">
            <MapPin className="h-4 w-4" />
            <span data-testid="poi-detail-distance">{lodgingDistanceLabel(distanceKm)}</span>
          </span>
        </div>

        {/* Description */}
        {poi.description && (
          <p className="whitespace-pre-line px-6 text-sm leading-relaxed text-charcoal/70">{poi.description}</p>
        )}

        {/* Le mot de votre hôte */}
        <OwnerRecommendationNote note={poi.ownerNote ?? null} />

        {/* Hours */}
        {poi.hours && (
          <div className="px-6 pb-2">
            <HoursBlock is_open_now={poi.isOpenNow ?? null} hours={poi.hours} showOpenBadge={false} />
          </div>
        )}

        {/* Photo attribution */}
        {hasRealPhotos && poi.website && attributionHost && (
          <div className="px-6">
            <a
              href={poi.website}
              target="_blank"
              rel="noreferrer"
              data-testid="photo-attribution"
              className="text-[11px] text-charcoal/45 underline underline-offset-2"
            >
              Photos : {attributionHost}
            </a>
          </div>
        )}

        {/* Voir sur la carte (navigation interne) */}
        <div className="px-6">
          <button
            type="button"
            onClick={() => onShowOnMap(poi)}
            className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-full bg-slate-900 px-4 text-[10px] font-bold uppercase tracking-[0.12em] text-white active:scale-[0.98]"
          >
            <Map className="h-4 w-4" />
            Voir sur la carte
          </button>
        </div>

        {/* Appeler / Itinéraire / Site web */}
        <div className="px-6">
          <ActionButtons
            phone={poi.phone ?? null}
            website={poi.website ?? null}
            latitude={poi.latitude}
            longitude={poi.longitude}
            address={poi.address}
            variant="compact"
          />
        </div>

        {/* Bloc randonnée (sans démarrage GPS en démo) */}
        {poi.trail && (
          <section className="mx-6 rounded-[22px] bg-white p-4 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                <Mountain className="h-5 w-5" />
              </span>
              <div>
                <p className="text-[8px] font-bold uppercase tracking-[0.15em] text-emerald-700">
                  Randonnée {formatDifficulty(poi.trail.difficulty)}
                </p>
                <h2 className="text-sm font-semibold text-slate-900">Les informations du parcours</h2>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-3 gap-2">
              <Metric
                icon={Route}
                value={poi.trail.distanceKm === null ? '—' : `${String(poi.trail.distanceKm).replace('.', ',')} km`}
                label="Distance"
              />
              <Metric
                icon={TrendingUp}
                value={poi.trail.elevationGainM === null ? '—' : `${poi.trail.elevationGainM} m`}
                label="Dénivelé"
              />
              <Metric icon={Mountain} value={poi.durationLabel ?? '—'} label="Durée" />
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
      </main>
    </article>
  )
}

function lodgingDistanceLabel(distanceKm: number): string {
  if (distanceKm < 1) return `Situé à ${Math.round(distanceKm * 1000)} m du logement`
  return `Situé à ${distanceKm.toFixed(1).replace('.', ',')} km du logement`
}

function getWebsiteHost(website: string | null | undefined): string | null {
  if (!website) return null
  try {
    return new URL(website).hostname
  } catch {
    return null
  }
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
