'use client'

import { Search, X } from 'lucide-react'
import { guideCityTitle } from './poi-search'

/** En-tête de l'onglet Guide + champ de recherche (spec 056 AC-01-01). */
export function GuideSearchHeader({
  city,
  query,
  onQueryChange,
  headingProps,
  locationControl,
}: {
  city: string
  query: string
  onQueryChange: (query: string) => void
  /** Attributs du titre (focus d'annonce de vue, data-*) fournis par l'appelant. */
  headingProps?: React.HTMLAttributes<HTMLHeadingElement> & Record<`data-${string}`, string>
  /** Bouton « Utiliser ma position » (guide privé uniquement, spec 057). */
  locationControl?: React.ReactNode
}) {
  return (
    <div className="px-2">
      <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-[#DB2777]">Le guide</p>
      <h1 {...headingProps} className="mt-1 text-[30px] font-semibold leading-tight tracking-[-0.03em] text-[#111111]">
        {guideCityTitle(city)}
      </h1>
      <p className="mt-1 text-[14px] text-[#697386]">Nos coups de cœur pour profiter de votre séjour</p>
      <label className="relative mt-4 block">
        <span className="sr-only">Rechercher un lieu</span>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#697386]" aria-hidden="true" />
        <input
          type="search"
          value={query}
          onChange={event => onQueryChange(event.target.value)}
          placeholder="Rechercher un lieu"
          aria-label="Rechercher un lieu"
          className="h-[46px] w-full rounded-[14px] bg-white pl-12 pr-11 text-[15px] text-[#111111] shadow-[0_1px_2px_rgba(17,17,17,0.06)] outline-none placeholder:text-[#9CA3AF] focus:ring-2 focus:ring-[#FCE7F3] [&::-webkit-search-cancel-button]:hidden"
        />
        {query ? (
          <button
            type="button"
            onClick={() => onQueryChange('')}
            aria-label="Vider la recherche"
            className="absolute right-1 top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center text-[#697386]"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        ) : null}
      </label>
      {locationControl}
    </div>
  )
}

/** État vide de la recherche (spec 056 AC-01-03). */
export function GuideSearchEmpty({ query, onClear }: { query: string; onClear: () => void }) {
  return (
    <div className="px-2 pt-10 text-center">
      <p className="text-[14px] text-[#697386]">Aucun lieu ne correspond à « {query.trim()} ».</p>
      <button
        type="button"
        onClick={onClear}
        className="mt-3 min-h-11 rounded-full border border-[rgba(17,17,17,0.15)] bg-white px-5 text-[14px] font-semibold text-[#111111]"
      >
        Effacer
      </button>
    </div>
  )
}
