'use client'

import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import type { TrailSourceType } from '../types'

type CityOption = {
  id: string
  name: string
}

const SOURCE_OPTIONS: Array<{ value: TrailSourceType; label: string }> = [
  { value: 'camptocamp', label: 'Camptocamp' },
  { value: 'official_website', label: 'Site officiel' },
  { value: 'overpass', label: 'Overpass' },
  { value: 'ign', label: 'IGN (élévation)' },
  { value: 'gemini', label: 'Gemini descriptif' },
]

const RADIUS_OPTIONS = [5, 10, 15, 30] as const

const RADIUS_BOUND_SOURCES: TrailSourceType[] = ['overpass', 'camptocamp']

export function AdminTrailsLauncher({ cities }: { cities: CityOption[] }) {
  const [cityId, setCityId] = useState(cities[0]?.id ?? '')
  const [sourceTypes, setSourceTypes] = useState<TrailSourceType[]>(['overpass'])
  const [sourceUrl, setSourceUrl] = useState('')
  const [zoneRadiusKm, setZoneRadiusKm] = useState<number>(15)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const officialOnly = sourceTypes.includes('official_website')

  // Règle métier non modifiée
  async function launch() {
    if (!cityId || sourceTypes.length === 0) return
    if (officialOnly && !sourceUrl.trim()) {
      setError('Renseignez une URL officielle ou désactivez la source Site officiel.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/trails/import-runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city_id: cityId,
          source_types: sourceTypes,
          source_url: sourceUrl.trim() || null,
          zone_radius_km: officialOnly ? null : zoneRadiusKm,
        }),
      })
      const json = await response.json()
      if (!response.ok) {
        setError(json.error?.message ?? 'Acquisition randonnée impossible.')
        return
      }
      window.location.assign(`/admin/trails/runs/${json.data.id}`)
    } finally {
      setLoading(false)
    }
  }

  // Règle métier non modifiée
  function toggleSource(source: TrailSourceType) {
    setSourceTypes(current => {
      const isOn = current.includes(source)
      if (!isOn && source === 'official_website') {
        return [...current.filter(s => !RADIUS_BOUND_SOURCES.includes(s)), source]
      }
      if (!isOn && RADIUS_BOUND_SOURCES.includes(source) && current.includes('official_website')) {
        return current
      }
      return isOn ? current.filter(item => item !== source) : [...current, source]
    })
  }

  return (
    <Card className="overflow-hidden rounded-[25px] border border-gray-50 bg-white shadow-sm">
      <CardContent className="p-6 md:p-8 space-y-8">
        
        {/* Ligne 1 : Paramètres principaux */}
        <div className={`grid gap-6 ${officialOnly ? 'md:grid-cols-1' : 'md:grid-cols-2'}`}>

          {/* Select : Ville */}
          <div className="space-y-2">
            <Label htmlFor="trail-city" className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
              Ville cible
            </Label>
            <div className="relative">
              <select
                id="trail-city"
                value={cityId}
                onChange={event => setCityId(event.target.value)}
                className="w-full h-[52px] appearance-none rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-neutral-900 transition-all focus:border-[#0B1437] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B1437]"
              >
                {cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
                <ChevronDownIcon />
              </div>
            </div>
          </div>

          {/* Select : Rayon — masqué en mode Site officiel */}
          {!officialOnly && (
            <div className="space-y-2">
              <Label htmlFor="trail-radius" className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
                Rayon d'action
              </Label>
              <div className="relative">
                <select
                  id="trail-radius"
                  value={zoneRadiusKm}
                  onChange={event => setZoneRadiusKm(Number(event.target.value))}
                  className="w-full h-[52px] appearance-none rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-neutral-900 transition-all focus:border-[#0B1437] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B1437]"
                >
                  {RADIUS_OPTIONS.map(radius => (
                    <option key={radius} value={radius}>{radius} km</option>
                  ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
                  <ChevronDownIcon />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Ligne 2 : Configuration des sources */}
        <div className="rounded-[20px] border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
            Sources serveur à utiliser
          </h3>
          
          <div className="flex flex-wrap gap-3">
            {SOURCE_OPTIONS.map(source => {
              const isChecked = sourceTypes.includes(source.value)
              const isDisabled = officialOnly && RADIUS_BOUND_SOURCES.includes(source.value)
              
              return (
                <label
                  key={source.value}
                  title={isDisabled ? 'Désactivé : mode Site officiel actif' : undefined}
                  className={`flex select-none items-center gap-2.5 rounded-xl border px-4 py-2.5 text-[12px] font-bold transition-all ${
                    isDisabled
                      ? 'cursor-not-allowed border-gray-100 bg-gray-50 text-gray-400 opacity-60'
                      : isChecked
                        ? 'cursor-pointer border-[#0B1437] bg-[#F4F7FE] text-[#0B1437]'
                        : 'cursor-pointer border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked && !isDisabled}
                    disabled={isDisabled}
                    onChange={() => toggleSource(source.value)}
                    className="h-4 w-4 rounded-[4px] border-gray-300 text-[#0B1437] focus:ring-[#0B1437] disabled:opacity-50"
                    style={{ accentColor: '#0B1437' }}
                  />
                  {source.label}
                </label>
              )
            })}
          </div>

          {officialOnly && (
            <div className="mt-5 rounded-xl bg-[#F4F7FE]/80 p-4 text-[12px] leading-relaxed text-[#0B1437]">
              Mode <strong className="font-bold">Site officiel</strong> actif : Overpass et Camptocamp désactivés, rayon ignoré. Le scraping ne porte que sur l'URL fournie ci-dessous. IGN et Gemini restent activables pour compléter élévation / description.
            </div>
          )}

          {sourceTypes.includes('official_website') && (
            <div className="animate-in fade-in slide-in-from-top-2 mt-5 space-y-2">
              <Label htmlFor="trail-source-url" className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
                URL officielle à scraper
              </Label>
              <Input
                id="trail-source-url"
                value={sourceUrl}
                onChange={event => setSourceUrl(event.target.value)}
                placeholder="https://www.saintgervais.com/..."
                className="h-[52px] w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-medium transition-all focus-visible:border-[#0B1437] focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-[#0B1437]"
              />
            </div>
          )}
        </div>

        {/* Ligne 3 : Bouton d'action et Erreur */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-end">
            <Button 
              type="button" 
              onClick={launch} 
              disabled={loading || !cityId || sourceTypes.length === 0}
              className="h-[52px] w-full rounded-xl bg-[#0B1437] px-8 text-[13px] font-bold text-white transition-all hover:bg-gray-900 hover:shadow-md disabled:opacity-50 disabled:hover:shadow-none md:w-auto"
            >
              {loading ? 'Lancement...' : 'Lancer l\'acquisition'}
            </Button>
          </div>

          {error && (
            <div className="animate-in fade-in rounded-xl border border-rose-100 bg-rose-50 p-4 text-[13px] font-bold text-rose-600">
              {error}
            </div>
          )}
        </div>
        
      </CardContent>
    </Card>
  )
}

function ChevronDownIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
  )
}