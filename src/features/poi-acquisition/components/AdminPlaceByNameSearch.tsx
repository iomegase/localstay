'use client'

import { useState } from 'react'
import { AlertTriangle, Search } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import type { AcquisitionNameSearchResult } from '../types'

type Option = {
  id: string
  name: string
}

const STATUS_LABELS: Record<NonNullable<AcquisitionNameSearchResult['business_status']>, string> = {
  OPERATIONAL: 'Ouvert',
  CLOSED_TEMPORARILY: 'Fermé temporairement',
  CLOSED_PERMANENTLY: 'Fermé définitivement',
}

const STATUS_STYLES: Record<NonNullable<AcquisitionNameSearchResult['business_status']>, string> = {
  OPERATIONAL: 'border-emerald-100 bg-emerald-50 text-emerald-600',
  CLOSED_TEMPORARILY: 'border-amber-100 bg-amber-50 text-amber-700',
  CLOSED_PERMANENTLY: 'border-rose-100 bg-rose-50 text-rose-600',
}

const selectClass = 'w-full h-[52px] appearance-none rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-neutral-900 transition-all focus:border-[#0B1437] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B1437]'

/** Spec 066 US-04 : retrouver un établissement précis que la recherche générique ignore. */
export function AdminPlaceByNameSearch({ cities, categories }: { cities: Option[]; categories: Option[] }) {
  const [cityId, setCityId] = useState(cities[0]?.id ?? '')
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<AcquisitionNameSearchResult[] | null>(null)
  const [searching, setSearching] = useState(false)
  const [addingId, setAddingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function search() {
    if (!cityId || query.trim().length < 2) return
    setSearching(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/poi-acquisition/name-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city_id: cityId, query: query.trim() }),
      })
      const json = await response.json()
      if (!response.ok) {
        setError(json.error?.message ?? 'Recherche impossible.')
        setResults(null)
        return
      }
      setResults(json.data)
    } finally {
      setSearching(false)
    }
  }

  async function add(result: AcquisitionNameSearchResult) {
    if (!cityId || !categoryId) return
    setAddingId(result.google_place_id)
    setError(null)
    try {
      const response = await fetch('/api/admin/poi-acquisition/runs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city_id: cityId, category_id: categoryId, google_place_id: result.google_place_id }),
      })
      const json = await response.json()
      if (!response.ok) {
        setError(json.error?.message ?? 'Ajout impossible.')
        return
      }
      window.location.assign(`/admin/poi-acquisition/runs/${json.data.id}`)
    } finally {
      setAddingId(null)
    }
  }

  return (
    <Card className="overflow-hidden rounded-[25px] border border-gray-50 bg-white shadow-sm">
      <CardContent className="space-y-6 p-6 md:p-8">
        <div>
          <h2 className="text-lg font-bold text-neutral-900">Ajouter un lieu précis</h2>
          <p className="mt-1 text-[13px] text-gray-500">
            Retrouvez un établissement par son nom, y compris s’il est fermé temporairement (intersaison).
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_1fr_1.4fr_auto] md:items-end">
          <div className="space-y-2">
            <Label htmlFor="name-search-city" className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Ville</Label>
            <select id="name-search-city" value={cityId} onChange={event => setCityId(event.target.value)} className={selectClass}>
              {cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name-search-category" className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Catégorie</Label>
            <select id="name-search-category" value={categoryId} onChange={event => setCategoryId(event.target.value)} className={selectClass}>
              {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="name-search-query" className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">Nom de l’établissement</Label>
            <Input
              id="name-search-query"
              value={query}
              onChange={event => setQuery(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') void search()
              }}
              placeholder="Le Galeta"
              className="h-[52px] rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-medium"
            />
          </div>
          <Button
            type="button"
            onClick={() => void search()}
            disabled={searching || query.trim().length < 2}
            className="h-[52px] rounded-xl bg-[#0B1437] px-6 text-[13px] font-bold text-white hover:bg-gray-900 disabled:opacity-50"
          >
            <Search aria-hidden="true" className="mr-2 h-4 w-4" />
            {searching ? 'Recherche…' : 'Rechercher'}
          </Button>
        </div>

        {error && (
          <div className="rounded-xl border border-rose-100 bg-rose-50 p-4 text-[13px] font-bold text-rose-600">{error}</div>
        )}

        {results && results.length === 0 && (
          <p className="text-[13px] text-gray-500">Aucun établissement trouvé.</p>
        )}

        {results && results.length > 0 && (
          <ul className="divide-y divide-gray-50 rounded-2xl border border-gray-100">
            {results.map(result => (
              <li
                key={result.google_place_id}
                aria-label={result.name}
                className="flex flex-col gap-3 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-[13px] font-bold text-neutral-900">{result.name}</p>
                  <p className="mt-0.5 text-[11px] text-gray-500">{result.address}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    {result.business_status && (
                      <span className={`inline-flex items-center rounded border px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${STATUS_STYLES[result.business_status]}`}>
                        {STATUS_LABELS[result.business_status]}
                      </span>
                    )}
                    {result.is_other_village && result.nearest_city && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700">
                        <AlertTriangle aria-hidden="true" className="h-3.5 w-3.5" />
                        Plus proche de {result.nearest_city.name}
                      </span>
                    )}
                  </div>
                </div>
                <Button
                  type="button"
                  onClick={() => void add(result)}
                  disabled={addingId !== null || !categoryId}
                  className="h-10 shrink-0 rounded-xl bg-[#F4F7FE] px-5 text-[13px] font-bold text-[#0B1437] hover:bg-[#0B1437] hover:text-white"
                >
                  {addingId === result.google_place_id ? 'Ajout…' : 'Ajouter'}
                </Button>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  )
}
