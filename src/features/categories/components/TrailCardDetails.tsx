'use client'

import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle, Baby, Car, Dog, MapPin, ParkingCircle } from 'lucide-react'
import type { PoiDetail, TrailDetailData } from '../types'
import { TrailPreviewMap } from '@/features/trail-navigation/components/TrailPreviewMap'
import { reliabilityFromQualityStatus } from '@/features/trails-acquisition/lib/geometry-quality'

const SEASON_LABEL: Record<string, string> = {
  spring: 'Printemps',
  summer: 'Été',
  autumn: 'Automne',
  winter: 'Hiver',
}

interface Props {
  citySlug: string
  categorySlug: string
  poiSlug: string
  poiName: string
  address: string
}

/**
 * Contenu rando affiché dans l'accordéon « En savoir plus » d'une PoiCard.
 * Récupère la fiche détaillée à l'ouverture (géométrie/tracé absents de la requête liste)
 * puis réutilise les briques de la fiche rando : mini-carte + actions + accès.
 */
export function TrailCardDetails({ citySlug, categorySlug, poiSlug, poiName, address }: Props) {
  const [trail, setTrail] = useState<TrailDetailData | null>(null)
  const [status, setStatus] = useState<'loading' | 'ready' | 'error'>('loading')

  useEffect(() => {
    let active = true
    setStatus('loading')
    fetch(`/api/cities/${citySlug}/categories/${categorySlug}/pois/${poiSlug}`)
      .then(res => (res.ok ? res.json() : Promise.reject(new Error('not ok'))))
      .then((payload: { data: PoiDetail }) => {
        if (!active) return
        setTrail(payload.data.trail_detail ?? null)
        setStatus('ready')
      })
      .catch(() => {
        if (active) setStatus('error')
      })
    return () => {
      active = false
    }
  }, [citySlug, categorySlug, poiSlug])

  if (status === 'loading') {
    return <div className="mt-5 h-[260px] w-full animate-pulse rounded-xl bg-gray-100" data-testid="trail-details-loading" />
  }

  if (status === 'error' || !trail) {
    return null
  }

  const hasStart = trail.start_latitude !== null && trail.start_longitude !== null
  const attribution = trail.source_refs.map(source => source.attribution).filter(Boolean).join(' · ')
  const hasPractical =
    Boolean(trail.parking_info) ||
    trail.best_season.length > 0 ||
    trail.kids_friendly === true ||
    trail.pets_friendly === true

  return (
    <div className="mt-5 space-y-4" data-testid="trail-details">
      <div className="overflow-hidden rounded-none">
        <TrailPreviewMap
          name={poiName}
          geometry={trail.geometry_geojson}
          startLatitude={trail.start_latitude}
          startLongitude={trail.start_longitude}
          startHref={`/guide/${citySlug}/${categorySlug}/${poiSlug}/start`}
          reliability={reliabilityFromQualityStatus(trail.data_quality_status)}
        />
      </div>

{/*
      <div className="space-y-3">
        <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#A68E69]">Comment s&apos;y rendre</p>
        <InfoCard icon={<MapPin className="h-5 w-5" />} title="Départ conseillé">
          <p className="mt-1 text-[11px] uppercase tracking-wider text-[#455E4C]">{trail.start_label ?? address}</p>
          {hasStart && (
            <p className="mt-1 text-[11px] italic leading-4 text-gray-500">
              Coordonnées départ : {trail.start_latitude?.toFixed(5)}, {trail.start_longitude?.toFixed(5)}
            </p>
          )}
        </InfoCard>
        <InfoCard icon={<Car className="h-5 w-5" />} title="Accès">
          <p className="mt-1 text-[11px] italic leading-4 text-gray-500">
            Utilisez «&nbsp;Rejoindre le départ&nbsp;» pour afficher un itinéraire depuis votre position vers le point de départ.
          </p>
        </InfoCard>
        <InfoCard icon={<AlertTriangle className="h-5 w-5" />} title="À prévoir">
          <p className="mt-1 text-[11px] italic leading-4 text-gray-500">
            MyStay ne remplace pas une carte officielle, la météo, le balisage terrain ou un équipement adapté.
          </p>
        </InfoCard>
      </div> */}

      {hasPractical && (
        <div className="space-y-3">
          <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-[#A68E69]">À savoir</p>
          {trail.parking_info && (
            <InfoCard icon={<ParkingCircle className="h-5 w-5" />} title="Parking">
              <p className="mt-1 text-[11px] uppercase tracking-wider text-[#455E4C]" data-testid="trail-parking">
                {trail.parking_info}
              </p>
            </InfoCard>
          )}
          {trail.best_season.length > 0 && (
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-charcoal/50 mb-2">
                Saison recommandée
              </p>
              <div className="flex flex-wrap gap-2" data-testid="trail-season">
                {trail.best_season.map(season => (
                  <span
                    key={season}
                    className="rounded-full border border-gray-200 bg-white px-3 py-1 text-xs text-charcoal/70"
                  >
                    {SEASON_LABEL[season] ?? season}
                  </span>
                ))}
              </div>
            </div>
          )}
          {(trail.pets_friendly === true || trail.kids_friendly === true) && (
            <div className="flex flex-wrap gap-4 text-sm">
              {trail.pets_friendly === true && (
                <span className="flex items-center gap-1.5 text-charcoal/70" data-testid="trail-pets">
                  <Dog className="h-4 w-4" /> Animaux acceptés
                </span>
              )}
              {trail.kids_friendly === true && (
                <span className="flex items-center gap-1.5 text-charcoal/70" data-testid="trail-kids">
                  <Baby className="h-4 w-4" /> En famille
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* {(trail.primary_source_type || attribution) && (
        <div className="rounded-[28px] border border-charcoal/5 bg-white p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#A68E69]">Randonnée</p>
          <p className="mt-3 text-xs leading-5 text-charcoal/60">
            Source principale&nbsp;: {trail.primary_source_type}
            {attribution ? ` · ${attribution}` : ''}
            {trail.data_quality_status === 'incomplete' ? ' · fiche incomplète validée par un administrateur' : ''}
          </p>
        </div>
      )} */}
    </div>
  )
}

function InfoCard({ icon, title, children }: { icon: ReactNode; title: string; children: ReactNode }) {
  return (
    <article className="flex gap-4 rounded-[1.8rem] border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#455E4C] text-white">{icon}</div>
      <div>
        <h4 className="text-sm font-bold">{title}</h4>
        {children}
      </div>
    </article>
  )
}
