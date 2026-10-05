'use client'

import { shortDescriptionText } from '@/features/lodging-showcase/lib/short-description'
import { useMemo, useState } from 'react'
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent, type CollisionDetection } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable'
import { SortablePhotoCard } from './SortablePhotoCard'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { MarkdownHint } from '@/shared/components/MarkdownHint'
import { Textarea } from '@/shared/components/ui/textarea'
import { AMENITY_CATALOG, AMENITY_CATALOG_CODES } from '../lib/amenity-catalog'
import { ROOM_TYPE_LABELS } from '../lib/detail-view'
import { buildPhotoCategoryOptions } from '../lib/photo-categories'
import { uploadPhotos } from '../lib/upload-photos'
import { PhotoCategorySelect } from './PhotoCategorySelect'
import { publicLodgingPath, publicLodgingsPath } from '../lib/public-paths'
import type { OwnerLodgingPublicProfileDto } from '../types'

const photoCollisionDetection: CollisionDetection = args => {
  const point = args.pointerCoordinates
  if (point) {
    const rects = [...args.droppableRects.values()]
    if (!rects.length || point.x < Math.min(...rects.map(rect => rect.left)) || point.x > Math.max(...rects.map(rect => rect.right))
      || point.y < Math.min(...rects.map(rect => rect.top)) || point.y > Math.max(...rects.map(rect => rect.bottom))) return []
  }
  return closestCenter(args)
}

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
  const [selectedAmenityCodes, setSelectedAmenityCodes] = useState<Set<string>>(
    () => new Set((props.initialProfile.amenities ?? []).filter(a => AMENITY_CATALOG_CODES.has(a.code)).map(a => a.code)),
  )
  const [otherAmenitiesText, setOtherAmenitiesText] = useState(
    (props.initialProfile.amenities ?? [])
      .filter(a => !AMENITY_CATALOG_CODES.has(a.code))
      .map(a => a.label)
      .join(', '),
  )
  const [faqRows, setFaqRows] = useState<Array<{ question: string; answer: string }>>(
    (props.initialProfile.faq ?? []).map(item => ({ question: item.question, answer: item.answer })),
  )
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [validationErrors, setValidationErrors] = useState<string[]>([])
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [uploadProgress, setUploadProgress] = useState<{ completed: number; total: number } | null>(null)
  const [uploadErrors, setUploadErrors] = useState<string[]>([])
  const [fileInputKey, setFileInputKey] = useState(0)
  const [photoAlt, setPhotoAlt] = useState('')
  const [photoCategory, setPhotoCategory] = useState('common_area')
  const [photoActionId, setPhotoActionId] = useState<string | null>(null)

  const photosBusy = uploadProgress !== null || status === 'saving' || photoActionId !== null
  const photoCategoryOptions = buildPhotoCategoryOptions(profile.bedroom_count, profile.bathroom_count)
  const selectedPhotoCategory = photoCategoryOptions.some(option => option.value === photoCategory)
    ? photoCategory
    : (photoCategoryOptions[0]?.value ?? 'other')

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
      description: profile.seo_description?.trim() || shortDescriptionText(profile.short_description),
    }),
    [profile.seo_description, profile.seo_title, profile.short_description, profile.title],
  )

  function setField<K extends keyof OwnerLodgingPublicProfileDto>(
    key: K,
    value: OwnerLodgingPublicProfileDto[K],
  ) {
    setProfile(current => ({ ...current, [key]: value }))
  }

  function toggleAmenity(code: string) {
    setSelectedAmenityCodes(prev => {
      const next = new Set(prev)
      if (next.has(code)) next.delete(code)
      else next.add(code)
      return next
    })
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
    if (photoFiles.length === 0 || photosBusy) return
    setStatus('saving')
    setMessage(null)
    setValidationErrors([])
    setUploadErrors([])
    setUploadProgress({ completed: 0, total: photoFiles.length })
    const category = photoCategoryOptions.find(option => option.value === selectedPhotoCategory)!
    const failures = await uploadPhotos({
      apiBase,
      files: photoFiles,
      alt: photoAlt,
      title: profile.title,
      category,
      onUploaded: photo => setProfile(current => ({ ...current, photos: [...current.photos, photo] })),
      onProgress: completed => setUploadProgress({ completed, total: photoFiles.length }),
    })
    const succeeded = photoFiles.length - failures.length
    setPhotoFiles(failures.map(failure => failure.file))
    setUploadErrors(failures.map(failure => `${failure.file.name} : ${failure.message}`))
    setFileInputKey(key => key + 1)
    setUploadProgress(null)
    if (failures.length === 0) setPhotoAlt('')
    setStatus(failures.length ? 'error' : 'saved')
    setMessage(`${succeeded} photo(s) ajoutée(s).${failures.length ? ` ${failures.length} fichier(s) à réessayer.` : ''}`)
  }

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function onPhotoDragEnd({ active, over }: DragEndEvent) {
    if (!over || active.id === over.id || photosBusy) return
    const from = profile.photos.findIndex(photo => photo.id === active.id)
    const to = profile.photos.findIndex(photo => photo.id === over.id)
    void movePhoto(from, to - from)
  }

  async function movePhoto(index: number, direction: number) {
    const target = index + direction
    if (photosBusy || index < 0 || target < 0 || target >= profile.photos.length || index === target) return
    const ordered = arrayMove(profile.photos, index, target)
    if (ordered.some(photo => !photo.id)) return
    const previousPhotos = profile.photos
    setProfile(current => ({ ...current, photos: ordered.map((photo, sort_order) => ({ ...photo, sort_order })) }))
    setPhotoActionId('reorder')
    setMessage(null)
    try {
      const res = await fetch(`${apiBase}/public-profile/photos`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo_ids: ordered.map(photo => photo.id) }),
      })
      if (!res.ok) throw new Error('Order failed')
      setProfile(current => ({ ...current, photos: ordered.map((photo, sort_order) => ({ ...photo, sort_order })) }))
      setStatus('saved')
      setMessage('Ordre des photos enregistré.')
    } catch {
      setProfile(current => ({ ...current, photos: previousPhotos }))
      setStatus('error')
      setMessage('Ordre non enregistré. Actualisez la galerie puis réessayez.')
    } finally {
      setPhotoActionId(null)
    }
  }

  async function changePhotoCategory(photoId: string, value: string) {
    const category = photoCategoryOptions.find(option => option.value === value)
    if (!category || photosBusy) return
    setPhotoActionId(photoId)
    setMessage(null)
    try {
      const res = await fetch(`${apiBase}/public-profile/photos/${photoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ room_type: category.roomType, room_label: category.roomLabel }),
      })
      if (!res.ok) throw new Error('Catégorie non enregistrée. Veuillez réessayer.')
      setProfile(current => ({
        ...current,
        photos: current.photos.map(photo => photo.id === photoId
          ? { ...photo, room_type: category.roomType, room_label: category.roomLabel }
          : photo),
      }))
      setStatus('saved')
      setMessage('Catégorie enregistrée.')
    } catch {
      setStatus('error')
      setMessage('Catégorie non enregistrée. Veuillez réessayer.')
    } finally {
      setPhotoActionId(null)
    }
  }

  async function deletePhoto(photoId: string) {
    if (!window.confirm('Supprimer cette photo ?')) return
    setPhotoActionId(photoId)
    try {
      const res = await fetch(`${apiBase}/public-profile/photos/${photoId}`, { method: 'DELETE' })
      if (!res.ok) {
        setMessage('Suppression impossible.')
        setStatus('error')
        return
      }
      setProfile(prev => {
        const wasCover = prev.photos.find(p => p.id === photoId)?.is_cover ?? false
        let remaining = prev.photos.filter(p => p.id !== photoId)
        // mirror server-side auto-promotion of a new cover
        if (wasCover && remaining.length > 0 && !remaining.some(p => p.is_cover)) {
          remaining = remaining.map((p, i) => (i === 0 ? { ...p, is_cover: true } : p))
        }
        return { ...prev, photos: remaining }
      })
    } catch {
      setMessage('Suppression impossible.')
      setStatus('error')
    } finally {
      setPhotoActionId(null)
    }
  }

  async function setCoverPhoto(photoId: string) {
    setPhotoActionId(photoId)
    try {
      const res = await fetch(`${apiBase}/public-profile/photos/${photoId}`, { method: 'PATCH' })
      if (!res.ok) {
        setMessage('Mise en couverture impossible.')
        setStatus('error')
        return
      }
      setProfile(prev => ({
        ...prev,
        photos: prev.photos.map(p => ({ ...p, is_cover: p.id === photoId })),
      }))
    } catch {
      setMessage('Mise en couverture impossible.')
      setStatus('error')
    } finally {
      setPhotoActionId(null)
    }
  }

  async function saveDraft() {
    setStatus('saving')
    setMessage(null)
    setMissingFields([])
    setValidationErrors([])

    const catalogAmenities = AMENITY_CATALOG.filter(item => selectedAmenityCodes.has(item.code)).map((item, index) => ({
      code: item.code,
      label: item.label,
      sort_order: index,
      availability: item.availability,
    }))

    const otherAmenities = otherAmenitiesText
      .split(',')
      .map(label => label.trim())
      .filter(Boolean)
      .map((label, index) => ({
        code: amenityCode(label) || `autre-${index + 1}`,
        label,
        sort_order: catalogAmenities.length + index,
        availability: 'included' as const,
      }))

    const seenCodes = new Set<string>()
    const amenities = [...catalogAmenities, ...otherAmenities].filter(item => {
      if (seenCodes.has(item.code)) return false
      seenCodes.add(item.code)
      return true
    })

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
          room_label: photo.room_label,
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
    setSelectedAmenityCodes(new Set(savedAmenities.filter(a => AMENITY_CATALOG_CODES.has(a.code)).map(a => a.code)))
    setOtherAmenitiesText(
      savedAmenities.filter(a => !AMENITY_CATALOG_CODES.has(a.code)).map(a => a.label).join(', '),
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
    <fieldset disabled={uploadProgress !== null || photoActionId !== null} className="min-w-0 space-y-6 pb-20">
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
                <p className="text-xs text-gray-500">Markdown accepté · sans limite de caractères.</p>
                <MarkdownHint />
              </div>
              <div className="space-y-2">
                <Label htmlFor="showcase-description">Description principale</Label>
                <Textarea
                  id="showcase-description"
                  value={profile.description}
                  onChange={event => setField('description', event.target.value)}
                  rows={8}
                />
                <MarkdownHint />
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
                <Label>Équipements (compris dans le séjour)</Label>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                  {AMENITY_CATALOG.filter(item => item.availability === 'included').map(item => (
                    <label key={item.code} className="flex items-center gap-2 text-sm text-charcoal">
                      <input
                        type="checkbox"
                        checked={selectedAmenityCodes.has(item.code)}
                        onChange={() => toggleAmenity(item.code)}
                        className="h-4 w-4 rounded border-gray-300 text-[#003A5D] focus:ring-[#003A5D]"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label>Services (sur demande)</Label>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 sm:grid-cols-3">
                  {AMENITY_CATALOG.filter(item => item.availability === 'on_request').map(item => (
                    <label key={item.code} className="flex items-center gap-2 text-sm text-charcoal">
                      <input
                        type="checkbox"
                        checked={selectedAmenityCodes.has(item.code)}
                        onChange={() => toggleAmenity(item.code)}
                        className="h-4 w-4 rounded border-gray-300 text-[#003A5D] focus:ring-[#003A5D]"
                      />
                      {item.label}
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-2 md:col-span-2">
                <Label htmlFor="other-amenities">Autres équipements</Label>
                <Textarea
                  id="other-amenities"
                  value={otherAmenitiesText}
                  onChange={event => setOtherAmenitiesText(event.target.value)}
                  rows={2}
                  placeholder="Tout ce qui n'est pas dans la liste, séparé par des virgules"
                />
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
                  <Label htmlFor="photo-alt">Texte alternatif (facultatif, commun au lot)</Label>
                  <Input id="photo-alt" disabled={photosBusy} maxLength={160} value={photoAlt} onChange={event => setPhotoAlt(event.target.value)} placeholder="Salon principal lumineux" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="photo-room-type">Type de piece</Label>
                  <select
                    id="photo-room-type"
                    disabled={photosBusy}
                    value={selectedPhotoCategory}
                    onChange={event => setPhotoCategory(event.target.value)}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm"
                  >
                    {photoCategoryOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <p className="text-sm text-gray-500">Sélectionnez plusieurs photos, puis choisissez leur pièce sur chaque vignette. Les chambres et salles de bains suivent les nombres renseignés ci-dessus.</p>
              <Label htmlFor="photo-files">Photos à importer</Label>
              <Input key={fileInputKey} id="photo-files" type="file" multiple disabled={photosBusy} accept="image/png,image/jpeg,image/jpg,image/webp,image/avif" onChange={event => { setPhotoFiles(Array.from(event.target.files ?? [])); setUploadErrors([]) }} />
              {photoFiles.length > 0 && <p className="text-sm">{photoFiles.length} fichier(s) sélectionné(s)</p>}
              <Button type="button" variant="outline" onClick={uploadPhoto} disabled={photosBusy || photoFiles.length === 0 || (photoAlt.trim().length > 0 && photoAlt.trim().length < 5)}>
                {uploadProgress ? `Envoi ${uploadProgress.completed}/${uploadProgress.total}…` : 'Importer les photos'}
              </Button>
              {uploadProgress && <p role="status" className="text-sm">{uploadProgress.completed} / {uploadProgress.total} photos traitées</p>}
              {uploadErrors.length > 0 && <ul role="alert" className="space-y-1 text-sm text-destructive">{uploadErrors.map((error, index) => <li key={index}>{error}</li>)}</ul>}
              {photoActionId === 'reorder' && <p role="status" className="text-sm">Enregistrement de l’ordre…</p>}
              {profile.photos.length > 0 && (
                <DndContext id={`lodging-photos-${props.lodgingId}`} sensors={sensors} collisionDetection={photoCollisionDetection} onDragEnd={onPhotoDragEnd}
                  accessibility={{ screenReaderInstructions: { draggable: 'Appuyez sur Espace pour saisir la photo, utilisez les flèches pour la déplacer, Espace pour déposer ou Échap pour annuler.' } }}>
                  <SortableContext items={profile.photos.map(photo => photo.id ?? photo.url)} strategy={rectSortingStrategy}>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {profile.photos.map((photo, photoIndex) => (
                    <SortablePhotoCard key={photo.id ?? photo.url} id={photo.id ?? photo.url} label={photo.alt} cover={photo.is_cover} disabled={photosBusy || !photo.id || profile.photos.length < 2}>
                      <div className="relative">
                        <div className="absolute inset-x-3 top-3 z-10 flex justify-between gap-2">
                          <Button type="button" size="sm" variant="secondary" aria-label={`Déplacer ${photo.alt} avant`} disabled={photosBusy || photoIndex === 0 || !photo.id} onClick={() => movePhoto(photoIndex, -1)}>← Avant</Button>
                          <Button type="button" size="sm" variant="secondary" aria-label={`Déplacer ${photo.alt} après`} disabled={photosBusy || photoIndex === profile.photos.length - 1 || !photo.id} onClick={() => movePhoto(photoIndex, 1)}>Après →</Button>
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img draggable={false} src={photo.url} alt={photo.alt} className="aspect-[4/3] w-full object-cover" />
                        <div className="absolute inset-x-3 bottom-3">
                          <PhotoCategorySelect
                            options={photoCategoryOptions}
                            roomType={photo.room_type}
                            roomLabel={photo.room_label}
                            label={`Catégorie de ${photo.alt}`}
                            disabled={photosBusy || !photo.id}
                            onChange={value => photo.id && changePhotoCategory(photo.id, value)}
                          />
                        </div>
                      </div>
                      <div className="space-y-1 p-3 text-xs text-gray-500">
                        <Label htmlFor={`photo-alt-${photo.id ?? photoIndex}`}>Description de la photo</Label>
                        <Input
                          id={`photo-alt-${photo.id ?? photoIndex}`}
                          value={photo.alt}
                          maxLength={160}
                          disabled={photosBusy}
                          onChange={event => setField('photos', profile.photos.map((item, index) => index === photoIndex ? { ...item, alt: event.target.value } : item))}
                        />
                        <p>{photo.room_label ?? ROOM_TYPE_LABELS[photo.room_type ?? 'other'] ?? 'Autre'}</p>
                      </div>
                      {photo.id && (
                        <div className="flex items-center justify-between gap-2 px-3 pb-3">
                          {photo.is_cover ? (
                            <span className="inline-flex items-center rounded-full bg-pink-600/15 px-2 py-0.5 text-[11px] font-semibold text-pink-600">
                              Couverture
                            </span>
                          ) : (
                            <Button
                              type="button"
                              size="sm"
                              variant="outline"
                              disabled={photosBusy}
                              onClick={() => photo.id && setCoverPhoto(photo.id)}
                            >
                              Definir couverture
                            </Button>
                          )}
                          <Button
                            type="button"
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            disabled={photosBusy}
                            onClick={() => photo.id && deletePhoto(photo.id)}
                          >
                            Supprimer
                          </Button>
                        </div>
                      )}
                    </SortablePhotoCard>
                  ))}
                </div>
                  </SortableContext>
                </DndContext>
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
              <Button type="button" className="w-full" onClick={saveDraft} disabled={photosBusy}>
                Sauvegarder le brouillon
              </Button>
              {props.mode !== 'admin' && (
                <Button type="button" variant="outline" className="w-full" onClick={submitForReview} disabled={photosBusy}>
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
                <p className="mt-2 text-green-700">
                  {profile.slug ? publicLodgingPath(profile.slug) : `${publicLodgingsPath()}/...`}
                </p>
                <p className="mt-2 text-gray-600">{seoPreview.description || 'Description SEO'}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </fieldset>
  )
}
