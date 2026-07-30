'use client'

import { useMemo, useState } from 'react'
import { MarketingPropertyCard } from '@/features/marketing/components/MarketingPropertyCard'
import type { MarketingLodgingCard } from '@/features/lodging-showcase/queries/public-lodgings'
import {
  EMPTY_FILTER_STATE,
  GUEST_OPTIONS,
  deriveAmenityOptions,
  deriveCityOptions,
  filterLodgings,
  isFilterActive,
  type AmenityFilterId,
  type LodgingFilterState,
} from '@/features/lodging-showcase/lib/lodging-filters'

const selectClass =
  'min-h-11 w-full appearance-none rounded-full border border-slate-200 bg-white bg-[url(\'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="%2364748b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>\')] bg-[length:12px] bg-[right_18px_center] bg-no-repeat px-5 pr-10 text-xs font-bold text-slate-700 transition-colors hover:border-slate-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600'

const fieldLabelClass =
  'mb-2 block text-[9px] font-extrabold uppercase tracking-[0.16em] text-slate-400'

export function LodgingSearch({ lodgings }: { lodgings: MarketingLodgingCard[] }) {
  const [filters, setFilters] = useState<LodgingFilterState>(EMPTY_FILTER_STATE)

  const cityOptions = useMemo(() => deriveCityOptions(lodgings), [lodgings])
  const amenityOptions = useMemo(() => deriveAmenityOptions(lodgings), [lodgings])
  const results = useMemo(() => filterLodgings(lodgings, filters), [lodgings, filters])
  const active = isFilterActive(filters)

  function toggleAmenity(id: AmenityFilterId) {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(id)
        ? prev.amenities.filter(item => item !== id)
        : [...prev.amenities, id],
    }))
  }

  return (
    <div>
      <div
        data-testid="lodging-filters"
        className="rounded-[24px] border border-slate-200/70 bg-[radial-gradient(circle_at_100%_0,rgba(219,39,119,0.05),transparent_38%)] bg-white p-5 shadow-[0_18px_45px_rgba(15,23,42,0.06)] sm:p-6"
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="sm:min-w-[190px] sm:flex-1">
            <label htmlFor="lodging-city" className={fieldLabelClass}>
              Ville
            </label>
            <select
              id="lodging-city"
              className={selectClass}
              value={filters.city ?? ''}
              onChange={event =>
                setFilters(prev => ({ ...prev, city: event.target.value || null }))
              }
            >
              <option value="">Toutes les villes</option>
              {cityOptions.map(city => (
                <option key={city} value={city}>
                  {city}
                </option>
              ))}
            </select>
          </div>

          <div className="sm:min-w-[190px] sm:flex-1">
            <label htmlFor="lodging-guests" className={fieldLabelClass}>
              Couchages
            </label>
            <select
              id="lodging-guests"
              className={selectClass}
              value={filters.minGuests ?? ''}
              onChange={event =>
                setFilters(prev => ({
                  ...prev,
                  minGuests: event.target.value ? Number(event.target.value) : null,
                }))
              }
            >
              <option value="">Indifférent</option>
              {GUEST_OPTIONS.map(count => (
                <option key={count} value={count}>
                  {count} couchages ou plus
                </option>
              ))}
            </select>
          </div>

          {amenityOptions.length > 0 && (
            <div className="sm:min-w-[240px] sm:flex-1">
              <span className={fieldLabelClass}>Équipements</span>
              <div className="flex flex-wrap gap-2">
                {amenityOptions.map(amenity => {
                  const selected = filters.amenities.includes(amenity.id)
                  return (
                    <button
                      key={amenity.id}
                      type="button"
                      aria-pressed={selected}
                      onClick={() => toggleAmenity(amenity.id)}
                      className={`inline-flex min-h-11 items-center rounded-full border px-4 text-xs font-bold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600 ${
                        selected
                          ? 'border-pink-600 bg-pink-600 text-white'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {amenity.label}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4">
          <p className="text-xs font-bold text-slate-500" aria-live="polite">
            {results.length} logement{results.length > 1 ? 's' : ''}
            {active ? ' correspondant' + (results.length > 1 ? 's' : '') : ''}
          </p>
          {active && (
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTER_STATE)}
              className="text-xs font-bold text-pink-600 transition-colors hover:text-pink-700"
            >
              Réinitialiser
            </button>
          )}
        </div>
      </div>

      {results.length > 0 ? (
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.map(lodging => (
            <MarketingPropertyCard key={lodging.id} lodging={lodging} />
          ))}
        </div>
      ) : (
        <div className="mt-10 rounded-[28px] border border-dashed border-slate-300 bg-slate-50 p-10 text-center">
          <h2 className="text-xl font-bold text-slate-800">Aucun logement ne correspond.</h2>
          <p className="mx-auto mt-3 max-w-md text-sm leading-7 text-slate-500">
            Élargissez vos critères ou réinitialisez la recherche pour retrouver toutes nos
            adresses.
          </p>
          <button
            type="button"
            onClick={() => setFilters(EMPTY_FILTER_STATE)}
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-full bg-slate-900 px-5 text-xs font-bold text-white transition-colors hover:bg-pink-600"
          >
            Réinitialiser la recherche
          </button>
        </div>
      )}
    </div>
  )
}
