'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'

type ClaimablePoi = {
  id: string
  name: string
  address: string
  city_name: string
  category_name: string
  subcategory_name: string | null
}

export function MerchantOnboardingClient() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ClaimablePoi[]>([])
  const [selected, setSelected] = useState<ClaimablePoi | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasSearched, setHasSearched] = useState(false)

  async function search() {
    setError(null)
    setSelected(null)
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
          <p className="rounded-lg border border-charcoal/10 bg-white px-4 py-3 text-sm text-charcoal/60">
            Aucun établissement trouvé. Essayez avec un mot du nom ou de l'adresse, par exemple "Mont-Blanc".
          </p>
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
              Vous allez revendiquer <strong>{selected.name}</strong>. L'équipe StayLocal validera la demande manuellement.
            </p>
            <Button type="button" onClick={claim} disabled={loading}>
              Revendiquer cet établissement
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
