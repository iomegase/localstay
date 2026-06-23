'use client'

import { useEffect, useRef, useState } from 'react'
import { Search, X } from 'lucide-react'
import { Label } from '@/shared/components/ui/label'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import {
  countWords,
  OWNER_NOTE_MAX_WORDS,
} from '@/features/guide-customization/lib/validation'
import type { OtherCityPoiSelection } from '@/features/guide-customization/types'

const MAX_PER_CITY = 5

interface Props {
  value: OtherCityPoiSelection[]
  onChange: (next: OtherCityPoiSelection[]) => void
  excludeCitySlug: string
}

interface CityHit { id: string; name: string; slug: string }
interface CityPoi { id: string; name: string; category_slug: string; category_name: string }
interface OpenCity { slug: string; name: string; pois: CityPoi[] }

function citiesFromSelections(value: OtherCityPoiSelection[]): OpenCity[] {
  const cities = new Map<string, OpenCity>()

  value.forEach(selection => {
    const city = cities.get(selection.city_slug) ?? {
      slug: selection.city_slug,
      name: selection.city_name,
      pois: [],
    }
    city.pois.push({
      id: selection.poi_id,
      name: selection.name,
      category_slug: '',
      category_name: selection.category_name,
    })
    cities.set(selection.city_slug, city)
  })

  return [...cities.values()]
}

