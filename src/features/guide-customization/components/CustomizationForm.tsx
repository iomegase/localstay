'use client'

import { useEffect, useState, type ReactNode } from 'react'
import Link from 'next/link'
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ChevronDown, ExternalLink, GripVertical, Save } from 'lucide-react'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Input } from '@/shared/components/ui/input'
import { MarkdownHint } from '@/shared/components/MarkdownHint'
import { ImageUpload } from '@/shared/components/ImageUpload'
import { countWords, normalizeOwnerNote, OWNER_NOTE_MAX_WORDS } from '../lib/validation'
import { GUIDE_SECTIONS, guideFormSnapshot, type GuideSectionId } from '../lib/guide-form'
import { PracticalBlocksEditor } from '@/features/guide-customization/components/PracticalBlocksEditor'
import { ArrivalInstructionsEditor } from '@/features/guide-customization/components/ArrivalInstructionsEditor'
import type { ArrivalInstructionInput } from '@/features/guide-customization/types'
import { YouTubeUrlField } from '@/features/guide-customization/components/YouTubeUrlField'
import { UsefulNumbersEditor } from '@/features/guide-customization/components/UsefulNumbersEditor'
import { OtherCityRecommendations } from '@/features/guide-customization/components/OtherCityRecommendations'
import { extractYouTubeId } from '@/shared/lib/youtube'
import type {
  FeaturedPoiInput,
  LodgingCustomizationResponse,
  OtherCityPoiSelection,
  PracticalBlockInput,
  PracticalInfoFields,
} from '../types'
import { PRACTICAL_INFO_KEYS } from '../types'

interface CategoryOption {
  id: string
  name: string
  slug: string
  sort_order: number
}

interface PoiOption {
  id: string
  name: string
  category_id: string
  category_slug: string
  category_name: string
}

interface Props {
  lodgingId: string
  citySlug: string
  categories: CategoryOption[]
  pois: PoiOption[]
  initialCustomization: LodgingCustomizationResponse
  initialOtherCityPois?: OtherCityPoiSelection[]
}

type ApiErrorPayload = {
  error?: {
    message?: string
    details?: {
      fieldErrors?: Record<string, string[]>
      formErrors?: string[]
    }
  }
}

const VALIDATION_FIELD_LABELS: Record<string, string> = {
  category_order: 'Ordre des catégories',
  featured_pois: 'Recommandations',
  cover_photo_url: 'Photo du logement',
  presentation_video_url: 'Vidéo de présentation',
  lodging_address: 'Adresse du logement',
  wifi_ssid: 'Wi-Fi - nom du réseau',
  wifi_password: 'Wi-Fi - mot de passe',
  key_box_code: 'Code de la boîte à clés',
  checkout_instructions: 'Consignes de départ',
  trash_location: 'Point de tri',
  house_rules: 'Règlement intérieur',
  emergency_contacts: 'Urgences',
  useful_services: 'Numéros utiles',
  practical_blocks: 'Blocs personnalisés',
}

function validationLabel(field: string): string {
  return VALIDATION_FIELD_LABELS[field] ?? field
}

function formatApiValidationError(payload: ApiErrorPayload | null): string | null {
  const details = payload?.error?.details
  const messages: string[] = []

  for (const message of details?.formErrors ?? []) {
    messages.push(message)
  }

  for (const [field, fieldMessages] of Object.entries(details?.fieldErrors ?? {})) {
    for (const fieldMessage of fieldMessages) {
      messages.push(`${validationLabel(field)} - ${fieldMessage}`)
    }
  }

  return messages.length > 0 ? messages.join(' ') : null
}

function hasInvalidYouTubeUrl(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0 && extractYouTubeId(value) === null
}

function practicalInfoFrom(source: LodgingCustomizationResponse): PracticalInfoFields {
  return {
    cover_photo_url: source.cover_photo_url ?? null,
    presentation_video_url: source.presentation_video_url ?? null,
    lodging_address: source.lodging_address ?? null,
    wifi_ssid: source.wifi_ssid ?? null,
    wifi_password: source.wifi_password ?? null,
    key_box_code: source.key_box_code ?? null,
    checkout_instructions: source.checkout_instructions ?? null,
    trash_location: source.trash_location ?? null,
    house_rules: source.house_rules ?? null,
    emergency_contacts: source.emergency_contacts ?? null,
    useful_services: source.useful_services ?? null,
  }
}

