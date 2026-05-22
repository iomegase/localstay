'use client'
import { useState } from 'react'
import dynamic from 'next/dynamic'
import { Map, List } from 'lucide-react'
import { PoiCard } from './PoiCard'
import type { PoiCard as PoiCardType } from '../types'

const FullMap = dynamic(
  () => import('./FullMap').then(m => ({ default: m.FullMap })),
  {
    ssr: false,
    loading: () => (
      <div className="h-[520px] rounded-[2.4rem] bg-stone/20 animate-pulse" data-testid="map-loading" />
    ),
  },
)

interface Props {
  pois: PoiCardType[]
  citySlug: string
  categorySlug: string
  cityCenter: { latitude: number; longitude: number }
}

export function CategoryViewWrapper({ pois, citySlug, categorySlug, cityCenter }: Props) {
  const [view, setView] = useState<'list' | 'map'>('list')

  return (
    <>
      <div className="px-4 pb-2 flex justify-end">
        <button
          onClick={() => setView(v => v === 'list' ? 'map' : 'list')}
          data-testid="map-toggle"
          className="flex items-center gap-1.5 text-xs font-semibold text-pine border border-pine/30 px-3 py-1.5 rounded-full active:scale-95 transition-transform"
        >
          {view === 'list' ? (
            <><Map className="w-3.5 h-3.5" /> Voir la carte</>
          ) : (
            <><List className="w-3.5 h-3.5" /> Voir la liste</>
          )}
        </button>
      </div>

      {view === 'list' ? (
        <div className="px-4 pt-2 space-y-2" data-testid="poi-list-view">
          {pois.map(poi => (
            <PoiCard key={poi.id} poi={poi} citySlug={citySlug} categorySlug={categorySlug} />
          ))}
          {pois.length === 0 && (
            <p className="text-sm text-charcoal/50 py-8 text-center">Aucun résultat</p>
          )}
        </div>
      ) : (
        <div className="px-4 pt-2" data-testid="map-view">
          <FullMap
            pois={pois}
            cityCenter={cityCenter}
            citySlug={citySlug}
            categorySlug={categorySlug}
          />
        </div>
      )}
    </>
  )
}