export function OtherCityRecommendations({ value, onChange, excludeCitySlug }: Props) {
  const [query, setQuery] = useState('')
  const [hits, setHits] = useState<CityHit[]>([])
  const [openCities, setOpenCities] = useState<OpenCity[]>(
    () => citiesFromSelections(value),
  )
  const initialised = useRef(false)

  async function loadCity(slug: string) {
    const res = await fetch(`/api/dashboard/cities/${slug}/pois`)
    if (!res.ok) return
    const json = await res.json()
    const city = json.data?.city
    const pois: CityPoi[] = json.data?.pois ?? []
    if (!city) return
    setOpenCities(prev => {
      const selectedPois = citiesFromSelections(
        value.filter(selection => selection.city_slug === slug),
      )[0]?.pois ?? []
      const mergedPois = [...pois]

      selectedPois.forEach(selectedPoi => {
        if (!mergedPois.some(poi => poi.id === selectedPoi.id)) {
          mergedPois.push(selectedPoi)
        }
      })

      const nextCity = {
        slug: city.slug,
        name: city.name,
        pois: mergedPois,
      }
      const existingIndex = prev.findIndex(openCity => openCity.slug === slug)
      if (existingIndex === -1) return [...prev, nextCity]
      return prev.map((openCity, index) => index === existingIndex ? nextCity : openCity)
    })
  }

  // Réhydrate les villes des POI déjà sélectionnés (au montage).
  useEffect(() => {
    if (initialised.current) return
    initialised.current = true
    const slugs = [...new Set(value.map(poi => poi.city_slug))]
    slugs.forEach(slug => { void loadCity(slug) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    if (query.trim().length < 3) { setHits([]); return }
    let cancelled = false
    const id = setTimeout(async () => {
      const res = await fetch(`/api/cities/search?q=${encodeURIComponent(query.trim())}`)
      if (!res.ok || cancelled) return
      const json = await res.json()
      const list: CityHit[] = (json.data ?? []).filter((c: CityHit) => c.slug !== excludeCitySlug)
      if (!cancelled) setHits(list)
    }, 250)
    return () => { cancelled = true; clearTimeout(id) }
  }, [query, excludeCitySlug])

  function addCity(hit: CityHit) {
    setQuery('')
    setHits([])
    void loadCity(hit.slug)
  }

  function countForCity(slug: string) {
    return value.filter(poi => poi.city_slug === slug).length
  }

  function togglePoi(city: OpenCity, poi: CityPoi, checked: boolean) {
    if (checked) {
      if (value.some(v => v.poi_id === poi.id)) return
      if (countForCity(city.slug) >= MAX_PER_CITY) return
      onChange([...value, {
        poi_id: poi.id,
        name: poi.name,
        category_name: poi.category_name,
        city_slug: city.slug,
        city_name: city.name,
        owner_note: null,
      }])
    } else {
      onChange(value.filter(v => v.poi_id !== poi.id))
    }
  }

  function removeCity(slug: string) {
    setOpenCities(prev => prev.filter(city => city.slug !== slug))
    onChange(value.filter(poi => poi.city_slug !== slug))
  }

  function updateOwnerNote(poiId: string, ownerNote: string) {
    onChange(value.map(selection =>
      selection.poi_id === poiId
        ? { ...selection, owner_note: ownerNote }
        : selection,
    ))
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold text-charcoal">Recommandations ailleurs</h3>
        <p className="text-xs text-gray-500">Ajoutez des lieux situés dans d&apos;autres villes (5 max par ville).</p>
      </div>

      <div className="relative">
        <Label htmlFor="other-city-search" className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Rechercher une ville
        </Label>
        <div className="relative mt-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            id="other-city-search"
            value={query}
            placeholder="Annecy, Chamonix…"
            onChange={event => setQuery(event.target.value)}
            className="pl-9"
          />
        </div>
        {hits.length > 0 && (
          <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg">
            {hits.map(hit => (
              <li key={hit.id}>
                <button
                  type="button"
                  onClick={() => addCity(hit)}
                  className="flex w-full items-center px-4 py-2 text-left text-sm text-charcoal hover:bg-gray-50"
                >
                  {hit.name}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {openCities.map(city => {
        const count = countForCity(city.slug)
        return (
          <div key={city.slug} className="space-y-2 rounded-2xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-charcoal">{city.name}</h4>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{count} / {MAX_PER_CITY}</span>
                <button type="button" aria-label={`Retirer ${city.name}`} onClick={() => removeCity(city.slug)} className="text-gray-400 hover:text-red-500">
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
            <div className="space-y-1">
              {city.pois.map(poi => {
                const selected = value.find(selection => selection.poi_id === poi.id)
                const checked = Boolean(selected)
                const disabled = !checked && count >= MAX_PER_CITY
                const wordCount = countWords(selected?.owner_note ?? '')
                const overLimit = wordCount > OWNER_NOTE_MAX_WORDS
                return (
                  <div
                    key={poi.id}
                    className={`rounded-xl border p-3 ${
                      checked
                        ? 'border-[#0B1437]/15 bg-white shadow-sm'
                        : 'border-transparent'
                    }`}
                  >
                    <label className={`flex items-center gap-3 text-sm ${disabled ? 'opacity-40' : ''}`}>
                      <input
                        type="checkbox"
                        checked={checked}
                        disabled={disabled}
                        onChange={event => togglePoi(city, poi, event.target.checked)}
                        className="h-4 w-4 accent-charcoal"
                      />
                      <span className="text-charcoal">{poi.name}</span>
                      <span className="ml-auto text-[10px] uppercase tracking-widest text-gray-400">
                        {poi.category_name}
                      </span>
                    </label>
                    {selected && (
                      <div className="mt-3 border-t border-gray-100 pt-3">
                        <Label
                          htmlFor={`other-city-owner-note-${poi.id}`}
                          className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400"
                        >
                          Votre mot pour les voyageurs - {poi.name}
                        </Label>
                        <Textarea
                          id={`other-city-owner-note-${poi.id}`}
                          value={selected.owner_note ?? ''}
                          onChange={event => updateOwnerNote(poi.id, event.target.value)}
                          placeholder="Pourquoi recommandez-vous cette adresse ?"
                          className="mt-2 min-h-[88px] resize-none"
                        />
                        <p
                          className={`mt-2 text-right text-[11px] font-medium ${
                            overLimit ? 'text-rose-500' : 'text-gray-400'
                          }`}
                        >
                          {wordCount} / {OWNER_NOTE_MAX_WORDS} mots
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
