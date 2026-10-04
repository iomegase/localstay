'use client'

import { useId, useState } from 'react'
import dynamic from 'next/dynamic'
import type { GuideLodging } from '@/features/guide-app/types'
import { useTransportResource } from '../hooks/useTransportResource'
import { formatParisTime } from '../lib/time'
import type {
  DeparturesResult,
  LinesResult,
  NearbyResult,
  PublicRoute,
  PublicStation,
  PublicVehicle,
} from '../types'

// MapBox chargé seulement côté client, à l'ouverture de l'accordéon (spec 058).
const FacilibusMap = dynamic(() => import('./FacilibusMap').then(module => module.FacilibusMap), {
  ssr: false,
  loading: () => <div className="h-[260px] rounded-[20px] bg-[#E8E6E2]" aria-hidden="true" />,
})
const VEHICLES_REFRESH_MS = 15_000
import { FacilibusDepartureRow } from './FacilibusDepartureRow'
import { RoutePill } from './RoutePill'
import { StationDistance } from './StationDistance'
import { primaryTravel } from '@/features/guide-app/components/stay/poi-search'
import { Car, ChevronDown, ChevronRight, Footprints, House, MapPin } from 'lucide-react'
import { useGuideI18n } from '@/features/guide-i18n/components/GuideI18nContext'

const DEPARTURES_REFRESH_MS = 30_000


