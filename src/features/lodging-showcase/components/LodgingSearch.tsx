'use client'

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MapPin, SlidersHorizontal, UsersRound, X } from 'lucide-react'
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

const CHEVRON =
  "bg-[url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"12\" height=\"12\" viewBox=\"0 0 24 24\" fill=\"none\" stroke=\"%2394a3b8\" stroke-width=\"2.5\" stroke-linecap=\"round\" stroke-linejoin=\"round\"><polyline points=\"6 9 12 15 18 9\"/></svg>')] bg-[length:11px] bg-[right_center] bg-no-repeat"

const selectBare = `w-full appearance-none cursor-pointer bg-transparent pr-5 text-[15px] font-bold text-slate-800 focus:outline-none ${CHEVRON}`
const selectFull = `min-h-12 w-full appearance-none cursor-pointer rounded-2xl border border-slate-200 bg-white px-4 pr-9 text-sm font-bold text-slate-800 focus:outline-none focus-visible:border-pink-500 bg-[right_16px_center] ${CHEVRON}`
const labelClass = 'text-[9px] font-extrabold uppercase tracking-[0.18em] text-slate-400'

export function LodgingSearch({ lodgings }: { lodgings: MarketingLodgingCard[] }) {
  const [filters, setFilters] = useState<LodgingFilterState>(EMPTY_FILTER_STATE)
  const [drawerOpen, setDrawerOpen] = useState(false)

  const cityOptions = useMemo(() => deriveCityOptions(lodgings), [lodgings])
  const amenityOptions = useMemo(() => deriveAmenityOptions(lodgings), [lodgings])
  const results = useMemo(() => filterLodgings(lodgings, filters), [lodgings, filters])
  const active = isFilterActive(filters)
  const activeCount =
    (filters.city ? 1 : 0) + (filters.minGuests ? 1 : 0) + filters.amenities.length

  useEffect(() => {
    if (!drawerOpen) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setDrawerOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [drawerOpen])

  function toggleAmenity(id: AmenityFilterId) {
    setFilters(prev => ({
      ...prev,
      amenities: prev.amenities.includes(id)
        ? prev.amenities.filter(item => item !== id)
        : [...prev.amenities, id],
    }))
  }

  const resultLabel = `${results.length} logement${results.length > 1 ? 's' : ''}`

  function renderCitySelect(className: string) {
    return (
      <select
        aria-label="Ville"
        className={className}
        value={filters.city ?? ''}
        onChange={event => setFilters(prev => ({ ...prev, city: event.target.value || null }))}
      >
        <option value="">Toutes les villes</option>
        {cityOptions.map(city => (
          <option key={city} value={city}>
            {city}
          </option>
        ))}
      </select>
    )
  }

  function renderGuestsSelect(className: string) {
    return (
      <select
        aria-label="Couchages"
        className={className}
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
            {count} couchages et +
          </option>
        ))}
      </select>
    )
  }

  function renderAmenityChips() {
    return (
      <div className="flex flex-wrap gap-2">
        {amenityOptions.map(amenity => {
          const selected = filters.amenities.includes(amenity.id)
          return (
            <button
              key={amenity.id}
              type="button"
              aria-pressed={selected}
              onClick={() => toggleAmenity(amenity.id)}
              className={`inline-flex min-h-9 items-center rounded-full border px-3.5 text-xs font-bold transition-colors ${
                selected
                  ? 'border-pink-600 bg-pink-600 text-white'
                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
              }`}
            >
              {amenity.label}
            </button>
          )
        })}
      </div>
    )
  }

  return (
    <div>
      {/* ---------- Barre desktop (segmentée) ---------- */}
      <div
        data-testid="lodging-filters"
        className="hidden items-stretch rounded-full border border-slate-200/80 bg-white p-2 shadow-[0_18px_45px_rgba(15,23,42,0.07)] lg:flex"
      >
        <div className="flex min-w-[190px] flex-col justify-center gap-0.5 px-6 py-1.5">
          <span className={labelClass}>Ville</span>
          {renderCitySelect(selectBare)}
        </div>
        <span className="my-2 w-px bg-slate-200/80" />
        <div className="flex min-w-[190px] flex-col justify-center gap-0.5 px-6 py-1.5">
          <span className={labelClass}>Couchages</span>
          {renderGuestsSelect(selectBare)}
        </div>
        {amenityOptions.length > 0 && (
          <>
            <span className="my-2 w-px bg-slate-200/80" />
            <div className="flex flex-col justify-center gap-1.5 px-6 py-1.5">
              <span className={labelClass}>Équipements</span>
              {renderAmenityChips()}
            </div>
          </>
        )}

        <div className="ml-auto flex items-center gap-4 pl-6 pr-3">
          {active && (
            <button
              type="button"
              onClick={() => setFilters(EMPTY_FILTER_STATE)}
              className="text-xs font-bold text-slate-400 transition-colors hover:text-pink-600"
            >
              Réinitialiser
            </button>
          )}
          <span className="inline-flex items-center rounded-full bg-slate-900 px-4 py-2.5 text-xs font-bold text-white">
            {resultLabel}
          </span>
        </div>
      </div>

      {/* ---------- Déclencheur mobile (aligné à gauche, au-dessus des photos) ---------- */}
      <div className="flex items-center justify-between gap-4 lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          aria-label="Ouvrir les filtres"
          className="inline-flex items-center gap-2.5 rounded-full bg-slate-900 py-3 pl-5 pr-4 text-xs font-bold uppercase tracking-[0.08em] text-white shadow-[0_12px_30px_rgba(15,23,42,0.16)] transition-colors hover:bg-pink-600"
        >
          <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
          Filtrer
          {active && (
            <span className="grid h-5 min-w-5 place-items-center rounded-full bg-pink-600 px-1 text-[10px] font-bold">
              {activeCount}
            </span>
          )}
        </button>
        <span className="text-xs font-bold text-slate-500">{resultLabel}</span>
      </div>

      {/* ---------- Tiroir mobile ---------- */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-[90] bg-slate-900/40 backdrop-blur-sm lg:hidden"
            />
            <motion.aside
              role="dialog"
              aria-label="Filtres de recherche"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', stiffness: 320, damping: 34 }}
              className="fixed right-0 top-0 z-[95] flex h-full w-[86%] max-w-[360px] flex-col bg-white shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
                <h2 className="text-lg font-bold tracking-[-0.02em] text-slate-900">Filtrer</h2>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Fermer les filtres"
                  className="grid h-9 w-9 place-items-center rounded-full text-slate-500 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 space-y-6 overflow-y-auto px-6 py-6">
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                    <MapPin className="h-3.5 w-3.5 text-pink-600" /> Ville
                  </label>
                  {renderCitySelect(selectFull)}
                </div>
                <div>
                  <label className="mb-2 flex items-center gap-1.5 text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                    <UsersRound className="h-3.5 w-3.5 text-pink-600" /> Couchages
                  </label>
                  {renderGuestsSelect(selectFull)}
                </div>
                {amenityOptions.length > 0 && (
                  <div>
                    <span className="mb-2 block text-[10px] font-extrabold uppercase tracking-[0.18em] text-slate-400">
                      Équipements
                    </span>
                    {renderAmenityChips()}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 border-t border-slate-100 px-6 py-4">
                {active && (
                  <button
                    type="button"
                    onClick={() => setFilters(EMPTY_FILTER_STATE)}
                    className="shrink-0 text-xs font-bold text-slate-400 hover:text-pink-600"
                  >
                    Réinitialiser
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="ml-auto inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-slate-900 px-5 text-sm font-bold text-white transition-colors hover:bg-pink-600"
                >
                  Voir {resultLabel}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ---------- Résultats ---------- */}
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
