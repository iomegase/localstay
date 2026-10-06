'use client'

import { shortDescriptionText } from '@/features/lodging-showcase/lib/short-description'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent, type CollisionDetection } from '@dnd-kit/core'
import { SortableContext, rectSortingStrategy, sortableKeyboardCoordinates, arrayMove } from '@dnd-kit/sortable'
import { BookOpen, Plus, Sparkles, Trash2 } from 'lucide-react'
import { SortablePhotoCard } from './SortablePhotoCard'
import { Button } from '@/shared/components/ui/button'
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
import {
  lengthInRange,
  missingFieldLabel,
  publicationStatusLabel,
  SEO_DESCRIPTION_RANGE,
  SEO_TITLE_RANGE,
  SHOWCASE_SECTIONS,
  applyAltToPhotos,
  showcaseErrorState,
  showcaseFieldErrors,
  showcaseDraftSnapshot,
  type ShowcaseSectionId,
} from '../lib/showcase-form'
import type { OwnerLodgingPublicProfileDto } from '../types'
import { fillFaqTemplate, missingLibraryItems, needsAdaptation } from '../lib/faq-library'
import { ACCEPTED_IMAGE_INPUT } from '@/shared/lib/image-upload'
import { valueAtPath, visibleServerErrors } from '@/features/guide-customization/lib/form-errors'

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
  external_booking_url: 'Lien de réservation',
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
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)
}

/** Spec 079 AC-03-01 : section numérotée (même présentation que la page Guide). */
function Section({ id, children }: { id: ShowcaseSectionId; children: ReactNode }) {
  const index = SHOWCASE_SECTIONS.findIndex(section => section.id === id)
  const section = SHOWCASE_SECTIONS[index]!
  return (
    <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-6 space-y-4">
      <header className="flex items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0B1437] text-sm font-bold text-white">{index + 1}</span>
        <div>
          <h2 id={`${id}-title`} className="text-lg font-bold text-neutral-900">{section.title}</h2>
          <p className="text-xs text-gray-500">{section.description}</p>
        </div>
      </header>
      {children}
    </section>
  )
}

function Panel({ title, description, children }: { title?: string; description?: string; children: ReactNode }) {
  return (
    <div className="rounded-[20px] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
      {title ? (
        <div className="mb-4">
          <h3 className="text-sm font-bold text-neutral-900">{title}</h3>
          {description ? <p className="mt-0.5 text-xs text-gray-500">{description}</p> : null}
        </div>
      ) : null}
      {children}
    </div>
  )
}

/** Spec 083 : message affiché en rouge sous un champ. */
function FieldError({ message }: { message?: string }) {
  return message ? <p className="text-xs font-semibold text-rose-600">{message}</p> : null
}

function Counter({ value, range, testId }: { value: string; range: { min: number; max: number }; testId: string }) {
  const ok = lengthInRange(value, range)
  return (
    <span data-testid={testId} className={`text-[11px] font-semibold tabular-nums ${ok ? 'text-gray-400' : 'text-amber-600'}`}>
      {value.trim().length} · {range.min}–{range.max}
    </span>
  )
}

