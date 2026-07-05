'use client'

import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import type { MerchantOfferDto } from '../types'

interface Props {
  initialOffers: MerchantOfferDto[]
}

export function MerchantOffersClient({ initialOffers }: Props) {
  const [offers, setOffers] = useState(initialOffers)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [endsAt, setEndsAt] = useState('')
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle')

  async function createOffer() {
    setStatus('saving')
    const res = await fetch('/api/merchant/offers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title,
        description,
        ends_at: new Date(endsAt).toISOString(),
      }),
    })
    if (!res.ok) {
      setStatus('error')
      return
    }
    const json = await res.json() as { data: MerchantOfferDto }
    setOffers([json.data, ...offers])
    setTitle('')
    setDescription('')
    setEndsAt('')
    setStatus('idle')
  }

  async function deleteOffer(id: string) {
    const res = await fetch(`/api/merchant/offers/${id}`, { method: 'DELETE' })
    if (res.ok) setOffers(offers.filter(offer => offer.id !== id))
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[360px_minmax(0,1fr)]">
      <Card>
        <CardHeader>
          <CardTitle>Nouvelle offre</CardTitle>
          <CardDescription>Maximum 3 offres actives en même temps.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="offer-title">Titre</Label>
            <Input id="offer-title" value={title} maxLength={60} onChange={event => setTitle(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="offer-description">Description</Label>
            <Textarea
              id="offer-description"
              value={description}
              maxLength={200}
              onChange={event => setDescription(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="offer-ends-at">Date de fin</Label>
            <Input id="offer-ends-at" type="datetime-local" value={endsAt} onChange={event => setEndsAt(event.target.value)} />
          </div>
          <Button type="button" onClick={createOffer} disabled={status === 'saving' || !title || !description || !endsAt}>
            Créer l'offre
          </Button>
          {status === 'error' && <p className="text-sm text-destructive">Création impossible.</p>}
        </CardContent>
      </Card>

      <div className="space-y-3">
        {offers.length === 0 ? (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">Aucune offre.</CardContent>
          </Card>
        ) : offers.map(offer => (
          <Card key={offer.id}>
            <CardContent className="flex items-start justify-between gap-4 p-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-pink-600">
                  {offer.status === 'active' ? 'Active' : 'Expirée'}
                </p>
                <h2 className="mt-1 font-semibold text-charcoal">{offer.title}</h2>
                <p className="mt-1 text-sm text-muted-foreground">{offer.description}</p>
              </div>
              <Button type="button" variant="outline" onClick={() => deleteOffer(offer.id)}>
                Supprimer
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
