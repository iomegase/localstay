'use client'

import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function launch() {
    if (!cityId || !categoryId) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/poi-acquisition/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city_id: cityId, category_id: categoryId }),
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
      <CardContent className="grid gap-4 p-5 md:grid-cols-[1fr_1fr_auto] md:items-end">
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
        {error && <p className="text-sm text-red-300 md:col-span-3">{error}</p>}
      </CardContent>
    </Card>
  )
}
