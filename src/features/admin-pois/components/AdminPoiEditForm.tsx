"use client"

import { FormEvent, ReactNode, useState, useTransition } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import type { AdminPoiCategory, AdminPoiDetail } from '../types'

type Props = {
  poi: AdminPoiDetail
  categories: AdminPoiCategory[]
}

export function AdminPoiEditForm({ poi, categories }: Props) {
  const [message, setMessage] = useState<string | null>(null)
  const [photos, setPhotos] = useState<string[]>(poi.photos)
  const [newPhotoUrl, setNewPhotoUrl] = useState('')
  const [forceGeocode, setForceGeocode] = useState(false)
  const [selectedCategoryId, setSelectedCategoryId] = useState(poi.category.id)
  const [selectedSubcategoryId, setSelectedSubcategoryId] = useState(poi.subcategory?.id ?? '')
  const [isPending, startTransition] = useTransition()
  const selectedCategory = categories.find(category => category.id === selectedCategoryId)
  const subcategories = selectedCategory?.subcategories ?? []

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    const formData = new FormData(event.currentTarget)
    const payload = {
      name: String(formData.get('name') ?? ''),
      description: String(formData.get('description') ?? ''),
      address: String(formData.get('address') ?? ''),
      phone: nullableString(formData.get('phone')),
      website: nullableString(formData.get('website')),
      category_id: String(formData.get('category_id') ?? ''),
      subcategory_id: nullableString(formData.get('subcategory_id')),
      tags: splitLines(String(formData.get('tags') ?? '')),
      photos,
      is_active: formData.get('is_active') === 'true',
      force_geocode: forceGeocode,
    }

    startTransition(async () => {
      const response = await fetch(`/api/admin/pois/${poi.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await response.json().catch(() => null) as { error?: { message?: string } } | null
      if (!response.ok) {
        setMessage(json?.error?.message ?? 'Enregistrement impossible')
        return
      }
      setForceGeocode(false)
      setMessage('POI enregistré')
    })
  }

  return (
    <form onSubmit={submit} className="grid gap-6">
      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold text-white">Identité publique</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Nom" htmlFor="name">
            <Input id="name" name="name" defaultValue={poi.name} className="bg-white text-slate-950" />
          </Field>
          <Field label="Slug verrouillé" htmlFor="slug">
            <Input id="slug" name="slug" defaultValue={poi.slug} readOnly className="bg-slate-200 text-slate-700" />
          </Field>
          <Field label="Description" htmlFor="description" className="md:col-span-2">
            <Textarea
              id="description"
              name="description"
              defaultValue={poi.description ?? ''}
              className="min-h-32 bg-white text-slate-950"
            />
          </Field>
          <Field label="Téléphone" htmlFor="phone">
            <Input id="phone" name="phone" defaultValue={poi.phone ?? ''} className="bg-white text-slate-950" />
          </Field>
          <Field label="Site web" htmlFor="website">
            <Input id="website" name="website" defaultValue={poi.website ?? ''} className="bg-white text-slate-950" />
          </Field>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold text-white">Classification et localisation</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <Field label="Catégorie" htmlFor="category_id">
            <select
              id="category_id"
              name="category_id"
              value={selectedCategoryId}
              onChange={event => {
                setSelectedCategoryId(event.target.value)
                setSelectedSubcategoryId('')
              }}
              className="h-10 rounded-md bg-white px-3 text-sm text-slate-950"
            >
              {categories.map(category => (
                <option key={category.id} value={category.id}>{category.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Sous-catégorie" htmlFor="subcategory_id">
            <select
              id="subcategory_id"
              name="subcategory_id"
              value={selectedSubcategoryId}
              onChange={event => setSelectedSubcategoryId(event.target.value)}
              className="h-10 rounded-md bg-white px-3 text-sm text-slate-950"
            >
              <option value="">Aucune</option>
              {subcategories.map(subcategory => (
                <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Adresse" htmlFor="address" className="md:col-span-2">
            <Input id="address" name="address" defaultValue={poi.address} className="bg-white text-slate-950" />
          </Field>
          <Field label="Statut public" htmlFor="is_active">
            <select
              id="is_active"
              name="is_active"
              defaultValue={poi.status === 'active' ? 'true' : 'false'}
              className="h-10 rounded-md bg-white px-3 text-sm text-slate-950"
              disabled={poi.status === 'archived'}
            >
              <option value="true">Actif</option>
              <option value="false">Inactif</option>
            </select>
          </Field>
          <div className="rounded-xl bg-black/20 p-3 text-sm text-slate-300">
            <p>Géocodage : {poi.geocode_status} · {poi.latitude.toFixed(5)}, {poi.longitude.toFixed(5)}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              onClick={() => {
                setForceGeocode(true)
                setMessage('Recalcul coordonnées activé. Cliquez sur Enregistrer.')
              }}
            >
              Recalculer coordonnées
            </Button>
            {forceGeocode && (
              <p className="mt-2 text-xs text-amber-200">
                Le prochain enregistrement relancera Mapbox même si l'adresse est inchangée.
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold text-white">Tags du POI</h2>
        <div className="mt-4 max-w-3xl">
          <Field label="Tags du POI, un par ligne" htmlFor="tags">
            <Textarea
              id="tags"
              name="tags"
              defaultValue={poi.tags.join('\n')}
              className="min-h-32 bg-white text-slate-950"
            />
          </Field>
          <p className="mt-2 text-xs text-slate-400">
            Tags globaux de la fiche POI. Ils ne sont pas liés aux photos.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5">
        <h2 className="text-lg font-semibold text-white">Photos</h2>
        <div className="mt-4 max-w-5xl">
          <div>
            <Label htmlFor="new_photo_url" className="text-slate-200">Ajouter une photo distante</Label>
            <div className="mt-2 flex gap-2">
              <Input
                id="new_photo_url"
                value={newPhotoUrl}
                onChange={event => setNewPhotoUrl(event.target.value)}
                placeholder="https://example.com/photo.jpg"
                className="bg-white text-slate-950"
              />
              <Button type="button" variant="outline" onClick={addPhoto} disabled={photos.length >= 12}>
                Ajouter
              </Button>
            </div>
            <div className="mt-4 overflow-hidden rounded-xl border border-white/10">
              <table aria-label="Photos du POI" className="w-full text-sm">
                <caption className="sr-only">Photos du POI</caption>
                <thead className="bg-white/10 text-left text-slate-300">
                  <tr>
                    <th className="px-3 py-2 font-medium">Vignette</th>
                    <th className="px-3 py-2 font-medium">Titre</th>
                    <th className="px-3 py-2 font-medium">Hero</th>
                    <th className="px-3 py-2 text-right font-medium">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/10">
                  {photos.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-3 py-6 text-center text-slate-400">
                        Aucune photo distante.
                      </td>
                    </tr>
                  ) : (
                    photos.map((photo, index) => {
                      const title = `Photo ${index + 1}`
                      return (
                        <tr key={`${photo}-${index}`} className="bg-black/10">
                          <td className="px-3 py-2">
                            <img src={photo} alt={title} className="h-14 w-20 rounded-lg object-cover" />
                          </td>
                          <td className="px-3 py-2 font-medium text-white">{title}</td>
                          <td className="px-3 py-2">
                            {index === 0 ? (
                              <span className="rounded-full bg-amber-300 px-2 py-1 text-xs font-semibold text-slate-950">
                                Hero actuelle
                              </span>
                            ) : (
                              <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                aria-label={`Définir ${title} comme hero`}
                                onClick={() => setHeroPhoto(index)}
                              >
                                Définir comme hero
                              </Button>
                            )}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              aria-label={`Effacer ${title}`}
                              onClick={() => removePhoto(index)}
                            >
                              Effacer
                            </Button>
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-slate-400">{photos.length}/12 photos. Les URLs restent masquées dans l'interface.</p>
          </div>
        </div>
      </section>

      {poi.trail_fields_locked && (
        <section className="rounded-2xl border border-amber-300/30 bg-amber-300/10 p-5 text-sm text-amber-100">
          <h2 className="font-semibold text-white">Randonnée liée</h2>
          <p className="mt-2">Données parcours verrouillées ici. Utiliser le backoffice randonnées pour modifier tracé, distance, dénivelé ou départ.</p>
        </section>
      )}

      {poi.merchant_attached && (
        <section className="rounded-2xl border border-sky-300/30 bg-sky-300/10 p-5 text-sm text-sky-100">
          <h2 className="font-semibold text-white">Merchant lié</h2>
          <p className="mt-2">Les actions sensibles peuvent masquer ou modifier une fiche revendiquée par un Merchant.</p>
        </section>
      )}

      <div className="flex items-center gap-3">
        <Button type="submit" disabled={isPending}>Enregistrer</Button>
        {message && <p className="text-sm text-slate-300">{message}</p>}
      </div>
    </form>
  )

  function addPhoto() {
    const trimmed = newPhotoUrl.trim()
    if (!trimmed || photos.includes(trimmed) || photos.length >= 12) return
    setPhotos(current => [...current, trimmed])
    setNewPhotoUrl('')
  }

  function removePhoto(index: number) {
    setPhotos(current => current.filter((_, photoIndex) => photoIndex !== index))
  }

  function setHeroPhoto(index: number) {
    setPhotos(current => {
      const selected = current[index]
      if (!selected) return current
      return [selected, ...current.filter((_, photoIndex) => photoIndex !== index)]
    })
  }
}

function Field({
  label,
  htmlFor,
  className,
  children,
}: {
  label: string
  htmlFor: string
  className?: string
  children: ReactNode
}) {
  return (
    <div className={className}>
      <Label htmlFor={htmlFor} className="text-slate-200">{label}</Label>
      <div className="mt-2">{children}</div>
    </div>
  )
}

function nullableString(value: FormDataEntryValue | null): string | null {
  if (typeof value !== 'string') return null
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

function splitLines(value: string): string[] {
  return value
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
}
