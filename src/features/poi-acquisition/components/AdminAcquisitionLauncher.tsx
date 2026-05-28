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

  // Règle métier non modifiée
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
    <Card className="overflow-hidden border-0 bg-white shadow-xl ring-1 ring-slate-100">
      {/* Barre de décoration unie en haut de la carte */}
      <div className="h-1.5 w-full bg-violet-600" />
      
      <CardContent className="grid gap-8 p-6 md:p-8">
        {/* Section principale : Sélections et Bouton d'action */}
        <div className="grid gap-6 md:grid-cols-[1fr_1fr_auto] md:items-end">
          
          {/* Select : Ville */}
          <div className="space-y-1">
            <Label htmlFor="acquisition-city" className="font-semibold text-slate-700">
              Ville cible
            </Label>
            <div className="relative">
              <select
                id="acquisition-city"
                value={cityId}
                onChange={event => setCityId(event.target.value)}
                className="peer w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent py-2 pl-0 pr-8 text-sm text-slate-900 focus:outline-none focus:ring-0"
              >
                {cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
              </select>
              {/* Animation de soulignement au focus */}
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-violet-600 transition-all duration-300 ease-out peer-focus:w-full" />
            </div>
          </div>
          
          {/* Select : Catégorie */}
          <div className="space-y-1">
            <Label htmlFor="acquisition-category" className="font-semibold text-slate-700">
              Catégorie de POI
            </Label>
            <div className="relative">
              <select
                id="acquisition-category"
                value={categoryId}
                onChange={event => setCategoryId(event.target.value)}
                className="peer w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent py-2 pl-0 pr-8 text-sm text-slate-900 focus:outline-none focus:ring-0"
              >
                {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
              {/* Animation de soulignement au focus */}
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-violet-600 transition-all duration-300 ease-out peer-focus:w-full" />
            </div>
          </div>

          <Button 
            type="button" 
            onClick={launch} 
            disabled={loading || !cityId || !categoryId}
            className="h-11 bg-violet-600 px-6 font-semibold text-white shadow-md transition-all hover:bg-violet-700 hover:shadow-lg disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? 'Lancement...' : 'Lancer l\'acquisition'}
          </Button>
        </div>

        {/* Section secondaire : Configuration des sources */}
        <fieldset className="space-y-6 rounded-xl border border-slate-100 bg-slate-50/80 p-5">
          <legend className="px-2 text-sm font-bold uppercase tracking-wide text-slate-800">
            Configuration des sources
          </legend>
          
          <label 
            className={`flex w-fit cursor-pointer select-none items-center gap-3 rounded-full border px-4 py-2.5 text-sm font-medium transition-colors ${
              useOfficialWebsite 
                ? 'border-violet-500 bg-violet-50 text-violet-900 shadow-sm' 
                : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-100'
            }`}
          >
            <input
              type="checkbox"
              checked={useOfficialWebsite}
              onChange={event => setUseOfficialWebsite(event.target.checked)}
              className="h-4 w-4 accent-violet-600"
            />
            Scanner le site officiel
          </label>

          {useOfficialWebsite && (
            <div className="animate-in fade-in slide-in-from-top-2 max-w-3xl space-y-1 pt-2">
              <Label htmlFor="acquisition-source-url" className="text-slate-700">
                URL officielle à scraper
              </Label>
              <div className="relative">
                <Input
                  id="acquisition-source-url"
                  value={sourceUrl}
                  onChange={event => setSourceUrl(event.target.value)}
                  placeholder="https://www.saintgervais.com/..."
                  className="peer h-10 w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-0 shadow-none focus-visible:outline-none focus-visible:ring-0"
                />
                {/* Animation de soulignement au focus */}
                <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-violet-600 transition-all duration-300 ease-out peer-focus-visible:w-full peer-focus:w-full" />
              </div>
            </div>
          )}
        </fieldset>

        {/* Section Infos & Erreurs */}
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-lg border border-blue-100 bg-blue-50/50 p-4 text-blue-800">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-5 w-5 shrink-0 text-blue-500">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
            </svg>
            <p className="text-sm leading-relaxed">
              <strong className="font-semibold">Note technique :</strong> Gemini reste limité à la découverte et aux descriptions. Les coordonnées géographiques seront automatiquement géocodées par <span className="font-medium">Mapbox</span>.
            </p>
          </div>

          {error && (
            <div className="animate-in fade-in rounded-lg border border-red-200 bg-red-50 p-3 text-sm font-medium text-red-600">
              {error}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}