function SortableCategoryItem({ category, position }: { category: CategoryOption; position: number }) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: category.slug,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <li
      ref={setNodeRef}
      style={style}
      className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white px-3 py-2.5 text-sm"
    >
      <button
        type="button"
        className="flex h-8 w-8 cursor-grab items-center justify-center rounded-lg text-gray-400 transition-colors hover:bg-[#F4F7FE] hover:text-[#0B1437] active:cursor-grabbing"
        aria-label={`Déplacer ${category.name}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="w-5 text-[11px] font-bold tabular-nums text-gray-300">{position}</span>
      <span className="text-[13px] font-semibold text-neutral-900">{category.name}</span>
    </li>
  )
}

/** Spec 077 AC-04-01 : section numérotée de la page Guide. */
function GuideSection({ id, index, children }: { id: GuideSectionId; index: number; children: ReactNode }) {
  const section = GUIDE_SECTIONS[index]!
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

function Card({ title, description, children }: { title?: string; description?: string; children: ReactNode }) {
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

function TextField({
  id, label, value, placeholder, maxLength, hint, onChange,
}: {
  id: string
  label: string
  value: string
  placeholder?: string
  maxLength: number
  hint?: string
  onChange: (value: string) => void
}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <Label htmlFor={id} className="text-[13px] font-semibold text-gray-700">{label}</Label>
      <Input id={id} value={value} maxLength={maxLength} placeholder={placeholder} onChange={event => onChange(event.target.value)} />
      {hint ? <p className="text-[11px] text-gray-400">{hint}</p> : null}
    </div>
  )
}

export function CustomizationForm({
  lodgingId,
  citySlug,
  categories,
  pois,
  initialCustomization,
  initialOtherCityPois = [],
}: Props) {
  const otherCityIds = new Set(initialOtherCityPois.map(poi => poi.poi_id))
  const [categoryOrder, setCategoryOrder] = useState(() => {
    const knownSlugs = new Set(categories.map(category => category.slug))
    const ordered = initialCustomization.category_order.filter(slug => knownSlugs.has(slug))
    const missing = categories
      .filter(category => !ordered.includes(category.slug))
      .sort((a, b) => a.sort_order - b.sort_order)
      .map(category => category.slug)
    return [...ordered, ...missing]
  })
  const [featuredPois, setFeaturedPois] = useState<FeaturedPoiInput[]>(
    initialCustomization.featured_pois
      .filter(featuredPoi => !otherCityIds.has(featuredPoi.poi_id))
      .map(featuredPoi => ({
        poi_id: featuredPoi.poi_id,
        owner_note: featuredPoi.owner_note,
        sort_order: featuredPoi.sort_order,
      }))
      .sort((a, b) => a.sort_order - b.sort_order),
  )
  const [practicalInfo, setPracticalInfo] = useState<PracticalInfoFields>(() => practicalInfoFrom(initialCustomization))
  const [practicalBlocks, setPracticalBlocks] = useState<PracticalBlockInput[]>(
    initialCustomization.practical_blocks ?? [],
  )
  const [arrivalInstructions, setArrivalInstructions] = useState<ArrivalInstructionInput[]>(
    initialCustomization.arrival_instructions ?? [],
  )
  const [otherCityPois, setOtherCityPois] = useState<OtherCityPoiSelection[]>(initialOtherCityPois)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

  // Spec 077 AC-04-02 : modifications non enregistrées.
  const snapshot = guideFormSnapshot({ categoryOrder, featuredPois, practicalInfo, practicalBlocks, arrivalInstructions, otherCityPois })
  const [savedSnapshot, setSavedSnapshot] = useState(snapshot)
  const dirty = snapshot !== savedSnapshot

  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault() }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  function setPracticalField<K extends keyof PracticalInfoFields>(key: K, value: string) {
    setPracticalInfo(current => ({ ...current, [key]: value.length === 0 ? null : value }))
  }

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const categoriesBySlug = new Map(categories.map(category => [category.slug, category]))
  const orderedCategories = categoryOrder
    .map(slug => categoriesBySlug.get(slug))
    .filter((category): category is CategoryOption => Boolean(category))
  const featuredByPoiId = new Map(
    featuredPois.map(featuredPoi => [featuredPoi.poi_id, featuredPoi]),
  )
  const selectedPoiIds = new Set(featuredPois.map(featuredPoi => featuredPoi.poi_id))
  const ownerNoteOverLimit = [...featuredPois, ...otherCityPois].some(
    featuredPoi => countWords(featuredPoi.owner_note ?? '') > OWNER_NOTE_MAX_WORDS,
  )
  const practicalBlockWithoutTitle = practicalBlocks.some(
    block => block.title.trim().length === 0,
  )
  const invalidVideoUrl = hasInvalidYouTubeUrl(practicalInfo.presentation_video_url) ||
    practicalBlocks.some(block => hasInvalidYouTubeUrl(block.video_url))
  const clientValidationMessage = practicalBlockWithoutTitle
    ? 'Un bloc personnalisé doit avoir un titre, ou être supprimé avant enregistrement.'
    : invalidVideoUrl
      ? 'Les liens vidéo doivent être des URL YouTube valides.'
      : null
  const saveDisabled = status === 'saving' ||
    ownerNoteOverLimit ||
    clientValidationMessage !== null

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    setCategoryOrder(items => {
      const oldIndex = items.indexOf(String(active.id))
      const newIndex = items.indexOf(String(over.id))
      if (oldIndex === -1 || newIndex === -1) return items
      return arrayMove(items, oldIndex, newIndex)
    })
  }

  function toggleFeaturedPoi(poiId: string, checked: boolean) {
    setFeaturedPois(current => {
      if (!checked) return current.filter(featuredPoi => featuredPoi.poi_id !== poiId)
      if (current.some(featuredPoi => featuredPoi.poi_id === poiId)) return current
      return [...current, { poi_id: poiId, owner_note: null, sort_order: current.length }]
    })
  }

  function updateOwnerNote(poiId: string, ownerNote: string) {
    setFeaturedPois(current =>
      current.map(featuredPoi =>
        featuredPoi.poi_id === poiId
          ? { ...featuredPoi, owner_note: ownerNote }
          : featuredPoi,
      ),
    )
  }

  async function saveCustomization() {
    if (clientValidationMessage) {
      return
    }

    setStatus('saving')
    setMessage(null)

    const practicalPayload = PRACTICAL_INFO_KEYS.reduce<Record<string, string | null>>((acc, key) => {
      const raw = practicalInfo[key]
      acc[key] = raw && raw.trim().length > 0 ? raw.trim() : null
      return acc
    }, {})

    const response = await fetch(`/api/dashboard/lodgings/${lodgingId}/customization`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        category_order: categoryOrder,
        featured_pois: [
          ...featuredPois.map((featuredPoi, index) => ({
            poi_id: featuredPoi.poi_id,
            owner_note: normalizeOwnerNote(featuredPoi.owner_note),
            sort_order: index,
          })),
          ...otherCityPois.map((poi, index) => ({
            poi_id: poi.poi_id,
            owner_note: normalizeOwnerNote(poi.owner_note),
            sort_order: featuredPois.length + index,
          })),
        ],
        practical_blocks: practicalBlocks.map((block, index) => ({
          ...block,
          sort_order: index,
        })),
        arrival_instructions: arrivalInstructions.map((instruction, index) => ({
          ...instruction,
          sort_order: index,
        })),
        ...practicalPayload,
      }),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => null) as ApiErrorPayload | null
      setStatus('error')
      setMessage(formatApiValidationError(payload) ?? payload?.error?.message ?? 'Sauvegarde impossible.')
      return
    }

    const payload = await response.json() as LodgingCustomizationResponse
    const nextCategoryOrder = payload.category_order.length > 0 ? payload.category_order : categoryOrder
    const otherCityPoiIds = new Set(otherCityPois.map(poi => poi.poi_id))
    const savedByPoiId = new Map(
      payload.featured_pois.map(featuredPoi => [featuredPoi.poi_id, featuredPoi]),
    )
    const nextFeaturedPois = payload.featured_pois
      .filter(featuredPoi => !otherCityPoiIds.has(featuredPoi.poi_id))
      .map(featuredPoi => ({
        poi_id: featuredPoi.poi_id,
        owner_note: featuredPoi.owner_note,
        sort_order: featuredPoi.sort_order,
      }))
    const nextOtherCityPois = otherCityPois.map(poi => ({
      ...poi,
      owner_note: savedByPoiId.get(poi.poi_id)?.owner_note ?? null,
    }))
    const nextPracticalInfo = practicalInfoFrom(payload)
    const nextPracticalBlocks = payload.practical_blocks ?? []
    const nextArrivalInstructions = payload.arrival_instructions ?? []

    setCategoryOrder(nextCategoryOrder)
    setFeaturedPois(nextFeaturedPois)
    setOtherCityPois(nextOtherCityPois)
    setPracticalInfo(nextPracticalInfo)
    setPracticalBlocks(nextPracticalBlocks)
    setArrivalInstructions(nextArrivalInstructions)
    setSavedSnapshot(guideFormSnapshot({
      categoryOrder: nextCategoryOrder,
      featuredPois: nextFeaturedPois,
      practicalInfo: nextPracticalInfo,
      practicalBlocks: nextPracticalBlocks,
      arrivalInstructions: nextArrivalInstructions,
      otherCityPois: nextOtherCityPois,
    }))
    setStatus('saved')
    setMessage(
      payload.ignored_category_slugs.length > 0
        ? `Guide enregistré. Slugs ignorés: ${payload.ignored_category_slugs.join(', ')}.`
        : 'Guide enregistré.',
    )
  }

  const barMessage = clientValidationMessage
    ?? (status === 'error' ? message : null)
    ?? (dirty ? 'Modifications non enregistrées' : message ?? 'Toutes les modifications sont enregistrées.')
  const barTone = clientValidationMessage || status === 'error'
    ? 'text-rose-600'
    : dirty ? 'text-amber-700' : 'text-emerald-700'

  return (
    <div className="pb-32 lg:grid lg:grid-cols-[180px_minmax(0,1fr)] lg:gap-8">
      {/* Spec 077 AC-04-01 : sommaire fixe. */}
      <nav aria-label="Sommaire du guide" className="mb-6 lg:mb-0">
        <ol className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 lg:sticky lg:top-6 lg:flex-col lg:overflow-visible">
          {GUIDE_SECTIONS.map((section, index) => (
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
        <GuideSection id="logement" index={0}>
          <Card title="Photo et vidéo" description="La photo s’affiche en grand sur l’accueil du guide.">
            <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_220px]">
              <div className="space-y-3">
                <TextField
                  id="practical-cover_photo_url"
                  label="Photo du logement (URL)"
                  value={practicalInfo.cover_photo_url ?? ''}
                  maxLength={1000}
                  placeholder="https://exemple.com/ma-photo.jpg"
                  onChange={value => setPracticalField('cover_photo_url', value)}
                />
                <ImageUpload
                  endpoint={`/api/dashboard/lodgings/${lodgingId}/cover-photo`}
                  onUploaded={url => setPracticalField('cover_photo_url', url)}
                  label="Téléverser une photo"
                />
                <YouTubeUrlField
                  id="practical-presentation_video_url"
                  label="Vidéo de présentation (lien YouTube)"
                  value={practicalInfo.presentation_video_url}
                  onChange={url => setPracticalField('presentation_video_url', url ?? '')}
                />
              </div>
              {practicalInfo.cover_photo_url && practicalInfo.cover_photo_url.trim() !== '' ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={practicalInfo.cover_photo_url}
                  alt="Aperçu photo du logement"
                  referrerPolicy="no-referrer"
                  className="aspect-[4/3] w-full rounded-xl border border-gray-100 object-cover"
                />
              ) : (
                <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-gray-200 text-xs text-gray-400">
                  Aucune photo
                </div>
              )}
            </div>
          </Card>
          <Card title="Adresse">
            <TextField
              id="practical-lodging_address"
              label="Adresse du logement"
              value={practicalInfo.lodging_address ?? ''}
              maxLength={255}
              placeholder="12 rue des Alpages, 74170 Saint-Gervais-les-Bains"
              hint="Sert à l’itinéraire et à la carte du guide."
              onChange={value => setPracticalField('lodging_address', value)}
            />
          </Card>
        </GuideSection>

        <GuideSection id="arrivee" index={1}>
          <Card title="Boîte à clés" description="Affiché masqué dans le guide, révélé à la demande du voyageur.">
            <TextField
              id="practical-key_box_code"
              label="Code de la boîte à clés"
              value={practicalInfo.key_box_code ?? ''}
              maxLength={20}
              placeholder="4810"
              onChange={value => setPracticalField('key_box_code', value)}
            />
          </Card>
          <Card>
            <ArrivalInstructionsEditor value={arrivalInstructions} onChange={setArrivalInstructions} lodgingId={lodgingId} />
          </Card>
        </GuideSection>

        <GuideSection id="sur-place" index={2}>
          <Card title="Wi-Fi">
            <div className="grid gap-4 sm:grid-cols-2">
              <TextField
                id="practical-wifi_ssid"
                label="Nom du réseau (SSID)"
                value={practicalInfo.wifi_ssid ?? ''}
                maxLength={120}
                placeholder="Chalet-StGervais"
                onChange={value => setPracticalField('wifi_ssid', value)}
              />
              <TextField
                id="practical-wifi_password"
                label="Mot de passe"
                value={practicalInfo.wifi_password ?? ''}
                maxLength={120}
                placeholder="mon-mot-de-passe-wifi"
                onChange={value => setPracticalField('wifi_password', value)}
              />
            </div>
          </Card>
          {/* Spec 077 AC-03-01 : seule la localisation du point de tri est conservée. */}
          <Card title="Point de tri">
            <TextField
              id="practical-trash_location"
              label="Point de tri (adresse ou lien Google Maps)"
              value={practicalInfo.trash_location ?? ''}
              maxLength={500}
              placeholder="12 rue des Alpages, Saint-Gervais — ou https://maps.app.goo.gl/abcd"
              hint="Le guide propose un bouton « Voir le point de tri »."
              onChange={value => setPracticalField('trash_location', value)}
            />
          </Card>
          <Card>
            <UsefulNumbersEditor
              value={practicalInfo.useful_services}
              onChange={value => setPracticalField('useful_services', value)}
            />
          </Card>
          <Card>
            <MarkdownHint className="mb-4" />
            <PracticalBlocksEditor value={practicalBlocks} onChange={setPracticalBlocks} lodgingId={lodgingId} />
          </Card>
        </GuideSection>

        <GuideSection id="recommandations" index={3}>
          <Card title="Ordre des catégories" description="Glissez les catégories pour définir leur ordre dans le guide.">
            {/* id stable : sinon @dnd-kit génère des ids d'accessibilité non déterministes
                (DndDescribedBy-N) qui diffèrent entre SSR et client → mismatch d'hydratation. */}
            <DndContext id="category-order-dnd" sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
              <SortableContext items={categoryOrder} strategy={verticalListSortingStrategy}>
                <ol className="grid gap-2 sm:grid-cols-2">
                  {orderedCategories.map((category, index) => (
                    <SortableCategoryItem key={category.slug} category={category} position={index + 1} />
                  ))}
                </ol>
              </SortableContext>
            </DndContext>
          </Card>

          <Card title="Mes coups de cœur" description="Jusqu’à 5 adresses mises en avant par catégorie, avec votre mot.">
            <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100">
              {orderedCategories.map(category => {
                const categoryPois = pois.filter(poi => poi.category_id === category.id)
                if (categoryPois.length === 0) return null
                const selectedCount = categoryPois.filter(poi => selectedPoiIds.has(poi.id)).length

                return (
                  <details key={category.id} className="group">
                    <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 outline-none transition-colors hover:bg-gray-50/60 [&::-webkit-details-marker]:hidden">
                      <span className="flex items-center gap-3">
                        <span className="text-[13px] font-bold text-neutral-900">{category.name}</span>
                        {selectedCount > 0 && (
                          <span className="inline-flex h-5 items-center justify-center rounded-full bg-[#F4F7FE] px-2 text-[10px] font-bold text-[#0B1437]">
                            {selectedCount} / 5
                          </span>
                        )}
                      </span>
                      <ChevronDown className="h-4 w-4 text-gray-400 transition-transform group-open:rotate-180" />
                    </summary>
                    <div className="space-y-2 bg-gray-50/40 px-4 py-4">
                      {categoryPois.map(poi => {
                        const isSelected = selectedPoiIds.has(poi.id)
                        const featuredPoi = featuredByPoiId.get(poi.id)
                        const ownerNoteWordCount = countWords(featuredPoi?.owner_note ?? '')
                        const ownerNoteIsOverLimit = ownerNoteWordCount > OWNER_NOTE_MAX_WORDS
                        return (
                          <div
                            key={poi.id}
                            className={`rounded-xl border bg-white p-4 transition-colors ${
                              isSelected ? 'border-[#0B1437]/20 shadow-sm' : 'border-gray-100'
                            }`}
                          >
                            <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-neutral-900">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={event => toggleFeaturedPoi(poi.id, event.target.checked)}
                                className="h-4 w-4 accent-[#0B1437]"
                              />
                              {poi.name}
                            </label>
                            {featuredPoi && (
                              <div className="mt-4 border-t border-gray-100 pt-4">
                                <Label
                                  htmlFor={`owner-note-${poi.id}`}
                                  className="block text-[12px] font-semibold text-gray-600"
                                >
                                  Votre mot pour les voyageurs
                                </Label>
                                <Textarea
                                  id={`owner-note-${poi.id}`}
                                  value={featuredPoi.owner_note ?? ''}
                                  onChange={event => updateOwnerNote(poi.id, event.target.value)}
                                  placeholder="Pourquoi recommandez-vous cette adresse ?"
                                  className="mt-2 min-h-[88px] resize-none"
                                />
                                <p
                                  className={`mt-1.5 text-right text-[11px] font-medium ${
                                    ownerNoteIsOverLimit ? 'text-rose-500' : 'text-gray-400'
                                  }`}
                                >
                                  {ownerNoteWordCount} / {OWNER_NOTE_MAX_WORDS} mots
                                </p>
                              </div>
                            )}
                          </div>
                        )
                      })}
                    </div>
                  </details>
                )
              })}
            </div>
          </Card>

          <Card>
            <OtherCityRecommendations
              value={otherCityPois}
              onChange={setOtherCityPois}
              excludeCitySlug={citySlug}
            />
          </Card>
        </GuideSection>
      </div>

      {/* Spec 077 AC-04-02 : barre d'état fixe. */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-100 bg-white/95 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p role="status" aria-label="État de l’enregistrement" className={`flex items-center gap-2 text-[13px] font-semibold ${barTone}`}>
            {dirty && !clientValidationMessage && status !== 'error' ? <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" /> : null}
            {barMessage}
          </p>
          <div className="flex gap-2">
            <Link
              href={`/guide/${citySlug}?lodging=${lodgingId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-5 text-[13px] font-bold text-[#0B1437] shadow-sm transition-all hover:border-[#0B1437]/30 hover:bg-gray-50"
            >
              <ExternalLink size={14} aria-hidden="true" />
              Aperçu voyageur
            </Link>
            <button
              type="button"
              onClick={saveCustomization}
              disabled={saveDisabled}
              title={
                clientValidationMessage ?? (ownerNoteOverLimit
                  ? `Commentaire limité à ${OWNER_NOTE_MAX_WORDS} mots`
                  : undefined)
              }
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0B1437] px-6 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-gray-900 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={14} aria-hidden="true" />
              {status === 'saving' ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
