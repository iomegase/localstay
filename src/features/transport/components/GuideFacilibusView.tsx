'use client'

import { useState } from 'react'
import { GuideStayScreen } from '@/features/guide-app/components/stay/GuideStayScreen'
import type { GuideLodging } from '@/features/guide-app/types'
import { useTransportResource } from '../hooks/useTransportResource'
import { formatParisTime } from '../lib/time'
import type { DeparturesResult, NearbyResult, PublicRoute, PublicStation } from '../types'
import { FacilibusDepartureRow } from './FacilibusDepartureRow'
import { RoutePill } from './RoutePill'
import { StationDistance } from './StationDistance'
import { primaryTravel } from '@/features/guide-app/components/stay/poi-search'
import { DEPARTURES_REFRESH_MS } from './FacilibusNextDeparturesCard'

const dateFormatter = new Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris', day: '2-digit', month: '2-digit' })

/** Dernier jour couvert : la fin de couverture est exclusive. */
function coverageEndLabel(iso: string): string {
  return dateFormatter.format(new Date(Date.parse(iso) - 1000))
}

/** « Télécabines/Le Châtelet - Saint Nicolas » → « Télécabines / Le Châtelet ↔ Saint Nicolas ». */
export function formatRouteName(longName: string): string {
  return longName.replace(/\s*\/\s*/g, ' / ').replace(/\s+-\s+/g, ' ↔ ').trim()
}

/** Lignes du réseau, une seule fois chacune, dans l'ordre des numéros. */
function networkRoutes(stations: PublicStation[]): PublicRoute[] {
  const byName = new Map<string, PublicRoute>()
  for (const station of stations) for (const route of station.routes) byName.set(route.shortName, route)
  return [...byName.values()].sort((a, b) => a.shortName.localeCompare(b.shortName, 'fr', { numeric: true }))
}

/** Page horaires Facilibus (spec 055 US-02). */
export function GuideFacilibusView({
  lodging,
  onBack,
}: {
  lodging: Pick<GuideLodging, 'latitude' | 'longitude' | 'locationPrecise'>
  onBack: () => void
}) {
  const nearby = useTransportResource<NearbyResult>(
    lodging.locationPrecise
      ? `/api/transport/facilibus/nearby?lat=${lodging.latitude}&lng=${lodging.longitude}`
      : null,
  )
  const stops = useTransportResource<PublicStation[]>('/api/transport/facilibus/stops')
  const [chosenId, setChosenId] = useState<string | null>(null)

  const nearbyStations = nearby.envelope?.data.stations ?? []
  const selectedId = chosenId ?? nearbyStations[0]?.id ?? null
  const selectedNearby = nearbyStations.find(station => station.id === selectedId)
  const allStations = stops.envelope?.data ?? []
  const routes = networkRoutes(allStations)
  const selectedName = selectedNearby?.name ?? allStations.find(station => station.id === selectedId)?.name

  const departures = useTransportResource<DeparturesResult>(
    selectedId ? `/api/transport/facilibus/departures?stationId=${encodeURIComponent(selectedId)}` : null,
    DEPARTURES_REFRESH_MS,
  )
  const envelope = departures.envelope
  const outage = departures.failed && !envelope ? true : envelope?.status === 'unavailable'

  return (
    <GuideStayScreen title="Navette gratuite" subtitle="Réseau Facilibus · Saint-Gervais ↔ Saint-Nicolas-de-Véroce" onBack={onBack}>
      {routes.length > 0 ? (
        <section aria-label="Lignes" className="mb-5 grid gap-2">
          {routes.map(route => (
            <p key={route.shortName} className="flex items-center gap-3 text-[14px] text-[#111111]">
              <RoutePill route={route} />
              <span>{route.longName ? formatRouteName(route.longName) : `Ligne ${route.shortName}`}</span>
            </p>
          ))}
        </section>
      ) : null}

      {nearbyStations.length > 1 ? (
        <div className="mb-4">
          <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#697386]">Arrêts proches</p>
          <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
            {nearbyStations.map(station => (
              <button
                key={station.id}
                type="button"
                aria-pressed={station.id === selectedId}
                onClick={() => setChosenId(station.id)}
                className={`min-h-11 shrink-0 rounded-full border px-4 text-[13px] font-semibold ${
                  station.id === selectedId
                    ? 'border-[#111111] bg-[#111111] text-white'
                    : 'border-[rgba(17,17,17,0.15)] bg-white text-[#111111]'
                }`}
              >
                {station.name} · {primaryTravel(station.travel ?? undefined)?.label ?? `${station.distanceMeters} m`}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <label className="block text-[12px] font-semibold uppercase tracking-[0.08em] text-[#697386]">
        Arrêt
        <select
          value={selectedId ?? ''}
          onChange={event => setChosenId(event.target.value || null)}
          className="mt-2 block h-12 w-full rounded-[14px] border border-[rgba(17,17,17,0.15)] bg-white px-3 text-[15px] font-normal normal-case tracking-normal text-[#111111]"
        >
          {!selectedId ? <option value="">Choisissez un arrêt</option> : null}
          {allStations.map(station => (
            <option key={station.id} value={station.id}>{station.name}</option>
          ))}
        </select>
      </label>

      {selectedId ? (
        <section aria-label="Prochains départs" className="mt-5 rounded-[20px] bg-white p-4 shadow-[0_1px_2px_rgba(17,17,17,0.06)]">
          <h2 className="text-[16px] font-semibold text-[#111111]">{selectedName ?? 'Prochains départs'}</h2>
          {selectedNearby ? <StationDistance station={selectedNearby} /> : null}

          {outage ? (
            <p role="status" className="mt-3 text-[14px] text-[#697386]">Horaires momentanément indisponibles.</p>
          ) : !envelope ? (
            <p className="mt-3 text-[14px] text-[#697386]">Chargement des horaires…</p>
          ) : envelope.data.departures.length > 0 ? (
            <ul className="mt-1 divide-y divide-[rgba(17,17,17,0.08)]">
              {envelope.data.departures.map(departure => <FacilibusDepartureRow key={departure.id} departure={departure} />)}
            </ul>
          ) : envelope.meta.coverage?.partial ? (
            <p className="mt-3 text-[14px] text-[#697386]">
              Horaires publiés jusqu’au {coverageEndLabel(envelope.meta.coverage.to)} : aucun départ connu au-delà.
            </p>
          ) : (
            <p className="mt-3 text-[14px] text-[#697386]">Aucun départ dans les prochaines 24 h.</p>
          )}

          {envelope && !outage ? (
            <p className="mt-3 text-[12px] text-[#9CA3AF]">
              {envelope.status === 'stale' ? 'Horaires non actualisés' : 'Horaires Facilibus'} · mis à jour à {formatParisTime(envelope.meta.fetchedAt)}
            </p>
          ) : null}
        </section>
      ) : null}
    </GuideStayScreen>
  )
}
