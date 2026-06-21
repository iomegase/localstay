'use client'

import { useMemo, useState } from 'react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import type { OwnerLodgingPublicProfileDto } from '../types'

type ApiErrorPayload = {
  error?: {
    message?: string
    details?: {
      fieldErrors?: Record<string, string[]>
      missingFields?: string[]
    }
  }
}

const FIELD_LABELS: Record<string, string> = {
  title: 'Titre',
  short_description: 'Description courte',
  description: 'Description principale',
  property_type: 'Type de logement',
  max_guests: 'Voyageurs max',
  bedroom_count: 'Chambres',
  bathroom_count: 'Salles de bain',
  bed_count: 'Lits',
  surface_m2: 'Surface m2',
  public_area_label: 'Zone de localisation publique',
  external_booking_url: 'URL de reservation',
  seo_title: 'SEO title',
  seo_description: 'SEO description',
  source_description_text: 'Texte source Owner',
  photos: 'Photos',
  amenities: 'Equipements',
}

function formatFieldErrors(fieldErrors?: Record<string, string[]>) {
  return Object.entries(fieldErrors ?? {})
    .filter(([, errors]) => Array.isArray(errors) && errors.length > 0)
    .map(([field, errors]) => `${FIELD_LABELS[field] ?? field} - ${errors.join(', ')}`)
}

