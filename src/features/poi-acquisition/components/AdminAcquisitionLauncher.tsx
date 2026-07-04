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
    <Card className="overflow-hidden rounded-[25px] border border-gray-50 bg-white shadow-sm">
      <CardContent className="p-6 md:p-8 space-y-8">
        
        {/* Section principale : Sélections et Bouton d'action */}
        <div className="grid gap-6 md:grid-cols-[1fr_1fr_auto] md:items-end">
          
          {/* Select : Ville */}
          <div className="space-y-2">
            <Label htmlFor="acquisition-city" className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
              Ville cible
            </Label>
            <div className="relative">
              <select
                id="acquisition-city"
                value={cityId}
                onChange={event => setCityId(event.target.value)}
                className="w-full h-[52px] appearance-none rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-neutral-900 transition-all focus:border-[#0B1437] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B1437]"
              >
                {cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
              </select>
              {/* Icône Select personnalisée pour masquer celle par défaut */}
              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>
          
          {/* Select : Catégorie */}
          <div className="space-y-2">
            <Label htmlFor="acquisition-category" className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
              Catégorie de POI
            </Label>
            <div className="relative">
              <select
                id="acquisition-category"
                value={categoryId}
                onChange={event => setCategoryId(event.target.value)}
                className="w-full h-[52px] appearance-none rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-neutral-900 transition-all focus:border-[#0B1437] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B1437]"
              >
                {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
              </div>
            </div>
          </div>

          <Button 
            type="button" 
            onClick={launch} 
            disabled={loading || !cityId || !categoryId}
            className="h-[52px] w-full rounded-xl bg-[#0B1437] px-8 text-[13px] font-bold text-white transition-all hover:bg-gray-900 hover:shadow-md disabled:opacity-50 disabled:hover:shadow-none md:w-auto"
          >
            {loading ? 'Lancement...' : 'Lancer l\'acquisition'}
          </Button>
        </div>

        {/* Section secondaire : Configuration des sources */}
        <div className="rounded-[20px] border border-gray-100 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
            Configuration des sources
          </h3>
          
          <div className="space-y-5">
            <label 
              className={`flex w-fit cursor-pointer select-none items-center gap-3 rounded-xl border px-5 py-3 text-[13px] font-bold transition-all ${
                useOfficialWebsite 
                  ? 'border-[#0B1437] bg-[#F4F7FE] text-[#0B1437]' 
                  : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
              }`}
            >
              <input
                type="checkbox"
                checked={useOfficialWebsite}
                onChange={event => setUseOfficialWebsite(event.target.checked)}
                className="h-4 w-4 rounded-[4px] border-gray-300 text-[#0B1437] focus:ring-[#0B1437]"
                style={{ accentColor: '#0B1437' }}
              />
              Scanner le site officiel
            </label>

            {useOfficialWebsite && (
              <div className="animate-in fade-in slide-in-from-top-2 max-w-3xl space-y-2">
                <Label htmlFor="acquisition-source-url" className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
                  URL officielle à scraper
                </Label>
                <Input
                  id="acquisition-source-url"
                  value={sourceUrl}
                  onChange={event => setSourceUrl(event.target.value)}
                  placeholder="https://www.saintgervais.com/..."
                  className="h-[52px] w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-medium transition-all focus-visible:border-[#0B1437] focus-visible:bg-white focus-visible:ring-1 focus-visible:ring-[#0B1437]"
                />
              </div>
            )}
          </div>
        </div>

        {/* Section Infos & Erreurs */}
        <div className="flex flex-col gap-4">
          <div className="flex items-start gap-3 rounded-xl bg-[#F4F7FE]/80 p-4 text-[#0B1437]">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="mt-0.5 h-5 w-5 shrink-0 opacity-70">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
            </svg>
            <p className="text-[13px] leading-relaxed">
              <strong className="font-bold">Note technique :</strong> Google Places propose les candidats, Gemini rédige uniquement les descriptions à partir de données vérifiées, et les coordonnées sont géocodées par <span className="font-bold">Mapbox</span>.
            </p>
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
