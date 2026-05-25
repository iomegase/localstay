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
  { value: 'official_website', label: 'Site officiel' },
  { value: 'overpass', label: 'Overpass' },
  { value: 'ign', label: 'IGN' },
  { value: 'gemini', label: 'Gemini descriptif' },
]

const RADIUS_OPTIONS = [5, 10, 15, 30] as const

export function AdminTrailsLauncher({ cities }: { cities: CityOption[] }) {
  const [cityId, setCityId] = useState(cities[0]?.id ?? '')
  const [sourceTypes, setSourceTypes] = useState<TrailSourceType[]>(['overpass'])
  const [sourceUrl, setSourceUrl] = useState('')
  const [zoneRadiusKm, setZoneRadiusKm] = useState<number>(15)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function launch() {
    if (!cityId || sourceTypes.length === 0) return
    if (sourceTypes.includes('official_website') && !sourceUrl.trim()) {
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
          zone_radius_km: zoneRadiusKm,
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
    setSourceTypes(current =>
      current.includes(source)
        ? current.filter(item => item !== source)
        : [...current, source],
    )
  }

  return (
    <Card className="border-white/10 bg-white/5 text-slate-100">
      <CardContent className="grid gap-4 p-5">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_2fr]">
          <div className="space-y-2">
            <Label htmlFor="trail-city">Ville</Label>
            <select
              id="trail-city"
              value={cityId}
              onChange={event => setCityId(event.target.value)}
              className="h-10 w-full rounded-md bg-white px-3 text-sm text-slate-950"
            >
              {cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="trail-radius">Rayon</Label>
            <select
              id="trail-radius"
              value={zoneRadiusKm}
              onChange={event => setZoneRadiusKm(Number(event.target.value))}
              className="h-10 w-full rounded-md bg-white px-3 text-sm text-slate-950"
            >
              {RADIUS_OPTIONS.map(radius => (
                <option key={radius} value={radius}>{radius} km</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="trail-source-url">URL officielle requise si source Site officiel</Label>
            <Input
              id="trail-source-url"
              value={sourceUrl}
              onChange={event => setSourceUrl(event.target.value)}
              placeholder="https://www.saintgervais.com/..."
              className="bg-white text-slate-950"
            />
          </div>
        </div>

        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">Sources serveur</legend>
          <div className="flex flex-wrap gap-3">
            {SOURCE_OPTIONS.map(source => (
              <label key={source.value} className="flex items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm">
                <input
                  type="checkbox"
                  checked={sourceTypes.includes(source.value)}
                  onChange={() => toggleSource(source.value)}
                />
                {source.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-slate-400">
            Gemini est limité à la découverte et au texte. Les coordonnées, distances et dénivelés viennent de sources géographiques fiables.
          </p>
          <Button type="button" onClick={launch} disabled={loading || !cityId || sourceTypes.length === 0}>
            Lancer acquisition rando
          </Button>
        </div>
        {error && <p className="text-sm text-red-300">{error}</p>}
      </CardContent>
    </Card>
  )
}