/** Dernier jour couvert : la fin de couverture est exclusive. */
function coverageEndLabel(iso: string, intlLocale: string): string {
  return new Intl.DateTimeFormat(intlLocale, { timeZone: 'Europe/Paris', day: '2-digit', month: '2-digit' }).format(new Date(Date.parse(iso) - 1000))
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

/** Horaires, arrêts et carte Facilibus dans l'accordéon « Navette gratuite ». */
export function FacilibusDetails({ lodging }: {
  lodging: Pick<GuideLodging, 'latitude' | 'longitude' | 'locationPrecise'>
}) {
  const { intlLocale, messages: m } = useGuideI18n()
  const nearby = useTransportResource<NearbyResult>(
    lodging.locationPrecise
      ? `/api/transport/facilibus/nearby?lat=${lodging.latitude}&lng=${lodging.longitude}`
      : null,
  )
  const stops = useTransportResource<PublicStation[]>('/api/transport/facilibus/stops')
  const [chosenId, setChosenId] = useState<string | null>(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [showAllStops, setShowAllStops] = useState(false)
  const pickerId = useId()

  const nearbyStations = nearby.envelope?.data.stations ?? []
  const selectedId = chosenId ?? nearbyStations[0]?.id ?? null
  const selectedNearby = nearbyStations.find(station => station.id === selectedId)
  const allStations = stops.envelope?.data ?? []
  const routes = networkRoutes(allStations)
  const selectedName = selectedNearby?.name ?? allStations.find(station => station.id === selectedId)?.name
  const otherStations = allStations.filter(station => !nearbyStations.some(nearbyStation => nearbyStation.id === station.id))
  const showOtherStations = showAllStops || (selectedId !== null && !selectedNearby)

  function selectStation(stationId: string) {
    setChosenId(stationId)
    setPickerOpen(false)
  }

  function accessLabel(station: NearbyResult['stations'][number]): string {
    const travel = primaryTravel(station.travel ?? undefined)
    if (!travel) return m.transport.crowDistance(station.distanceMeters)
    return `${travel.label} ${travel.mode === 'walking' ? m.transport.onFoot : m.transport.byCar}`
  }

  const lines = useTransportResource<LinesResult>('/api/transport/facilibus/lines')
  const vehicles = useTransportResource<PublicVehicle[]>('/api/transport/facilibus/vehicles', VEHICLES_REFRESH_MS)
  const linesAvailable = lines.envelope?.status === 'available' || lines.envelope?.status === 'stale'

  const departures = useTransportResource<DeparturesResult>(
    selectedId ? `/api/transport/facilibus/departures?stationId=${encodeURIComponent(selectedId)}` : null,
    DEPARTURES_REFRESH_MS,
  )
  const envelope = departures.envelope
  const outage = departures.failed && !envelope ? true : envelope?.status === 'unavailable'

  return (
    <div className="min-w-0">
      {routes.length > 0 || lodging.locationPrecise ? (
        <section aria-label={m.transport.lines} className="mb-5 grid gap-2">
          {routes.map(route => (
            <p key={route.shortName} className="flex items-center gap-3 text-xs text-[#111111]">
              <RoutePill route={route} />
              <span>{route.longName ? formatRouteName(route.longName) : m.transport.line(route.shortName)}</span>
            </p>
          ))}
          {lodging.locationPrecise ? (
            <p className="flex items-center gap-3 text-xs text-[#111111]">
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#DB2777] text-white">
                <House className="h-4 w-4" aria-hidden="true" />
              </span>
              <span>{m.transport.yourLodging}</span>
            </p>
          ) : null}
        </section>
      ) : null}

      {linesAvailable && allStations.length > 0 ? (
        <div>
          <FacilibusMap
            stations={allStations}
            lines={lines.envelope?.data.lines ?? []}
            vehicles={vehicles.envelope?.data ?? []}
            selectedId={selectedId}
            origin={lodging.locationPrecise ? { latitude: lodging.latitude, longitude: lodging.longitude } : null}
            focusSelected={chosenId !== null}
            onSelect={selectStation}
          />
        </div>
      ) : null}

      <div className={`${linesAvailable && allStations.length > 0 ? 'relative z-10 -mt-7 mx-2' : ''} mb-5`}>
        <button
          type="button"
          aria-expanded={pickerOpen}
          aria-controls={pickerId}
          onClick={() => setPickerOpen(open => !open)}
          className="flex min-h-16 w-full items-center gap-3 rounded-[20px] bg-white px-4 py-3 text-left shadow-[0_5px_18px_rgba(17,17,17,0.12)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#DB2777]"
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[#111827] text-white">
            <MapPin className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[11px] font-semibold text-[#697386]">{selectedId ? m.transport.selectedStop : m.transport.stop}</span>
            <span className="block text-[14px] font-semibold leading-5 text-[#111827]">{selectedName ?? m.transport.chooseStop}</span>
            {selectedNearby ? <span className="mt-0.5 block text-[12px] text-[#DB2777]">{accessLabel(selectedNearby)}</span> : null}
          </span>
          <ChevronDown className={`h-5 w-5 shrink-0 text-[#111827] transition-transform duration-200 ${pickerOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>

        {pickerOpen ? (
          <div id={pickerId} className="mt-2 rounded-[20px] bg-[#F3F4F6] p-3 shadow-[0_2px_8px_rgba(17,17,17,0.04)]">
            {nearbyStations.length > 0 ? (
              <section aria-label={m.transport.nearbyStops} className="overflow-hidden rounded-[16px] bg-white">
                <h3 className="px-4 pt-4 pb-1 text-[13px] font-semibold text-[#111827]">{m.transport.nearbyStops}</h3>
                {nearbyStations.map(station => (
                  <button
                    key={station.id}
                    type="button"
                    aria-pressed={station.id === selectedId}
                    onClick={() => selectStation(station.id)}
                    className="flex min-h-14 w-full items-center gap-3 border-b border-[#E5E7EB] px-4 py-3 text-left last:border-b-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#DB2777]"
                  >
                    <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${station.id === selectedId ? 'border-[#DB2777]' : 'border-[#9CA3AF]'}`}>
                      {station.id === selectedId ? <span className="h-2.5 w-2.5 rounded-full bg-[#DB2777]" /> : null}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-[14px] font-semibold leading-5 text-[#111827]">{station.name}</span>
                      <span className="mt-0.5 flex items-center gap-1 text-[12px] text-[#697386]">
                        {primaryTravel(station.travel ?? undefined)?.mode === 'driving'
                          ? <Car className="h-3.5 w-3.5" aria-hidden="true" />
                          : primaryTravel(station.travel ?? undefined)?.mode === 'walking'
                            ? <Footprints className="h-3.5 w-3.5" aria-hidden="true" />
                            : <MapPin className="h-3.5 w-3.5" aria-hidden="true" />}
                        {accessLabel(station)}
                      </span>
                    </span>
                  </button>
                ))}
              </section>
            ) : null}

            {otherStations.length > 0 ? (
              <div className={nearbyStations.length > 0 ? 'mt-2' : ''}>
                {nearbyStations.length > 0 && !showOtherStations ? (
                  <button type="button" onClick={() => setShowAllStops(true)} className="flex min-h-11 w-full items-center justify-center gap-1 text-[13px] font-semibold text-[#DB2777]">
                    {m.transport.allStops} <ChevronRight className="h-4 w-4" aria-hidden="true" />
                  </button>
                ) : (
                  <section aria-label={m.transport.allStops} className="max-h-64 overflow-y-auto rounded-[16px] bg-white">
                    {otherStations.map(station => (
                      <button
                        key={station.id}
                        type="button"
                        aria-pressed={station.id === selectedId}
                        onClick={() => selectStation(station.id)}
                        className="flex min-h-12 w-full items-center gap-3 border-b border-[#E5E7EB] px-4 py-3 text-left text-[14px] leading-5 text-[#111827] last:border-b-0 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[#DB2777]"
                      >
                        <span className={`grid h-5 w-5 shrink-0 place-items-center rounded-full border-2 ${station.id === selectedId ? 'border-[#DB2777]' : 'border-[#9CA3AF]'}`}>
                          {station.id === selectedId ? <span className="h-2.5 w-2.5 rounded-full bg-[#DB2777]" /> : null}
                        </span>
                        {station.name}
                      </button>
                    ))}
                  </section>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>

      {selectedId ? (
        <section aria-label={m.transport.nextDepartures} className="mt-5 rounded-[20px] bg-white p-2 shadow-[0_1px_2px_rgba(17,17,17,0.06)]">
          <h2 className="text-[16px] font-semibold text-[#111111]">{selectedName ?? m.transport.nextDepartures}</h2>
          {selectedNearby ? <StationDistance station={selectedNearby} /> : null}

          {outage ? (
            <p role="status" className="mt-3 text-[14px] text-[#697386]">{m.transport.unavailable}</p>
          ) : !envelope ? (
            <p className="mt-3 text-[14px] text-[#697386]">{m.transport.loading}</p>
          ) : envelope.data.departures.length > 0 ? (
            <ul className="mt-1 divide-y divide-[rgba(17,17,17,0.08)]">
              {envelope.data.departures.map(departure => <FacilibusDepartureRow key={departure.id} departure={departure} />)}
            </ul>
          ) : envelope.meta.coverage?.partial ? (
            <p className="mt-3 text-[14px] text-[#697386]">
              {m.transport.coverage(coverageEndLabel(envelope.meta.coverage.to, intlLocale))}
            </p>
          ) : (
            <p className="mt-3 text-[14px] text-[#697386]">{m.transport.none}</p>
          )}

          {envelope && !outage ? (
            <p className="mt-3 text-[12px] text-[#9CA3AF]">
              {m.transport.updated(envelope.status === 'stale', formatParisTime(envelope.meta.fetchedAt))}
            </p>
          ) : null}
        </section>
      ) : null}
    </div>
  )
}