export function LodgingShowcaseForm(props: {
  lodgingId: string
  initialProfile: OwnerLodgingPublicProfileDto
  mode?: 'owner' | 'admin'
  /** Spec 080 AC-02-01 : adresse saisie dans le Guide, rappelée en lecture seule. */
  privateAddress?: { value: string | null; editHref: string }
  /** Spec 082 : ville du logement, pour remplir les FAQ de la bibliothèque. */
  cityName?: string
}) {
  const apiBase = props.mode === 'admin'
    ? `/api/admin/lodgings/${props.lodgingId}`
    : `/api/dashboard/lodgings/${props.lodgingId}`
  // Spec 079 AC-02-02 : un seul lien de réservation, pré-rempli par l'ancienne URL d'annonce.
  const [profile, setProfile] = useState(() => ({
    ...props.initialProfile,
    external_booking_url: props.initialProfile.external_booking_url ?? props.initialProfile.source_listing_url ?? null,
  }))
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
  // Spec 082 US-02 : ajout de questions depuis la bibliothèque.
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [librarySelection, setLibrarySelection] = useState<Set<string>>(new Set())
  // Spec 083 : erreurs par champ, masquées dès que la valeur du champ change.
  const [fieldErrorState, setFieldErrorState] = useState<{ errors: Record<string, string>; snapshot: Record<string, string> }>({ errors: {}, snapshot: {} })

  // Spec 079 AC-03-02 : modifications non enregistrées (les photos sont enregistrées à chaque action,
  // seules leurs descriptions passent par le brouillon).
  const snapshot = showcaseDraftSnapshot({ profile, amenityCodes: selectedAmenityCodes, otherAmenitiesText, faqRows })
  const [savedSnapshot, setSavedSnapshot] = useState(snapshot)
  const [photoAltsEdited, setPhotoAltsEdited] = useState(false)
  const dirty = snapshot !== savedSnapshot || photoAltsEdited

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault() }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const errorState = showcaseErrorState(profile, selectedAmenityCodes, otherAmenitiesText)
  const visibleErrors = visibleServerErrors(fieldErrorState.errors, fieldErrorState.snapshot, errorState)

  function showFieldErrors(errors: Record<string, string>) {
    setFieldErrorState({
      errors,
      snapshot: Object.fromEntries(Object.keys(errors).map(path => [path, JSON.stringify(valueAtPath(errorState, path))])),
    })
    window.requestAnimationFrame?.(() => {
      document.querySelector('[aria-invalid="true"], [data-field-error]')?.scrollIntoView?.({ behavior: 'smooth', block: 'center' })
    })
  }

  function invalid(field: string) {
    return visibleErrors[field] ? { 'aria-invalid': true as const } : {}
  }

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
      showFieldErrors(showcaseFieldErrors({ fieldErrors: errorPayload?.error?.details?.fieldErrors }))
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
    const savedAmenities = (savedProfile.amenities as OwnerLodgingPublicProfileDto['amenities'] | undefined) ?? []
    const nextAmenityCodes = new Set(savedAmenities.filter(a => AMENITY_CATALOG_CODES.has(a.code)).map(a => a.code))
    const nextOtherAmenities = savedAmenities.filter(a => !AMENITY_CATALOG_CODES.has(a.code)).map(a => a.label).join(', ')
    const nextFaq = ((savedProfile.faq as OwnerLodgingPublicProfileDto['faq'] | undefined) ?? []).map(item => ({
      question: item.question,
      answer: item.answer,
    }))
    setProfile(savedProfile)
    setSelectedAmenityCodes(nextAmenityCodes)
    setOtherAmenitiesText(nextOtherAmenities)
    setFaqRows(nextFaq)
    setSavedSnapshot(showcaseDraftSnapshot({ profile: savedProfile, amenityCodes: nextAmenityCodes, otherAmenitiesText: nextOtherAmenities, faqRows: nextFaq }))
    setPhotoAltsEdited(false)
    setFieldErrorState({ errors: {}, snapshot: {} })
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
      showFieldErrors(showcaseFieldErrors({ missingFields: error?.details?.missingFields ?? [] }))
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

  const libraryItems = missingLibraryItems(faqRows)

  function addLibraryQuestions() {
    const context = { cityName: props.cityName ?? null, maxGuests: profile.max_guests, bedroomCount: profile.bedroom_count }
    const added = libraryItems.filter(item => librarySelection.has(item.id)).map(item => fillFaqTemplate(item, context))
    setFaqRows(rows => [...rows, ...added])
    setLibrarySelection(new Set())
    setLibraryOpen(false)
  }

  const isOwner = props.mode !== 'admin'
  const saveState = dirty ? 'Modifications non enregistrées' : 'Toutes les modifications sont enregistrées.'

  return (
    <fieldset disabled={uploadProgress !== null || photoActionId !== null} className="min-w-0 lg:grid lg:grid-cols-[190px_minmax(0,1fr)] lg:gap-x-8">
      {/* Spec 079 AC-03-01 : sommaire fixe. */}
      <nav aria-label="Sommaire du logement" className="mb-6 lg:mb-0">
        <ol className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:sticky lg:top-6 lg:flex-col lg:overflow-visible">
          {SHOWCASE_SECTIONS.map((section, index) => (
            <li key={section.id} className="shrink-0">
              <a href={`#${section.id}`} className="flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1.5 text-[13px] font-semibold text-gray-600 transition hover:border-[#0B1437]/30 hover:text-neutral-900 lg:rounded-xl lg:border-transparent lg:bg-transparent lg:px-2">
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#F4F7FE] text-[11px] font-bold text-[#0B1437]">{index + 1}</span>
                {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="min-w-0 space-y-10">
        {(missingFields.length > 0 || validationErrors.length > 0) && (
          <div role="alert" className="space-y-3 rounded-[20px] border border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            {missingFields.length > 0 && (
              <div>
                <p className="font-semibold">À compléter avant la demande de publication</p>
                <ul className="mt-2 list-disc pl-5">
                  {missingFields.map(field => <li key={field}>{missingFieldLabel(field)}</li>)}
                </ul>
              </div>
            )}
            {validationErrors.length > 0 && (
              <div>
                <p className="font-semibold">Erreurs a corriger dans le brouillon</p>
                <ul className="mt-2 list-disc pl-5">
                  {validationErrors.map(error => <li key={error}>{error}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        <Section id="presentation">
          <Panel>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="showcase-title">Titre</Label>
                <Input id="showcase-title" {...invalid('title')} value={profile.title} onChange={event => setField('title', event.target.value)} />
                <FieldError message={visibleErrors.title} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="showcase-short-description">Description courte</Label>
                <Textarea
                  id="showcase-short-description" {...invalid('short_description')}
                  value={profile.short_description}
                  onChange={event => setField('short_description', event.target.value)}
                  rows={3}
                />
                <FieldError message={visibleErrors.short_description} />
                <p className="text-[11px] text-gray-400">Affichée sur les cartes et en tête de fiche.</p>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="showcase-description">Description principale</Label>
                <Textarea
                  id="showcase-description" {...invalid('description')}
                  value={profile.description}
                  onChange={event => setField('description', event.target.value)}
                  rows={8}
                />
                <FieldError message={visibleErrors.description} />
              </div>
              <MarkdownHint />
            </div>
          </Panel>
          {isOwner && (
            <Panel title="Rédaction assistée" description="Collez votre texte (annonce, notes…) : MyStay propose une version optimisée, à vérifier avant de l’appliquer.">
              <div className="space-y-3">
                <Label htmlFor="source-description-text" className="sr-only">Texte source</Label>
                <Textarea
                  id="source-description-text" {...invalid('source_description_text')}
                  value={profile.source_description_text ?? ''}
                  onChange={event => setField('source_description_text', event.target.value)}
                  rows={5}
                  placeholder="Votre description, 80 caractères minimum"
                />
                <FieldError message={visibleErrors.source_description_text} />
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={requestRewrite}>
                    <Sparkles aria-hidden="true" />Proposer une version MyStay
                  </Button>
                  {profile.rewrite_suggestion && (
                    <Button type="button" variant="outline" onClick={applyRewriteSuggestion}>
                      Appliquer le brouillon MyStay
                    </Button>
                  )}
                </div>
              </div>
            </Panel>
          )}
        </Section>

        <Section id="caracteristiques">
          <Panel>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-1">
                <Label htmlFor="property-type">Type</Label>
                <Input id="property-type" {...invalid('property_type')} value={profile.property_type} onChange={event => setField('property_type', event.target.value)} placeholder="Appartement, chalet…" />
                <FieldError message={visibleErrors.property_type} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="max-guests">Voyageurs max</Label>
                <Input id="max-guests" {...invalid('max_guests')} type="number" min={1} value={String(profile.max_guests)} onChange={event => setField('max_guests', Number(event.target.value) || 1)} />
                <FieldError message={visibleErrors.max_guests} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="surface-m2">Surface m2</Label>
                <Input id="surface-m2" {...invalid('surface_m2')} type="number" min={1} value={profile.surface_m2 ?? ''} onChange={event => setField('surface_m2', event.target.value === '' ? null : Number(event.target.value))} />
                <FieldError message={visibleErrors.surface_m2} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bedroom-count">Chambres</Label>
                <Input id="bedroom-count" {...invalid('bedroom_count')} type="number" min={0} value={profile.bedroom_count ?? ''} onChange={event => setField('bedroom_count', event.target.value === '' ? null : Number(event.target.value))} />
                <FieldError message={visibleErrors.bedroom_count} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bathroom-count">Salles de bain</Label>
                <Input id="bathroom-count" {...invalid('bathroom_count')} type="number" min={0} value={profile.bathroom_count ?? ''} onChange={event => setField('bathroom_count', event.target.value === '' ? null : Number(event.target.value))} />
                <FieldError message={visibleErrors.bathroom_count} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bed-count">Lits</Label>
                <Input id="bed-count" {...invalid('bed_count')} type="number" min={0} value={profile.bed_count ?? ''} onChange={event => setField('bed_count', event.target.value === '' ? null : Number(event.target.value))} />
                <FieldError message={visibleErrors.bed_count} />
              </div>
              {props.privateAddress ? (
                <div className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 sm:col-span-2 lg:col-span-3">
                  <p className="text-[13px] font-semibold text-gray-700">Adresse du logement <span className="font-normal text-gray-400">· privée, jamais affichée</span></p>
                  <p data-testid="private-address" className="mt-1 text-sm text-neutral-900">{props.privateAddress.value ?? 'Pas encore renseignée.'}</p>
                  <a href={props.privateAddress.editHref} className="mt-2 inline-flex text-[13px] font-semibold text-[#0B1437] hover:underline">
                    {props.privateAddress.value ? 'Modifier dans le Guide' : 'Renseigner l’adresse dans le Guide'}
                  </a>
                </div>
              ) : null}
              <div className="space-y-1.5 sm:col-span-2 lg:col-span-3">
                <Label htmlFor="public-area-label">Quartier affiché (facultatif)</Label>
                <Input id="public-area-label" {...invalid('public_area_label')} value={profile.public_area_label ?? ''} onChange={event => setField('public_area_label', event.target.value)} placeholder="Centre du village, hameau du Bettex…" />
                <FieldError message={visibleErrors.public_area_label} />
                <p className="text-[11px] text-gray-400">Seuls la ville et ce quartier apparaissent sur la fiche publique.</p>
              </div>
            </div>
          </Panel>
        </Section>

        <Section id="equipements">
          <FieldError message={visibleErrors.amenities} />
          <Panel title="Compris dans le séjour">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
              {AMENITY_CATALOG.filter(item => item.availability === 'included').map(item => (
                <label key={item.code} className="flex items-center gap-2 text-sm text-neutral-800">
                  <input
                    type="checkbox"
                    checked={selectedAmenityCodes.has(item.code)}
                    onChange={() => toggleAmenity(item.code)}
                    className="h-4 w-4 accent-[#0B1437]"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </Panel>
          <Panel title="Services sur demande">
            <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 sm:grid-cols-3">
              {AMENITY_CATALOG.filter(item => item.availability === 'on_request').map(item => (
                <label key={item.code} className="flex items-center gap-2 text-sm text-neutral-800">
                  <input
                    type="checkbox"
                    checked={selectedAmenityCodes.has(item.code)}
                    onChange={() => toggleAmenity(item.code)}
                    className="h-4 w-4 accent-[#0B1437]"
                  />
                  {item.label}
                </label>
              ))}
            </div>
          </Panel>
          <Panel>
            <div className="space-y-1.5">
              <Label htmlFor="other-amenities">Autres équipements</Label>
              <Textarea
                id="other-amenities"
                value={otherAmenitiesText}
                onChange={event => setOtherAmenitiesText(event.target.value)}
                rows={2}
                placeholder="Tout ce qui n'est pas dans la liste, séparé par des virgules"
              />
            </div>
          </Panel>
        </Section>

        <Section id="photos">
 <FieldError message={visibleErrors.photos ?? visibleErrors.cover_photo} />
          <Panel title="Ajouter des photos" description="Depuis votre ordinateur. Choisissez la pièce, puis ajustez-la sur chaque vignette.">
            <div className="space-y-4">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_200px]">
                <div className="space-y-1.5">
                  <Label htmlFor="photo-alt">Texte alternatif (facultatif, commun au lot)</Label>
                  <Input id="photo-alt" disabled={photosBusy} maxLength={160} value={photoAlt} onChange={event => setPhotoAlt(event.target.value)} placeholder="Salon principal lumineux" />
                  <p className="text-[11px] text-gray-400">S’applique aux photos que vous importez ensuite.</p>
                  {/* Spec 079 AC-03-05 : appliquer ce texte aux photos déjà importées. */}
                  {profile.photos.length > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={photosBusy || photoAlt.trim().length < 5}
                      onClick={() => {
                        setPhotoAltsEdited(true)
                        setField('photos', applyAltToPhotos(profile.photos, photoAlt, ROOM_TYPE_LABELS))
                        setStatus('idle')
                        setMessage('Texte appliqué aux photos existantes. Sauvegardez le brouillon pour l’enregistrer.')
                      }}
                    >
                      Appliquer aux {profile.photos.length} photo(s) existante(s)
                    </Button>
                  )}
                </div>
                <div className="space-y-1.5">
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
              <div className="flex flex-wrap items-end gap-3">
                <div className="min-w-0 flex-1 space-y-1.5">
                  <Label htmlFor="photo-files">Photos à importer</Label>
                  <Input key={fileInputKey} id="photo-files" type="file" multiple disabled={photosBusy} accept={ACCEPTED_IMAGE_INPUT} onChange={event => { setPhotoFiles(Array.from(event.target.files ?? [])); setUploadErrors([]) }} />
                </div>
                <Button type="button" variant="outline" onClick={uploadPhoto} disabled={photosBusy || photoFiles.length === 0 || (photoAlt.trim().length > 0 && photoAlt.trim().length < 5)}>
                  {uploadProgress ? `Envoi ${uploadProgress.completed}/${uploadProgress.total}…` : 'Importer les photos'}
                </Button>
              </div>
              {photoFiles.length > 0 && <p className="text-sm">{photoFiles.length} fichier(s) sélectionné(s)</p>}
              {uploadProgress && <p role="status" className="text-sm">{uploadProgress.completed} / {uploadProgress.total} photos traitées</p>}
              {uploadErrors.length > 0 && <ul role="alert" className="space-y-1 text-sm text-destructive">{uploadErrors.map((error, index) => <li key={index}>{error}</li>)}</ul>}
            </div>
          </Panel>
          {photoActionId === 'reorder' && <p role="status" className="text-sm">Enregistrement de l’ordre…</p>}
          {profile.photos.length > 0 ? (
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
                        <img draggable={false} src={photo.url} alt={photo.alt} className="aspect-[4/3] w-full rounded-t-xl object-cover" />
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
                          onChange={event => {
                            setPhotoAltsEdited(true)
                            setField('photos', profile.photos.map((item, index) => index === photoIndex ? { ...item, alt: event.target.value } : item))
                          }}
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
          ) : (
            <p className="rounded-[20px] border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-400">Aucune photo pour l’instant.</p>
          )}
        </Section>

        <Section id="faq">
          <Panel>
            <div className="space-y-3">
              {faqRows.length === 0 && <p className="text-sm text-gray-400">Aucune question pour l’instant.</p>}
              {faqRows.map((row, index) => (
                <div key={index} className="grid gap-2 rounded-xl border border-gray-100 bg-gray-50/40 p-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] sm:items-start">
                  <div className="space-y-1">
                    <Label htmlFor={`faq-question-${index}`} className="text-[11px] text-gray-500">Question {index + 1}</Label>
                    <Input
                      id={`faq-question-${index}`}
                      value={row.question}
                      onChange={event => setFaqRows(rows => rows.map((r, i) => (i === index ? { ...r, question: event.target.value } : r)))}
                      placeholder="Question"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <Label htmlFor={`faq-answer-${index}`} className="text-[11px] text-gray-500">Réponse {index + 1}</Label>
                      {needsAdaptation(`${row.question} ${row.answer}`) && (
                        <span title="Remplacez les passages entre crochets" className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800">À adapter</span>
                      )}
                    </div>
                    <Textarea
                      id={`faq-answer-${index}`}
                      value={row.answer}
                      onChange={event => setFaqRows(rows => rows.map((r, i) => (i === index ? { ...r, answer: event.target.value } : r)))}
                      rows={2}
                      placeholder="Reponse"
                    />
                  </div>
                  <Button type="button" variant="ghost" size="icon" className="text-gray-400 hover:text-rose-600 sm:mt-5" aria-label={`Supprimer la question ${index + 1}`} onClick={() => setFaqRows(rows => rows.filter((_, i) => i !== index))}>
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              ))}
              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" size="sm" onClick={() => setFaqRows(rows => [...rows, { question: '', answer: '' }])}>
                  <Plus aria-hidden="true" />Ajouter une question
                </Button>
                <Button type="button" variant="outline" size="sm" disabled={libraryItems.length === 0} aria-expanded={libraryOpen} onClick={() => setLibraryOpen(open => !open)}>
                  <BookOpen aria-hidden="true" />Ajouter depuis la bibliothèque{libraryItems.length > 0 ? ` (${libraryItems.length})` : ''}
                </Button>
              </div>
              {/* Spec 082 AC-02-01 : questions génériques absentes de la FAQ du logement. */}
              {libraryOpen && libraryItems.length > 0 && (
                <div role="group" aria-label="Bibliothèque de questions" className="space-y-3 rounded-xl border border-[#0B1437]/10 bg-[#F4F7FE]/50 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[13px] font-semibold text-neutral-900">Questions génériques MyStay</p>
                    <button
                      type="button"
                      className="text-[12px] font-semibold text-[#0B1437] hover:underline"
                      onClick={() => setLibrarySelection(current => current.size === libraryItems.length ? new Set() : new Set(libraryItems.map(item => item.id)))}
                    >
                      {librarySelection.size === libraryItems.length ? 'Tout désélectionner' : 'Tout sélectionner'}
                    </button>
                  </div>
                  <ul className="space-y-1.5">
                    {libraryItems.map(item => (
                      <li key={item.id}>
                        <label className="flex items-start gap-2.5 text-sm text-neutral-800">
                          <input
                            type="checkbox"
                            checked={librarySelection.has(item.id)}
                            onChange={() => setLibrarySelection(current => {
                              const next = new Set(current)
                              if (next.has(item.id)) next.delete(item.id)
                              else next.add(item.id)
                              return next
                            })}
                            className="mt-0.5 h-4 w-4 accent-[#0B1437]"
                          />
                          {item.question}
                        </label>
                      </li>
                    ))}
                  </ul>
                  <p className="text-[11px] text-gray-500">La ville, la capacité et le nombre de chambres sont remplis automatiquement ; complétez ensuite les passages entre crochets.</p>
                  <Button type="button" size="sm" disabled={librarySelection.size === 0} onClick={addLibraryQuestions}>
                    Ajouter ({librarySelection.size})
                  </Button>
                </div>
              )}
            </div>
          </Panel>
        </Section>

        {/* Spec 079 US-02 : un seul lien de réservation. */}
        <Section id="reservation">
          <Panel>
            <div className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="external-booking-url">Lien de réservation (Airbnb, Booking…)</Label>
                <Input
                  id="external-booking-url" {...invalid('external_booking_url')}
                  value={profile.external_booking_url ?? ''}
                  onChange={event => setField('external_booking_url', event.target.value)}
                  placeholder="airbnb.fr/rooms/123456789"
                />
                <FieldError message={visibleErrors.external_booking_url} />
                <p className="text-[11px] text-gray-400">Le bouton « Réserver » de la fiche mène à cette annonce. Le « https:// » est facultatif.</p>
              </div>
              <label className="flex items-center gap-3 text-sm text-neutral-800">
                <input
                  type="checkbox"
                  checked={profile.public_contact_enabled}
                  onChange={event => setField('public_contact_enabled', event.target.checked)}
                  className="h-4 w-4 accent-[#0B1437]"
                />
                Activer le contact public sur la fiche logement
              </label>
            </div>
          </Panel>
        </Section>

        <Section id="referencement">
          <Panel>
            <div className="grid gap-5 lg:grid-cols-2">
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <Label htmlFor="seo-title">SEO title</Label>
                    <Counter value={profile.seo_title ?? ''} range={SEO_TITLE_RANGE} testId="counter-seo-title" />
                  </div>
                  <Input id="seo-title" {...invalid('seo_title')} value={profile.seo_title ?? ''} onChange={event => setField('seo_title', event.target.value)} />
                <FieldError message={visibleErrors.seo_title} />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <Label htmlFor="seo-description">SEO description</Label>
                    <Counter value={profile.seo_description ?? ''} range={SEO_DESCRIPTION_RANGE} testId="counter-seo-description" />
                  </div>
                  <Textarea id="seo-description" {...invalid('seo_description')} value={profile.seo_description ?? ''} onChange={event => setField('seo_description', event.target.value)} rows={4} />
                <FieldError message={visibleErrors.seo_description} />
                </div>
                <p className="text-[11px] text-gray-400">Vides : le titre et la description courte sont utilisés.</p>
              </div>
              <div aria-label="Aperçu Google" className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 text-sm">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Aperçu Google</p>
                <p className="mt-3 text-xs text-gray-600">
                  {profile.slug ? publicLodgingPath(profile.slug) : `${publicLodgingsPath()}/...`}
                </p>
                <p className="mt-1 text-lg leading-snug text-[#1a0dab]">{seoPreview.title || 'Titre SEO'}</p>
                <p className="mt-1 text-[13px] leading-relaxed text-gray-600">{seoPreview.description || 'Description SEO'}</p>
              </div>
            </div>
          </Panel>
        </Section>
      </div>

      {/* Spec 079 AC-03-02 : barre fixe — statut, état des modifications, actions. */}
      <div className="sticky bottom-0 z-20 mt-8 rounded-t-[20px] border border-b-0 border-gray-100 bg-white/95 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.06)] backdrop-blur-sm lg:col-span-2">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <span data-testid="publication-status" className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-gray-600">
              {publicationStatusLabel(profile.publication_status)}
            </span>
            <p role="status" aria-label="État de l’enregistrement" className={`flex items-center gap-2 text-[13px] font-semibold ${dirty ? 'text-amber-700' : 'text-emerald-700'}`}>
              {dirty ? <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" /> : null}
              {saveState}
            </p>
            {message ? (
              <p aria-live="polite" className={`text-[13px] ${status === 'error' ? 'font-semibold text-rose-600' : 'text-gray-500'}`}>{message}</p>
            ) : null}
          </div>
          <div className="flex gap-2">
            <Button type="button" variant={isOwner ? 'outline' : 'default'} className="h-11" onClick={saveDraft} disabled={photosBusy}>
              Sauvegarder le brouillon
            </Button>
            {isOwner && (
              <Button type="button" className="h-11 bg-[#0B1437] text-white hover:bg-gray-900" onClick={submitForReview} disabled={photosBusy || dirty}
                title={dirty ? 'Sauvegardez d’abord le brouillon' : undefined}>
                Demander la publication
              </Button>
            )}
          </div>
        </div>
      </div>
    </fieldset>
  )
}
