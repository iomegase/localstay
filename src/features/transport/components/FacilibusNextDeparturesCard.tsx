'use client'

import { ChevronRight } from 'lucide-react'
import { useTransportResource } from '../hooks/useTransportResource'
import type { DeparturesResult, NearbyResult } from '../types'
import { FacilibusDepartureRow } from './FacilibusDepartureRow'
import { StationDistance } from './StationDistance'

export const DEPARTURES_REFRESH_MS = 30_000

const usable = (status: string | undefined) => status === 'available' || status === 'stale' || status === 'no_departures'

/**
 * Carte « Prochaines navettes » de la page Séjour (spec 055 AC-01-01). Tant que
 * les données ne sont pas exploitables, la ligne « Se déplacer » reste affichée.
 */
export function FacilibusNextDeparturesCard({
  latitude,
  longitude,
  onOpen,
  fallback,
}: {
  latitude: number
  longitude: number
  onOpen: () => void
  fallback: React.ReactNode
}) {
  const nearby = useTransportResource<NearbyResult>(
    `/api/transport/facilibus/nearby?lat=${latitude}&lng=${longitude}`,
  )
  const nearest = nearby.envelope?.status === 'available' || nearby.envelope?.status === 'stale'
    ? nearby.envelope.data.stations[0]
    : undefined
  const departures = useTransportResource<DeparturesResult>(
    nearest ? `/api/transport/facilibus/departures?stationId=${encodeURIComponent(nearest.id)}&limit=3` : null,
    DEPARTURES_REFRESH_MS,
  )

  if (!nearest || !departures.envelope || !usable(departures.envelope.status)) return <>{fallback}</>
  const list = departures.envelope.data.departures

  return (
    <section
      aria-label="Prochaines navettes"
      className="rounded-[20px] bg-white p-4 shadow-[0_1px_2px_rgba(17,17,17,0.06)]"
    >
      <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#DB2777]">Prochaines navettes</p>
      <h2 className="mt-1 text-[16px] font-semibold text-[#111111]">{nearest.name}</h2>
      <StationDistance station={nearest} />
      {list.length > 0 ? (
        <ul className="mt-1 divide-y divide-[rgba(17,17,17,0.08)]">
          {list.map(departure => <FacilibusDepartureRow key={departure.id} departure={departure} />)}
        </ul>
      ) : (
        <p className="mt-3 text-[14px] text-[#697386]">Aucun départ dans les prochaines 24 h.</p>
      )}
      {departures.envelope.status === 'stale' ? (
        <p className="mt-2 text-[12px] text-[#697386]">Horaires non actualisés.</p>
      ) : null}
      <button
        type="button"
        onClick={onOpen}
        className="mt-2 flex min-h-11 w-full items-center justify-between text-[14px] font-semibold text-[#DB2777]"
      >
        Tous les transports
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </section>
  )
}
