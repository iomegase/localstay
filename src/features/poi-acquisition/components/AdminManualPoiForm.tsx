'use client'

import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'

type CityOption = {
  id: string
  name: string
}

type SubcategoryOption = {
  id: string
  name: string
}

type CategoryOption = {
  id: string
  name: string
  subcategories: SubcategoryOption[]
}

type AdminManualPoiFormProps = {
  cities: CityOption[]
  categories: CategoryOption[]
  initialCityId?: string
}

type SourceSuggestion = {
  source_url: string
  website: string
  name: string | null
  address: string | null
  phone: string | null
  description: string | null
}

export function AdminManualPoiForm({ cities, categories, initialCityId }: AdminManualPoiFormProps) {
  const [sourceUrl, setSourceUrl] = useState('')
  const [name, setName] = useState('')
  const [address, setAddress] = useState('')
  const [cityId, setCityId] = useState(resolveInitialCityId(cities, initialCityId))
  const [categoryId, setCategoryId] = useState(categories[0]?.id ?? '')
  const [subcategoryId, setSubcategoryId] = useState('')
  const [phone, setPhone] = useState('')
  const [website, setWebsite] = useState('')
  const [description, setDescription] = useState('')
  const [loadingImport, setLoadingImport] = useState(false)
  const [loadingSubmit, setLoadingSubmit] = useState(false)
  const [message, setMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const selectedCategory = useMemo(
    () => categories.find(category => category.id === categoryId) ?? null,
    [categories, categoryId],
  )

  async function importSourceUrl() {
    if (!sourceUrl.trim()) {
      setError('Renseignez une URL officielle à importer.')
      return
    }

    setLoadingImport(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/pois/source-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source_url: sourceUrl.trim() }),
      })
      const json = await response.json() as { data?: SourceSuggestion; error?: { message?: string } }

      if (!response.ok || !json.data) {
        setError(json.error?.message ?? 'Import URL impossible.')
        return
      }

      applySuggestion(json.data)
      setMessage('URL importée. Vérifiez les champs avant création.')
    } finally {
      setLoadingImport(false)
    }
  }

  async function submit() {
    setLoadingSubmit(true)
    setError(null)
    setMessage(null)

    try {
      const response = await fetch('/api/admin/pois', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim(),
          city_id: cityId,
          category_id: categoryId,
          subcategory_id: subcategoryId || null,
          phone: phone.trim() || null,
          website: website.trim() || null,
          description: description.trim() || null,
        }),
      })
      const json = await response.json() as { data?: { id: string }; error?: { message?: string; details?: Record<string, unknown> } }

      if (!response.ok || !json.data) {
        setError(json.error?.message ?? 'Création POI impossible.')
        return
      }

      window.location.assign(`/admin/pois/${json.data.id}`)
    } finally {
      setLoadingSubmit(false)
    }
  }

  function applySuggestion(suggestion: SourceSuggestion) {
    setSourceUrl(suggestion.source_url)
    setWebsite(suggestion.website)
    if (suggestion.name) setName(suggestion.name)
    if (suggestion.address) setAddress(suggestion.address)
    if (suggestion.phone) setPhone(suggestion.phone)
    if (suggestion.description) setDescription(suggestion.description)
  }

  return (
    <div className="p-6 md:p-8">
      <div className="mb-8 rounded-[20px] border border-gray-100 bg-[#F4F7FE]/60 p-5">
        <label htmlFor="source_url" className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
          Importer depuis une URL officielle
        </label>
        <div className="mt-3 grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            id="source_url"
            value={sourceUrl}
            onChange={event => setSourceUrl(event.target.value)}
            placeholder="https://www.saintgervais.com/je-minforme/mobilite/montenvelo/"
            className={inputClassName}
          />
          <button
            type="button"
            onClick={importSourceUrl}
            disabled={loadingImport}
            className="h-[52px] rounded-xl bg-white px-6 text-[12px] font-bold uppercase tracking-widest text-[#0B1437] shadow-sm transition-all hover:bg-gray-50 disabled:opacity-50"
          >
            {loadingImport ? 'Import...' : 'Importer'}
          </button>
        </div>
      </div>

      <form className="grid gap-6 md:grid-cols-2" onSubmit={event => event.preventDefault()}>
        <Field label="Nom" htmlFor="name">
          <input id="name" name="name" value={name} onChange={event => setName(event.target.value)} placeholder="Ex: Le Refuge des Aiglons" className={inputClassName} />
        </Field>

        <Field label="Adresse" htmlFor="address">
          <input id="address" name="address" value={address} onChange={event => setAddress(event.target.value)} placeholder="Ex: 12 Rue du Mont Blanc" className={inputClassName} />
        </Field>

        <Field label="Ville" htmlFor="city_id">
          <Select id="city_id" value={cityId} onChange={setCityId}>
            {cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
          </Select>
        </Field>

        <Field label="Catégorie" htmlFor="category_id">
          <Select
            id="category_id"
            value={categoryId}
            onChange={value => {
              setCategoryId(value)
              setSubcategoryId('')
            }}
          >
            {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
          </Select>
        </Field>

        <Field label="Sous-catégorie" htmlFor="subcategory_id">
          <Select id="subcategory_id" value={subcategoryId} onChange={setSubcategoryId}>
            <option value="">Aucune</option>
            {selectedCategory?.subcategories.map(subcategory => (
              <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
            ))}
          </Select>
        </Field>

        <Field label="Téléphone" htmlFor="phone">
          <input id="phone" name="phone" value={phone} onChange={event => setPhone(event.target.value)} placeholder="Ex: 04 50 00 00 00" className={inputClassName} />
        </Field>

        <Field label="Site web" htmlFor="website">
          <input id="website" name="website" value={website} onChange={event => setWebsite(event.target.value)} placeholder="https://..." className={inputClassName} />
        </Field>

        <div className="space-y-2 md:col-span-2">
          <label htmlFor="description" className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={event => setDescription(event.target.value)}
            placeholder="Description détaillée du lieu..."
            className="min-h-[140px] w-full resize-y rounded-xl border border-gray-100 bg-gray-50/50 p-4 text-sm font-medium text-neutral-900 placeholder-gray-400 transition-all focus:border-[#0B1437] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B1437]"
          />
        </div>

        {(message || error) && (
          <div className={`md:col-span-2 rounded-xl p-4 text-[13px] font-bold ${error ? 'border border-rose-100 bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-700'}`}>
            {error ?? message}
          </div>
        )}

        <div className="flex justify-end pt-4 md:col-span-2">
          <button
            type="button"
            onClick={submit}
            disabled={loadingSubmit}
            className="h-[52px] w-full rounded-xl bg-[#0B1437] px-8 text-[13px] font-bold text-white transition-all hover:bg-gray-900 hover:shadow-md disabled:opacity-50 md:w-auto"
          >
            {loadingSubmit ? 'Création...' : 'Créer après validation'}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({ label, htmlFor, children }: { label: string; htmlFor: string; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <label htmlFor={htmlFor} className="text-[11px] font-semibold tracking-widest text-gray-400 uppercase">
        {label}
      </label>
      {children}
    </div>
  )
}

function Select({
  id,
  value,
  onChange,
  children,
}: {
  id: string
  value: string
  onChange: (value: string) => void
  children: ReactNode
}) {
  return (
    <div className="relative">
      <select
        id={id}
        value={value}
        onChange={event => onChange(event.target.value)}
        className="h-[52px] w-full appearance-none rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-semibold text-neutral-900 transition-all focus:border-[#0B1437] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B1437]"
      >
        {children}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-gray-400">
        <ChevronDownIcon />
      </div>
    </div>
  )
}

function resolveInitialCityId(cities: CityOption[], initialCityId: string | undefined): string {
  if (initialCityId && cities.some(city => city.id === initialCityId)) return initialCityId
  return cities[0]?.id ?? ''
}

function ChevronDownIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
  )
}

const inputClassName = 'h-[52px] w-full rounded-xl border border-gray-100 bg-gray-50/50 px-4 text-sm font-medium text-neutral-900 placeholder-gray-400 transition-all focus:border-[#0B1437] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#0B1437]'
