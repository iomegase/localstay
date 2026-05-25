'use client'

import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'

type Option = {
  id: string
  name: string
}

type AdminAcquisitionLauncherProps = {
  cities: Option[]
  categories: Option[]
}

export function AdminAcquisitionLauncher({ cities, categories }: AdminAcquisitionLauncherProps) {
  const [cityId, setCityId] = useState(cities[0]?.id ?? '')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [useOfficialWebsite, setUseOfficialWebsite] = useState(false)
  const [sourceUrl, setSourceUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function launch() {
    if (!cityId || !categoryId) return
    if (useOfficialWebsite && !sourceUrl.trim()) {
      setError('Renseignez une URL officielle ou désactivez la source Site officiel.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const payload = {
        city_id: cityId,
        category_id: categoryId,
        ...(useOfficialWebsite ? { source_url: sourceUrl.trim() } : {}),
      }
      const response = await fetch('/api/admin/poi-acquisition/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await response.json()
      if (!response.ok) {
        setError(json.error?.message ?? 'Acquisition impossible.')
        return
      }
      window.location.assign(`/admin/poi-acquisition/runs/${json.data.id}`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-white/10 bg-white/5 text-slate-100">
      <CardContent className="grid gap-4 p-5">
        <div className="grid gap-4 md:grid-cols-[1fr_1fr_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="acquisition-city">Ville</Label>
            <select
              id="acquisition-city"
              value={cityId}
              onChange={event => setCityId(event.target.value)}
              className="h-10 w-full rounded-md bg-white px-3 text-sm text-slate-950"
            >
              {cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="acquisition-category">Catégorie</Label>
            <select
              id="acquisition-category"
              value={categoryId}
              onChange={event => setCategoryId(event.target.value)}
              className="h-10 w-full rounded-md bg-white px-3 text-sm text-slate-950"
            >
              {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </div>
          <Button type="button" onClick={launch} disabled={loading || !cityId || !categoryId}>
            Lancer acquisition
          </Button>
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Sources serveur</legend>
          <label className="flex w-fit items-center gap-2 rounded-full border border-white/10 px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={useOfficialWebsite}
              onChange={event => setUseOfficialWebsite(event.target.checked)}
            />
            Site officiel
          </label>
          {useOfficialWebsite && (
            <div className="max-w-3xl space-y-2">
              <Label htmlFor="acquisition-source-url">URL officielle à scraper</Label>
              <Input
                id="acquisition-source-url"
                value={sourceUrl}
                onChange={event => setSourceUrl(event.target.value)}
                placeholder="https://www.saintgervais.com/..."
                className="bg-white text-slate-950"
              />
            </div>
          )}
        </fieldset>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <p className="text-xs text-slate-400">
            Gemini reste limité à la découverte et aux descriptions. Les coordonnées restent géocodées par Mapbox.
          </p>
        </div>
        {error && <p className="text-sm text-red-300">{error}</p>}
      </CardContent>
    </Card>
  )
}
