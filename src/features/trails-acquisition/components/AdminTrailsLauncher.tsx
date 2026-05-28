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
          // En mode Site officiel, on n'envoie pas de rayon (Overpass/Camptocamp sont désactivés).
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

  function toggleSource(source: TrailSourceType) {
    setSourceTypes(current => {
      const isOn = current.includes(source)
      // Activer Site officiel → désactiver automatiquement Overpass + Camptocamp
      if (!isOn && source === 'official_website') {
        return [...current.filter(s => !RADIUS_BOUND_SOURCES.includes(s)), source]
      }
      // Tentative d'activer Overpass/Camptocamp alors que Site officiel est on → no-op (checkbox désactivée côté UI mais sécurité)
      if (!isOn && RADIUS_BOUND_SOURCES.includes(source) && current.includes('official_website')) {
        return current
      }
      return isOn ? current.filter(item => item !== source) : [...current, source]
    })
  }

  return (
    <Card className="overflow-hidden border-0 bg-white shadow-xl ring-1 ring-slate-100">
      {/* Barre de décoration unie en haut de la carte */}
      <div className="h-1.5 w-full bg-violet-600" />

      <CardContent className="grid gap-8 p-6 md:p-8">
        
        {/* Ligne 1 : Paramètres principaux */}
        <div className={`grid gap-6 ${officialOnly ? 'md:grid-cols-1' : 'md:grid-cols-2'} md:items-end`}>

          {/* Select : Ville */}
          <div className="space-y-1">
            <Label htmlFor="trail-city" className="font-semibold text-slate-700">Ville cible</Label>
            <div className="relative">
              <select
                id="trail-city"
                value={cityId}
                onChange={event => setCityId(event.target.value)}
                className="peer w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent py-2 pl-0 pr-8 text-sm text-slate-900 focus:outline-none focus:ring-0"
              >
                {cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
              </select>
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-violet-600 transition-all duration-300 ease-out peer-focus:w-full" />
            </div>
          </div>

          {/* Select : Rayon — masqué en mode Site officiel */}
          {!officialOnly && (
            <div className="space-y-1">
              <Label htmlFor="trail-radius" className="font-semibold text-slate-700">Rayon d'action</Label>
              <div className="relative">
                <select
                  id="trail-radius"
                  value={zoneRadiusKm}
                  onChange={event => setZoneRadiusKm(Number(event.target.value))}
                  className="peer w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent py-2 pl-0 pr-8 text-sm text-slate-900 focus:outline-none focus:ring-0"
                >
                  {RADIUS_OPTIONS.map(radius => (
                    <option key={radius} value={radius}>{radius} km</option>
                  ))}
                </select>
                <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-violet-600 transition-all duration-300 ease-out peer-focus:w-full" />
              </div>
            </div>
          )}
        </div>

        {/* Ligne 2 : Configuration des sources */}
        <fieldset className="space-y-5 rounded-xl border border-slate-100 bg-slate-50/80 p-5">
          <legend className="px-2 text-sm font-bold uppercase tracking-wide text-slate-800">
            Sources serveur à utiliser
          </legend>
          
          <div className="flex flex-wrap gap-3">
            {SOURCE_OPTIONS.map(source => {
              const isChecked = sourceTypes.includes(source.value)
              const isDisabled = officialOnly && RADIUS_BOUND_SOURCES.includes(source.value)
              return (
                <label
                  key={source.value}
                  title={isDisabled ? 'Désactivé : mode Site officiel actif' : undefined}
                  className={`flex select-none items-center gap-2.5 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    isDisabled
                      ? 'cursor-not-allowed border-slate-100 bg-slate-50 text-slate-400 opacity-60'
                      : isChecked
                        ? 'cursor-pointer border-violet-500 bg-violet-50 text-violet-900 shadow-sm'
                        : 'cursor-pointer border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked && !isDisabled}
                    disabled={isDisabled}
                    onChange={() => toggleSource(source.value)}
                    className="h-4 w-4 accent-violet-600 disabled:accent-slate-300"
                  />
                  {source.label}
                </label>
              )
            })}
          </div>

          {officialOnly && (
            <p className="rounded-md border border-violet-200/60 bg-violet-50/60 px-3 py-2 text-xs text-violet-800">
              Mode <strong>Site officiel</strong> actif : Overpass et Camptocamp désactivés, rayon ignoré. Le scraping ne porte que sur l'URL fournie ci-dessous. IGN et Gemini restent activables pour compléter élévation / description.
            </p>
          )}

          {sourceTypes.includes('official_website') && (
            <div className="animate-in fade-in slide-in-from-top-2 space-y-1 pt-2">
              <Label htmlFor="trail-source-url" className="font-semibold text-slate-700">URL officielle à scraper</Label>
              <div className="relative">
                <Input
                  id="trail-source-url"
                  value={sourceUrl}
                  onChange={event => setSourceUrl(event.target.value)}
                  placeholder="https://www.saintgervais.com/..."
                  className="peer h-10 w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-0 shadow-none focus-visible:outline-none focus-visible:ring-0"
                />
                <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-violet-600 transition-all duration-300 ease-out peer-focus-visible:w-full peer-focus:w-full" />
              </div>
            </div>
          )}
        </fieldset>

        {/* Ligne 3 : Informations & Bouton d'action */}
        <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
          
          {/* <div className="flex flex-1 items-start gap-3 rounded-lg border border-blue-100 bg-blue-50/50 p-4 text-blue-800 md:max-w-[70%]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-5 w-5 shrink-0 text-blue-500">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
            </svg>
            <p className="text-sm leading-relaxed">
              <strong className="font-semibold">Note technique :</strong> Gemini est limité à la découverte et au texte. Les coordonnées, distances et dénivelés viennent de sources géographiques fiables.
            </p>
          </div> */}

          <Button 
            type="button" 
            onClick={launch} 
            disabled={loading || !cityId || sourceTypes.length === 0}
            className="h-12 shrink-0 bg-violet-600 px-8 font-semibold text-white shadow-md transition-all hover:bg-violet-700 hover:shadow-lg disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? 'Lancer...' : 'Lancer acquisition rando'}
          </Button>
        </div>

        {/* Ligne 4 : Affichage de l'erreur */}
        {error && (
          <div className="animate-in fade-in rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">
            {error}
          </div>
        )}
      </CardContent>
    </Card>
  )
}