function amenityCode(label: string): string {
  return label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

export function LodgingShowcaseForm(props: {
  lodgingId: string
  initialProfile: OwnerLodgingPublicProfileDto
  mode?: 'owner' | 'admin'
}) {
  const apiBase = props.mode === 'admin'
    ? `/api/admin/lodgings/${props.lodgingId}`
    : `/api/dashboard/lodgings/${props.lodgingId}`
  const [profile, setProfile] = useState(props.initialProfile)
  const [sourceUrl, setSourceUrl] = useState(props.initialProfile.source_listing_url ?? '')
  const [rightsConfirmed, setRightsConfirmed] = useState(Boolean(props.initialProfile.content_rights_confirmed_at))
  const [rightsVersion, setRightsVersion] = useState(props.initialProfile.content_rights_statement_version ?? 'v1')
  const [amenitiesText, setAmenitiesText] = useState(
    (props.initialProfile.amenities ?? [])
      .filter(amenity => amenity.availability !== 'on_request')
      .map(amenity => amenity.label)
      .join(', '),
  )
  const [onRequestText, setOnRequestText] = useState(
    (props.initialProfile.amenities ?? [])
      .filter(amenity => amenity.availability === 'on_request')
      .map(amenity => amenity.label)
      .join(', '),
  )
  const [faqRows, setFaqRows] = useState<Array<{ question: string; answer: string }>>(
    (props.initialProfile.faq ?? []).map(item => ({ question: item.question, answer: item.answer })),
  )
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoAlt, setPhotoAlt] = useState('')
  const [photoRoomType, setPhotoRoomType] = useState('common_area')

  function parsedRewriteSuggestion() {
    if (!profile.rewrite_suggestion) return null

    try {
      return JSON.parse(profile.rewrite_suggestion) as {
        short_description: string
        description: string
        seo_title: string
        seo_description: string
      }
    } catch {
      return null
    }
  }

  const seoPreview = useMemo(
    () => ({
      title: profile.seo_title?.trim() || profile.title.trim(),
      description: profile.seo_description?.trim() || profile.short_description.trim(),
    }),
    [profile.seo_description, profile.seo_title, profile.short_description, profile.title],
  )

  function setField<K extends keyof OwnerLodgingPublicProfileDto>(
    key: K,
    value: OwnerLodgingPublicProfileDto[K],
  ) {
    setProfile(current => ({ ...current, [key]: value }))
  }

  async function saveSourceListing() {
    setStatus('saving')
    setMessage(null)
    setValidationErrors([])

    const res = await fetch(`/api/dashboard/lodgings/${props.lodgingId}/public-profile/source-url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source_listing_url: sourceUrl }),
    })

    const payload = await res.json().catch(() => null) as Record<string, unknown> | null
    if (!res.ok) {
      setStatus('error')
      setMessage((payload?.error as { message?: string } | undefined)?.message ?? 'URL source invalide.')
      return
    }

    setProfile(current => ({
      ...current,
      source_listing_url: String(payload?.source_listing_url ?? sourceUrl),
      source_listing_platform: (payload?.source_listing_platform as OwnerLodgingPublicProfileDto['source_listing_platform']) ?? null,
      source_listing_identifier: (payload?.source_listing_identifier as string | null | undefined) ?? null,
      source_metadata_status: (payload?.source_metadata_status as OwnerLodgingPublicProfileDto['source_metadata_status']) ?? current.source_metadata_status,
    }))
    setStatus('saved')
    setMessage('URL source enregistree.')
  }

  async function confirmRights() {
    if (!rightsConfirmed) return

    setStatus('saving')
    setMessage(null)
    setValidationErrors([])

    const res = await fetch(`/api/dashboard/lodgings/${props.lodgingId}/public-profile/rights-confirmation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ confirmed: true, statement_version: rightsVersion }),
    })

    const payload = await res.json().catch(() => null) as Record<string, unknown> | null
    if (!res.ok) {
      setStatus('error')
      setMessage((payload?.error as { message?: string } | undefined)?.message ?? 'Confirmation impossible.')
      return
    }

    setProfile(current => ({
      ...current,
      content_rights_confirmed_at: String(payload?.content_rights_confirmed_at ?? current.content_rights_confirmed_at),
      content_rights_statement_version: rightsVersion,
    }))
    setStatus('saved')
    setMessage('Confirmation des droits enregistree.')
  }

  async function uploadPhoto() {
    if (!photoFile) return

    setStatus('saving')
    setMessage(null)
    setValidationErrors([])

    const formData = new FormData()
    formData.set('file', photoFile)
    formData.set('alt', photoAlt)
    formData.set('room_type', photoRoomType)

    const res = await fetch(`${apiBase}/public-profile/photos`, {
      method: 'POST',
      body: formData,
    })

    const payload = await res.json().catch(() => null) as Record<string, unknown> | null
    if (!res.ok) {
      setStatus('error')
      setMessage((payload?.error as { message?: string } | undefined)?.message ?? 'Upload impossible.')
      return
    }

    setProfile(current => ({
      ...current,
      photos: [
        ...current.photos,
        {
          id: String(payload?.id ?? ''),
          url: String(payload?.url ?? ''),
          alt: String(payload?.alt ?? ''),
          room_type: (payload?.room_type as OwnerLodgingPublicProfileDto['photos'][number]['room_type']) ?? null,
          sort_order: Number(payload?.sort_order ?? current.photos.length),
          is_cover: Boolean(payload?.is_cover),
        },
      ],
    }))
    setPhotoFile(null)
    setPhotoAlt('')
    setPhotoRoomType('common_area')
    setStatus('saved')
    setMessage('Photo ajoutee au brouillon.')
  }

  async function saveDraft() {
    setStatus('saving')
    setMessage(null)
    setMissingFields([])
    setValidationErrors([])

    const includedAmenities = amenitiesText
      .split(',')
      .map(label => label.trim())
      .filter(Boolean)
      .map((label, index) => ({
        code: amenityCode(label) || `amenity-${index + 1}`,
        label,
        sort_order: index,
        availability: 'included' as const,
      }))

    const onRequestAmenities = onRequestText
      .split(',')
      .map(label => label.trim())
      .filter(Boolean)
      .map((label, index) => ({
        code: `req-${amenityCode(label) || `service-${index + 1}`}`,
        label,
        sort_order: includedAmenities.length + index,
        availability: 'on_request' as const,
      }))

    const amenities = [...includedAmenities, ...onRequestAmenities]

    const faq = faqRows
      .map((row, index) => ({ question: row.question.trim(), answer: row.answer.trim(), sort_order: index }))
      .filter(row => row.question.length > 0 && row.answer.length > 0)

    const res = await fetch(`${apiBase}/public-profile`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: profile.title,
        short_description: profile.short_description,
        description: profile.description,
        property_type: profile.property_type,
        max_guests: Number(profile.max_guests),
        bedroom_count: profile.bedroom_count == null ? null : Number(profile.bedroom_count),
        bathroom_count: profile.bathroom_count == null ? null : Number(profile.bathroom_count),
        bed_count: profile.bed_count == null ? null : Number(profile.bed_count),
        surface_m2: profile.surface_m2 == null ? null : Number(profile.surface_m2),
        public_area_label: profile.public_area_label?.trim() || null,
        external_booking_url: profile.external_booking_url?.trim() || null,
        public_contact_enabled: profile.public_contact_enabled,
        source_description_text: profile.source_description_text?.trim() || null,
        seo_title: profile.seo_title?.trim() || null,
        seo_description: profile.seo_description?.trim() || null,
        photos: profile.photos.map(photo => ({
          id: photo.id,
          url: photo.url,
          alt: photo.alt,
          room_type: photo.room_type,
          sort_order: photo.sort_order,
          is_cover: photo.is_cover,
        })),
        amenities,
        faq,
      }),
    })

    const payload = await res.json().catch(() => null) as ApiErrorPayload | OwnerLodgingPublicProfileDto | null
    if (!res.ok) {
      const errorPayload = payload as ApiErrorPayload | null
      const fieldErrors = formatFieldErrors(errorPayload?.error?.details?.fieldErrors)
      setValidationErrors(fieldErrors)
      setStatus('error')
      setMessage(errorPayload?.error?.message ?? 'Sauvegarde impossible.')
      return
    }

    if (!payload) {
      setStatus('error')
      setMessage('Reponse de sauvegarde invalide.')
      return
    }

    const savedProfile = payload as OwnerLodgingPublicProfileDto
    setProfile(savedProfile)
    const savedAmenities = (savedProfile.amenities as OwnerLodgingPublicProfileDto['amenities'] | undefined) ?? []
    setAmenitiesText(
      savedAmenities
        .filter(amenity => amenity.availability !== 'on_request')
        .map(amenity => amenity.label)
        .join(', '),
    )
    setOnRequestText(
      savedAmenities
        .filter(amenity => amenity.availability === 'on_request')
        .map(amenity => amenity.label)
        .join(', '),
    )
    setFaqRows(
      ((savedProfile.faq as OwnerLodgingPublicProfileDto['faq'] | undefined) ?? []).map(item => ({
        question: item.question,
        answer: item.answer,
      })),
    )
    setStatus('saved')
    setMessage('Brouillon sauvegarde.')
  }

  async function submitForReview() {
    setStatus('saving')
    setMessage(null)
    setMissingFields([])
    setValidationErrors([])

    const res = await fetch(`/api/dashboard/lodgings/${props.lodgingId}/public-profile/submit`, {
      method: 'POST',
    })

    const payload = await res.json().catch(() => null) as Record<string, unknown> | null
    if (!res.ok) {
      setStatus('error')
      const error = payload?.error as { message?: string; details?: { missingFields?: string[] } } | undefined
      setMissingFields(error?.details?.missingFields ?? [])
      setMessage(error?.message ?? 'Demande de publication impossible.')
      return
    }

    setProfile(current => ({
      ...current,
      publication_status: 'review',
    }))
    setStatus('saved')
    setMessage('Demande de publication envoyee.')
  }

  async function requestRewrite() {
    if (!profile.source_description_text || profile.source_description_text.trim().length < 80) {
      setStatus('error')
      setMessage('Le texte source doit contenir au moins 80 caracteres.')
      return
    }

    setStatus('saving')
    setMessage(null)
    setValidationErrors([])

    const res = await fetch(`/api/dashboard/lodgings/${props.lodgingId}/public-profile/rewrite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source_description_text: profile.source_description_text,
      }),
    })

    const payload = await res.json().catch(() => null) as Record<string, unknown> | null
    if (!res.ok) {
      setStatus('error')
      setMessage((payload?.error as { message?: string } | undefined)?.message ?? 'Reecriture indisponible.')
      return
    }

    setProfile(current => ({
      ...current,
      rewrite_status: 'generated',
      rewrite_suggestion: String(payload?.rewrite_suggestion ?? ''),
    }))
    setStatus('saved')
    setMessage('Suggestion MyStay generee. Verifiez-la puis appliquez-la au brouillon.')
  }

  function applyRewriteSuggestion() {
    const suggestion = parsedRewriteSuggestion()
    if (!suggestion) {
      setStatus('error')
      setMessage('Le brouillon de reecriture est invalide.')
      return
    }

    setProfile(current => ({
      ...current,
      short_description: suggestion.short_description,
      description: suggestion.description,
      seo_title: suggestion.seo_title,
      seo_description: suggestion.seo_description,
      rewrite_status: 'accepted',
    }))
    setStatus('saved')
    setMessage('Le brouillon MyStay a ete applique localement. Sauvegardez ensuite le draft.')
  }

  return (
    <div className="space-y-6 pb-20">
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-6">
          {props.mode !== 'admin' && (
            <Card>
              <CardHeader>
                <CardTitle>Annonce externe</CardTitle>
                <CardDescription>
                  MyStay ne copie pas automatiquement les photos ou textes Airbnb. Importez uniquement des contenus dont vous possedez les droits.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="source-listing-url">URL Airbnb ou Booking</Label>
                  <Input
                    id="source-listing-url"
                    value={sourceUrl}
                    onChange={event => setSourceUrl(event.target.value)}
                    placeholder="https://www.airbnb.fr/rooms/123456789"
                  />
                </div>
                <Button type="button" variant="outline" onClick={saveSourceListing}>
                  Enregistrer l URL source
                </Button>
              </CardContent>
            </Card>
          )}

          {props.mode !== 'admin' && (
            <Card>
              <CardHeader>
                <CardTitle>Droits contenus</CardTitle>
                <CardDescription>
                  La confirmation est obligatoire avant toute soumission en review si vous reutilisez des textes ou photos importes.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <label className="flex items-start gap-3 text-sm text-gray-600">
                  <input
                    type="checkbox"
                    checked={rightsConfirmed}
                    onChange={event => setRightsConfirmed(event.target.checked)}
                    className="mt-1 h-4 w-4"
                  />
                  <span>Je confirme posseder les droits de diffusion sur les textes, photos et informations importes dans MyStay.</span>
                </label>
                <div className="space-y-2">
                  <Label htmlFor="rights-version">Version de declaration</Label>
                  <Input
                    id="rights-version"
                    value={rightsVersion}
                    onChange={event => setRightsVersion(event.target.value)}
                  />
                </div>
                <Button type="button" variant="outline" onClick={confirmRights} disabled={!rightsConfirmed}>
                  Enregistrer la confirmation
                </Button>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Presentation publique</CardTitle>
              <CardDescription>
                Renseignez les contenus visibles sur la fiche publique MyStay.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="showcase-title">Titre</Label>
                <Input id="showcase-title" value={profile.title} onChange={event => setField('title', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="showcase-short-description">Description courte</Label>
                <Textarea
                  id="showcase-short-description"
                  value={profile.short_description}
                  onChange={event => setField('short_description', event.target.value)}
                  rows={3}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="showcase-description">Description principale</Label>
                <Textarea
                  id="showcase-description"
                  value={profile.description}
                  onChange={event => setField('description', event.target.value)}
                  rows={8}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="source-description-text">Texte source Owner</Label>
                <Textarea
                  id="source-description-text"
                  value={profile.source_description_text ?? ''}
                  onChange={event => setField('source_description_text', event.target.value)}
                  rows={6}
                />
              </div>
              {props.mode !== 'admin' && (
                <div className="flex flex-wrap gap-3">
                  <Button type="button" variant="outline" onClick={requestRewrite}>
                    Proposer une version MyStay
                  </Button>
                  {profile.rewrite_suggestion && (
                    <Button type="button" variant="outline" onClick={applyRewriteSuggestion}>
                      Appliquer le brouillon MyStay
                    </Button>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Caracteristiques et equipements</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="property-type">Type</Label>
                <Input id="property-type" value={profile.property_type} onChange={event => setField('property_type', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="max-guests">Voyageurs max</Label>
                <Input id="max-guests" type="number" min={1} value={String(profile.max_guests)} onChange={event => setField('max_guests', Number(event.target.value) || 1)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bedroom-count">Chambres</Label>
                <Input id="bedroom-count" type="number" min={0} value={profile.bedroom_count ?? ''} onChange={event => setField('bedroom_count', event.target.value === '' ? null : Number(event.target.value))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bathroom-count">Salles de bain</Label>
                <Input id="bathroom-count" type="number" min={0} value={profile.bathroom_count ?? ''} onChange={event => setField('bathroom_count', event.target.value === '' ? null : Number(event.target.value))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="bed-count">Lits</Label>
                <Input id="bed-count" type="number" min={0} value={profile.bed_count ?? ''} onChange={event => setField('bed_count', event.target.value === '' ? null : Number(event.target.value))} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="surface-m2">Surface m2</Label>
                <Input id="surface-m2" type="number" min={1} value={profile.surface_m2 ?? ''} onChange={event => setField('surface_m2', event.target.value === '' ? null : Number(event.target.value))} />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="public-area-label">Zone de localisation publique</Label>
                <Input id="public-area-label" value={profile.public_area_label ?? ''} onChange={event => setField('public_area_label', event.target.value)} placeholder="Annecy-le-Vieux, centre historique, hameau..." />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="amenities-text">Equipements</Label>
                <Textarea
                  id="amenities-text"
                  value={amenitiesText}
                  onChange={event => setAmenitiesText(event.target.value)}
                  rows={3}
                  placeholder="Wi-Fi, Parking, Cuisine"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="on-request-text">Services sur demande</Label>
                <Textarea
                  id="on-request-text"
                  value={onRequestText}
                  onChange={event => setOnRequestText(event.target.value)}
                  rows={2}
                  placeholder="Chef prive, Transfert aeroport, Massage..."
                />
                <p className="text-xs text-gray-500">Separez par des virgules. Affiches dans « disponible sur demande ».</p>
              </div>
              <div className="space-y-3 md:col-span-2">
                <Label>FAQ</Label>
                {faqRows.map((row, index) => (
                  <div key={index} className="space-y-2 rounded-md border border-gray-200 p-3">
                    <Input
                      value={row.question}
                      onChange={event =>
                        setFaqRows(rows => rows.map((r, i) => (i === index ? { ...r, question: event.target.value } : r)))
                      }
                      placeholder="Question"
                    />
                    <Textarea
                      value={row.answer}
                      onChange={event =>
                        setFaqRows(rows => rows.map((r, i) => (i === index ? { ...r, answer: event.target.value } : r)))
                      }
                      rows={2}
                      placeholder="Reponse"
                    />
                    <button
                      type="button"
                      onClick={() => setFaqRows(rows => rows.filter((_, i) => i !== index))}
                      className="text-xs text-red-600"
                    >
                      Supprimer
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setFaqRows(rows => [...rows, { question: '', answer: '' }])}
                  className="text-sm font-medium text-[#003A5D]"
                >
                  + Ajouter une question
                </button>
              </div>
              <label className="md:col-span-2 flex items-center gap-3 text-sm text-gray-600">
                <input
                  type="checkbox"
                  checked={profile.public_contact_enabled}
                  onChange={event => setField('public_contact_enabled', event.target.checked)}
                  className="h-4 w-4"
                />
                Activer le contact public sur la fiche logement
              </label>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Photos</CardTitle>
              <CardDescription>Televersement manuel depuis votre ordinateur uniquement.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px]">
                <div className="space-y-2">
                  <Label htmlFor="photo-alt">Texte alternatif</Label>
                  <Input id="photo-alt" value={photoAlt} onChange={event => setPhotoAlt(event.target.value)} placeholder="Salon principal lumineux" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photo-room-type">Type de piece</Label>
                  <select
                    id="photo-room-type"
                    value={photoRoomType}
                    onChange={event => setPhotoRoomType(event.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  >
                    <option value="bedroom">Chambre</option>
                    <option value="bathroom">Salle de bain</option>
                    <option value="common_area">Piece de vie</option>
                    <option value="exterior">Exterieur</option>
                    <option value="kitchen">Cuisine</option>
                    <option value="other">Autre</option>
                  </select>
                </div>
              </div>
              <Input type="file" accept="image/png,image/jpeg,image/jpg,image/webp,image/avif" onChange={event => setPhotoFile(event.target.files?.[0] ?? null)} />
              <Button type="button" variant="outline" onClick={uploadPhoto} disabled={!photoFile || photoAlt.trim().length < 5}>
                Uploader la photo
              </Button>
              {profile.photos.length > 0 && (
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {profile.photos.map(photo => (
                    <div key={photo.id ?? photo.url} className="overflow-hidden rounded-xl border border-gray-100 bg-white">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={photo.url} alt={photo.alt} className="aspect-[4/3] w-full object-cover" />
                      <div className="space-y-1 p-3 text-xs text-gray-500">
                        <p className="font-medium text-charcoal">{photo.alt}</p>
                        <p>{photo.room_type ?? 'other'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Publication</CardTitle>
              <CardDescription>Statut actuel: {profile.publication_status}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button type="button" className="w-full" onClick={saveDraft} disabled={status === 'saving'}>
                Sauvegarder le brouillon
              </Button>
              {props.mode !== 'admin' && (
                <Button type="button" variant="outline" className="w-full" onClick={submitForReview} disabled={status === 'saving'}>
                  Demander publication
                </Button>
              )}
              {props.mode !== 'admin' && missingFields.length > 0 && (
                <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">
                  <p className="font-medium">Champs a completer avant la review</p>
                  <ul className="mt-2 list-disc pl-5">
                    {missingFields.map(field => (
                      <li key={field}>{field}</li>
                    ))}
                  </ul>
                </div>
              )}
              {validationErrors.length > 0 && (
                <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                  <p className="font-medium">Erreurs a corriger dans le brouillon</p>
                  <ul className="mt-2 list-disc pl-5">
                    {validationErrors.map(error => (
                      <li key={error}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}
              {message && (
                <p className={`text-sm ${status === 'error' ? 'text-destructive' : 'text-emerald-700'}`}>
                  {message}
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Lien externe</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Label htmlFor="external-booking-url">URL de reservation</Label>
              <Input
                id="external-booking-url"
                value={profile.external_booking_url ?? ''}
                onChange={event => setField('external_booking_url', event.target.value)}
                placeholder="https://www.airbnb.fr/rooms/123456789"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Apercu SEO</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="seo-title">SEO title</Label>
                <Input id="seo-title" value={profile.seo_title ?? ''} onChange={event => setField('seo_title', event.target.value)} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seo-description">SEO description</Label>
                <Textarea id="seo-description" value={profile.seo_description ?? ''} onChange={event => setField('seo_description', event.target.value)} rows={4} />
              </div>
              <div className="rounded-xl border border-gray-100 bg-stone-50 p-4 text-sm">
                <p className="font-medium text-[#1a0dab]">{seoPreview.title || 'Titre SEO'}</p>
                <p className="mt-2 text-green-700">/guide/.../logements/...</p>
                <p className="mt-2 text-gray-600">{seoPreview.description || 'Description SEO'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
