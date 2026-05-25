'use client'

import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'

type CityOption = {
  id: string
  name: string
}

export function AdminManualTrailForm({ cities }: { cities: CityOption[] }) {
  const [cityId, setCityId] = useState(cities[0]?.id ?? '')
  const [title, setTitle] = useState('')
  const [difficulty, setDifficulty] = useState('medium')
  const [startLatitude, setStartLatitude] = useState('')
  const [startLongitude, setStartLongitude] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<string | null>(null)

  async function submit() {
    setLoading(true)
    setMessage(null)
    try {
      const response = await fetch('/api/admin/trails/manual', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          city_id: cityId,
          title,
          difficulty,
          start_latitude: Number(startLatitude),
          start_longitude: Number(startLongitude),
        }),
      })
      const json = await response.json()
      if (!response.ok) {
        setMessage(json.error?.message ?? 'Création impossible.')
        return
      }
      window.location.assign(`/admin/trails`)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Card className="border-white/10 bg-white/5 text-slate-100">
      <CardContent className="grid gap-4 p-5">
        <div className="space-y-2">
          <Label htmlFor="manual-trail-city">Ville</Label>
          <select
            id="manual-trail-city"
            value={cityId}
            onChange={event => setCityId(event.target.value)}
            className="h-10 w-full rounded-md bg-white px-3 text-sm text-slate-950"
          >
            {cities.map(city => <option key={city.id} value={city.id}>{city.name}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="manual-trail-title">Nom</Label>
          <Input id="manual-trail-title" value={title} onChange={event => setTitle(event.target.value)} className="bg-white text-slate-950" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="manual-trail-difficulty">Difficulté</Label>
          <select
            id="manual-trail-difficulty"
            value={difficulty}
            onChange={event => setDifficulty(event.target.value)}
            className="h-10 w-full rounded-md bg-white px-3 text-sm text-slate-950"
          >
            <option value="easy">Facile</option>
            <option value="medium">Moyen</option>
            <option value="hard">Difficile</option>
            <option value="expert">Expert</option>
            <option value="unknown">Inconnue</option>
          </select>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="manual-trail-lat">Latitude départ</Label>
            <Input id="manual-trail-lat" value={startLatitude} onChange={event => setStartLatitude(event.target.value)} className="bg-white text-slate-950" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="manual-trail-lng">Longitude départ</Label>
            <Input id="manual-trail-lng" value={startLongitude} onChange={event => setStartLongitude(event.target.value)} className="bg-white text-slate-950" />
          </div>
        </div>
        <Button type="button" disabled={loading || !cityId || !title || !startLatitude || !startLongitude} onClick={submit}>
          Créer candidat randonnée
        </Button>
        {message && <p className="text-sm text-red-300">{message}</p>}
      </CardContent>
    </Card>
  )
}
