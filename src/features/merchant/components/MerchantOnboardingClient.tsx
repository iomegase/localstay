'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'

type ClaimablePoi = {
  id: string
  name: string
  address: string
  city_name: string
  category_name: string
  subcategory_name: string | null
}

type MissingPoiOption = {
  id: string
  name: string
}

type MerchantOnboardingClientProps = {
  cities?: MissingPoiOption[]
  categories?: MissingPoiOption[]
}

export function MerchantOnboardingClient({ cities = [], categories = [] }: MerchantOnboardingClientProps) {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ClaimablePoi[]>([])
  const [selected, setSelected] = useState<ClaimablePoi | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)
  const [showMissingForm, setShowMissingForm] = useState(false)
  const [missingPoi, setMissingPoi] = useState({
    name: '',
    address: '',
    phone: '',
    website: '',
    city_id: cities[0]?.id ?? '',
    category_id: categories[0]?.id ?? '',
  })

  async function search() {
    setError(null)
    setSelected(null)
    setShowMissingForm(false)
    setHasSearched(false)
    if (query.trim().length < 3) {
      setError('Saisissez au moins 3 caractères.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`/api/merchant/onboarding/search?q=${encodeURIComponent(query.trim())}`)
      const json = await response.json()
      if (!response.ok) {
        setError(json.error?.message ?? 'Recherche impossible.')
        return
      }
      setResults(json.data)
      setHasSearched(true)
    } finally {
      setLoading(false)
    }
  }

  async function claim() {
    if (!selected) return
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/merchant/onboarding/claim', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ poi_id: selected.id }),
      })
      const json = await response.json()
      if (!response.ok) {
        setError(json.error?.message ?? 'Demande impossible.')
        return
      }
      router.push('/merchant/onboarding?status=pending')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  async function submitMissingPoi() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/merchant/onboarding/missing-poi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...missingPoi,
          category_id: missingPoi.category_id || null,
          phone: missingPoi.phone || null,
          website: missingPoi.website || null,
        }),
      })
      const json = await response.json()
      if (!response.ok) {
        setError(json.error?.message ?? 'Demande impossible.')
        return
      }
      router.push('/merchant/onboarding?status=missing-poi-pending')
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex gap-3">
        <Input
          value={query}
          onChange={event => setQuery(event.target.value)}
          placeholder="Nom ou adresse de votre établissement"
        />
        <Button type="button" onClick={search} disabled={loading}>
          Rechercher
        </Button>
      </div>

      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}

      <div className="space-y-3">
        {loading && <p className="text-sm text-charcoal/60">Recherche en cours...</p>}
        {!loading && hasSearched && results.length === 0 && (
          <div className="space-y-3 rounded-lg border border-charcoal/10 bg-white px-4 py-3 text-sm text-charcoal/60">
            <p>Aucun établissement trouvé. Essayez avec un mot du nom ou de l'adresse, par exemple "Mont-Blanc".</p>
            <Button type="button" variant="outline" onClick={() => setShowMissingForm(true)}>
              Mon établissement n'apparaît pas
            </Button>
          </div>
        )}
        {results.map(poi => (
          <Card key={poi.id} className={selected?.id === poi.id ? 'border-forest' : undefined}>
            <CardContent className="flex items-center justify-between gap-4 p-4">
              <div>
                <h3 className="font-semibold text-charcoal">{poi.name}</h3>
                <p className="text-sm text-charcoal/60">{poi.address}</p>
                <p className="text-xs uppercase tracking-[0.18em] text-gold">
                  {[poi.city_name, poi.category_name, poi.subcategory_name].filter(Boolean).join(' · ')}
                </p>
              </div>
              <Button type="button" variant="outline" onClick={() => setSelected(poi)}>
                Sélectionner
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {selected && (
        <Card>
          <CardContent className="space-y-3 p-5">
            <p className="text-sm text-charcoal/70">
              Vous allez revendiquer <strong>{selected.name}</strong>. L'équipe MyStay validera la demande manuellement.
            </p>
            <Button type="button" onClick={claim} disabled={loading}>
              Revendiquer cet établissement
            </Button>
          </CardContent>
        </Card>
      )}

      {showMissingForm && (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="missing-name">Nom de l’établissement</Label>
                <Input
                  id="missing-name"
                  value={missingPoi.name}
                  onChange={event => setMissingPoi(current => ({ ...current, name: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="missing-address">Adresse complète</Label>
                <Input
                  id="missing-address"
                  value={missingPoi.address}
                  onChange={event => setMissingPoi(current => ({ ...current, address: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="missing-phone">Téléphone</Label>
                <Input
                  id="missing-phone"
                  value={missingPoi.phone}
                  onChange={event => setMissingPoi(current => ({ ...current, phone: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="missing-website">Site web</Label>
                <Input
                  id="missing-website"
                  value={missingPoi.website}
                  onChange={event => setMissingPoi(current => ({ ...current, website: event.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="missing-city">Ville</Label>
                <select
                  id="missing-city"
                  value={missingPoi.city_id}
                  onChange={event => setMissingPoi(current => ({ ...current, city_id: event.target.value }))}
                  className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  {cities.length === 0 && <option value="">Sélectionner une ville</option>}
                  {cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="missing-category">Catégorie</Label>
                <select
                  id="missing-category"
                  value={missingPoi.category_id}
                  onChange={event => setMissingPoi(current => ({ ...current, category_id: event.target.value }))}
                  className="h-10 w-full rounded-md border border-input bg-transparent px-3 text-sm"
                >
                  <option value="">Je ne sais pas</option>
                  {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </div>
            </div>
            <Button type="button" onClick={submitMissingPoi} disabled={loading || !missingPoi.name || !missingPoi.address || !missingPoi.city_id}>
              Envoyer pour revue
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
