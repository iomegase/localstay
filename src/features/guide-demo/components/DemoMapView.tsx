'use client'

import { MapPin, X } from 'lucide-react'
import { useEffect, useRef } from 'react'
import { DemoPoiImage } from './DemoPoiImage'
import type { DemoPoi } from '@/features/guide-demo/types'

type DemoMapViewProps = {
  pois: readonly DemoPoi[]
  selectedPoi: DemoPoi | null
  onSelectPoi: (poi: DemoPoi) => void
  onDeselectPoi: () => void
  onOpenPoi: (poi: DemoPoi) => void
}

const markerPositions = [
  'left-[15%] top-[17%]',
  'left-[41%] top-[14%]',
  'left-[72%] top-[20%]',
  'left-[24%] top-[34%]',
  'left-[57%] top-[32%]',
  'left-[79%] top-[38%]',
  'left-[45%] top-[43%]',
  'left-[19%] top-[52%]',
  'left-[63%] top-[55%]',
  'left-[81%] top-[64%]',
  'left-[33%] top-[69%]',
  'left-[54%] top-[74%]',
  'left-[17%] top-[78%]',
  'left-[73%] top-[82%]',
] as const

export function DemoMapView({
  pois,
  selectedPoi,
  onSelectPoi,
  onDeselectPoi,
  onOpenPoi,
}: DemoMapViewProps) {
  const headingRef = useRef<HTMLHeadingElement>(null)
  const previewRef = useRef<HTMLElement>(null)

  useEffect(() => {
    headingRef.current?.focus()
  }, [])

  useEffect(() => {
    if (selectedPoi) previewRef.current?.focus()
  }, [selectedPoi])

  return (
    <section data-testid="demo-map-root" className="relative flex min-h-full flex-1 flex-col overflow-hidden bg-[#faf9f6] pb-32 pt-6">
      <div className="px-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#a68e69]">
          Points d’intérêt
        </p>
        <h1 ref={headingRef} tabIndex={-1} className="mt-2 font-serif text-4xl italic tracking-[-0.04em] text-[#121212]">
          Carte des coups de cœur
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          Carte de démonstration · position GPS désactivée
        </p>
      </div>

      <div className="relative mx-4 mt-6 h-[510px] overflow-hidden rounded-[34px] border border-stone-200 bg-[#e8e6df] shadow-sm">
        <svg
          className="absolute inset-0 h-full w-full opacity-70"
          viewBox="0 0 400 510"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path d="M-25 96C74 28 143 142 235 67S353 68 425 16" fill="none" stroke="#b8b4a8" strokeWidth="1" />
          <path d="M-20 158c88-70 159 38 262-46 70-57 124-15 178-70" fill="none" stroke="#b8b4a8" strokeWidth="1" />
          <path d="M-18 265c85-43 136 21 228-31 76-43 129-7 205-50" fill="none" stroke="#b8b4a8" strokeWidth="1" />
          <path d="M26 444C103 387 151 335 205 280 267 219 309 178 369 85" fill="none" stroke="#fff" strokeWidth="12" opacity=".75" />
          <path d="M26 444C103 387 151 335 205 280 267 219 309 178 369 85" fill="none" stroke="#d6c8ae" strokeWidth="2" />
          <path d="M17 250c85-20 139 10 200-10 70-23 119-41 177-18" fill="none" stroke="#fff" strokeWidth="9" opacity=".7" />
          <path d="M17 250c85-20 139 10 200-10 70-23 119-41 177-18" fill="none" stroke="#d6c8ae" strokeWidth="2" />
          <path d="M40 98c47 62 53 123-3 208" fill="none" stroke="#455e4c" strokeWidth="2" strokeDasharray="6 7" opacity=".45" />
        </svg>
        <p className="absolute left-[41%] top-[45%] text-center text-sm font-semibold leading-tight text-slate-700/75">
          Centre<br />Saint-Gervais
        </p>
        {pois.map((poi, index) => (
          <button
            key={poi.id}
            type="button"
            aria-label={`Afficher ${poi.name} sur la carte`}
            aria-pressed={selectedPoi?.id === poi.id}
            onClick={() => onSelectPoi(poi)}
            className={`absolute z-10 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white text-white shadow-lg transition-transform hover:scale-110 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#121212] ${markerPositions[index % markerPositions.length]} ${
              selectedPoi?.id === poi.id ? 'bg-[#121212] ring-4 ring-white/70' : 'bg-[#455e4c]'
            }`}
          >
            <MapPin className="h-4 w-4" aria-hidden="true" />
          </button>
        ))}
        {pois.length === 0 ? (
          <div className="absolute inset-0 grid place-items-center p-8 text-center">
            <p className="rounded-2xl bg-white/90 px-5 py-4 text-sm font-medium text-slate-700 shadow-sm">
              Aucun coup de cœur à afficher sur cette carte.
            </p>
          </div>
        ) : null}
      </div>

      {selectedPoi ? (
        <article
          ref={previewRef}
          data-testid="demo-map-preview"
          role="region"
          aria-label={`Aperçu de ${selectedPoi.name}`}
          aria-live="polite"
          tabIndex={-1}
          className="absolute inset-x-4 bottom-24 z-20 rounded-[26px] bg-white p-4 shadow-[0_18px_42px_rgba(15,23,42,0.22)] ring-1 ring-stone-200"
        >
          <div className="flex gap-3">
            <DemoPoiImage
              primarySrc={selectedPoi.photos[0]}
              category={selectedPoi.category}
              name={selectedPoi.name}
              decorative
              loading="lazy"
              className="h-20 w-20 rounded-2xl object-cover"
            />
            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[#a68e69]">
                {selectedPoi.category.name}
              </p>
              <h2 className="mt-1 font-serif text-xl italic text-[#121212]">
                {selectedPoi.name}
              </h2>
              <p className="mt-1 line-clamp-2 text-xs leading-4 text-slate-600">
                {selectedPoi.shortDescription}
              </p>
            </div>
            <button
              type="button"
              onClick={onDeselectPoi}
              aria-label={`Fermer l’aperçu de ${selectedPoi.name}`}
              className="self-start rounded-full p-1 text-slate-500"
            >
              <X className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
          <button
            type="button"
            onClick={() => onOpenPoi(selectedPoi)}
            className="mt-3 w-full rounded-full bg-[#121212] px-4 py-3 text-xs font-bold text-white"
          >
            Voir la fiche {selectedPoi.name}
          </button>
        </article>
      ) : null}
    </section>
  )
}
