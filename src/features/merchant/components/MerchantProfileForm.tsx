'use client'

import { useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import type { MerchantDashboardProfileDto } from '../types'

interface Props {
  profile: MerchantDashboardProfileDto
}

export function MerchantProfileForm({ profile }: Props) {
  const [name, setName] = useState(profile.poi.name)
  const [description, setDescription] = useState(profile.poi.description ?? '')
  const [phone, setPhone] = useState(profile.poi.phone ?? '')
  const [website, setWebsite] = useState(profile.poi.website ?? '')
  const [photos, setPhotos] = useState(profile.poi.photos)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')

  async function saveProfile() {
    setStatus('saving')
    const res = await fetch('/api/merchant/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        description: description.trim() === '' ? null : description,
        phone: phone.trim() === '' ? null : phone,
        website: website.trim() === '' ? null : website,
      }),
    })
    setStatus(res.ok ? 'saved' : 'error')
  }

  async function uploadPhoto(file: File | null) {
    if (!file) return
    setStatus('saving')
    const formData = new FormData()
    formData.set('file', file)
    const res = await fetch('/api/merchant/photos', { method: 'POST', body: formData })
    if (!res.ok) {
      setStatus('error')
      return
    }
    const json = await res.json() as { data: { photos: string[] } }
    setPhotos(json.data.photos)
    setStatus('saved')
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
      <Card>
        <CardHeader>
          <CardTitle>Ma fiche publique</CardTitle>
          <CardDescription>Ces informations sont visibles immédiatement dans le guide.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="merchant-name">Nom</Label>
            <Input id="merchant-name" value={name} onChange={event => setName(event.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="merchant-description">Description</Label>
            <Textarea
              id="merchant-description"
              value={description}
              onChange={event => setDescription(event.target.value)}
              maxLength={1000}
            />
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="merchant-phone">Téléphone</Label>
              <Input id="merchant-phone" value={phone} onChange={event => setPhone(event.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="merchant-website">Site web</Label>
              <Input id="merchant-website" value={website} onChange={event => setWebsite(event.target.value)} />
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="button" onClick={saveProfile} disabled={status === 'saving'}>
              {status === 'saving' ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
            <Button type="button" variant="outline" asChild>
              <a href={profile.poi.public_url} target="_blank" rel="noreferrer">Voir ma fiche publique</a>
            </Button>
            {status === 'saved' && <span className="text-sm text-forest">Sauvegardé</span>}
            {status === 'error' && <span className="text-sm text-destructive">Erreur de sauvegarde</span>}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Photos</CardTitle>
          <CardDescription>{photos.length}/5 photos publiques.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            disabled={photos.length >= 5 || status === 'saving'}
            onChange={event => uploadPhoto(event.target.files?.[0] ?? null)}
          />
          <div className="grid grid-cols-2 gap-2">
            {photos.map(photo => (
              <img key={photo} src={photo} alt="" className="aspect-square rounded-xl object-cover" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
