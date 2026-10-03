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
      className="rounded-[20px] bg-white p-4 shadow-md"
    >
      <p className="inline-flex w-fit rounded-full bg-slate-200 px-2.5 py-1 text-[10px] font-semibold uppercase leading-none tracking-[0.08em] text-slate-900">
        Navettes gratuites
      </p>
      <h2 className="mt-4 mb-2 text-[14px] font-semibold text-[#111111]">{nearest.name}</h2>
      <StationDistance station={nearest} />
      {list.length > 0 ? (
        <ul className="mt-1 divide-y divide-[rgba(17,17,17,0.08)]">
          {list.map(departure => <FacilibusDepartureRow key={departure.id} departure={departure} />)}
        </ul>
      ) : (
        <p className="mt-3 text-[12px] text-[#697386]">Aucun départ dans les prochaines 24 h.</p>
      )}
      {departures.envelope.status === 'stale' ? (
        <p className="mt-2 text-[12px] text-[#697386]">Horaires non actualisés.</p>
      ) : null}
      <button
        type="button"
        onClick={onOpen}
        className="mt-2 flex min-h-11 w-full items-center justify-end gap-1 text-[12px] font-semibold text-pink-600"
      >
        Tous les transports
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </section>
  )
}
