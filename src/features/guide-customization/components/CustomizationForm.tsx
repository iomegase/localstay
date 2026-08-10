'use client'

import { Fragment, useState } from 'react'
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
import { GripVertical, Save, ChevronDown } from 'lucide-react'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Input } from '@/shared/components/ui/input'
import { MarkdownText } from '@/shared/components/MarkdownText'
import { MarkdownHint } from '@/shared/components/MarkdownHint'
import { ImageUpload } from '@/shared/components/ImageUpload'
import {
  countWords,
  normalizeOwnerNote,
  OWNER_NOTE_MAX_WORDS,
  WELCOME_MESSAGE_MAX_WORDS,
} from '../lib/validation'
import { PracticalBlocksEditor } from '@/features/guide-customization/components/PracticalBlocksEditor'
import { ArrivalInstructionsEditor } from '@/features/guide-customization/components/ArrivalInstructionsEditor'
import type { ArrivalInstructionInput } from '@/features/guide-customization/types'
import { TrashBinsEditor } from '@/features/guide-customization/components/TrashBinsEditor'
import type { TrashBinInput } from '@/features/guide-customization/lib/trash-bins'
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
  welcome_message: "Message d'accueil",
  category_order: 'Ordre des catégories',
  featured_pois: 'Recommandations',
  cover_photo_url: 'Photo du logement',
  presentation_video_url: 'Vidéo de présentation',
  lodging_address: 'Adresse du logement',
  wifi_ssid: 'Wi-Fi - nom du réseau',
  wifi_password: 'Wi-Fi - mot de passe',
  checkout_instructions: 'Consignes de départ',
  trash_info: 'Déchets',
  trash_location: 'Point de tri',
  house_rules: 'Règlement intérieur',
  emergency_contacts: 'Urgences',
  useful_services: 'Services utiles',
  practical_blocks: 'Blocs personnalisés',
  trash_bins: 'Poubelles',
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

function SortableCategoryItem({ category }: { category: CategoryOption }) {
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
      className="group flex items-center gap-4 border-b border-gray-50 bg-white px-6 py-4 text-sm transition-colors hover:bg-gray-50/50 last:border-0"
    >
      <button
        type="button"
        className="flex h-8 w-8 cursor-grab items-center justify-center rounded-lg bg-[#F4F7FE] text-[#0B1437] transition-colors hover:bg-[#0B1437] hover:text-white active:cursor-grabbing"
        aria-label={`Déplacer ${category.name}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="text-[13px] font-bold text-neutral-900">{category.name}</span>
    </li>
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
  const [welcomeMessage, setWelcomeMessage] = useState(initialCustomization.welcome_message ?? '')
  const welcomeWordCount = countWords(welcomeMessage)
  const welcomeOverLimit = welcomeWordCount > WELCOME_MESSAGE_MAX_WORDS
  const [welcomePreview, setWelcomePreview] = useState(false)
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
  const [practicalInfo, setPracticalInfo] = useState<PracticalInfoFields>(() => ({
    cover_photo_url: initialCustomization.cover_photo_url ?? null,
    presentation_video_url: initialCustomization.presentation_video_url ?? null,
    lodging_address: initialCustomization.lodging_address ?? null,
    wifi_ssid: initialCustomization.wifi_ssid ?? null,
    wifi_password: initialCustomization.wifi_password ?? null,
    checkout_instructions: initialCustomization.checkout_instructions ?? null,
    trash_info: initialCustomization.trash_info ?? null,
    trash_location: initialCustomization.trash_location ?? null,
    house_rules: initialCustomization.house_rules ?? null,
    emergency_contacts: initialCustomization.emergency_contacts ?? null,
    useful_services: initialCustomization.useful_services ?? null,
  }))
  const [practicalBlocks, setPracticalBlocks] = useState<PracticalBlockInput[]>(
    initialCustomization.practical_blocks ?? [],
  )
  const [arrivalInstructions, setArrivalInstructions] = useState<ArrivalInstructionInput[]>(
    initialCustomization.arrival_instructions ?? [],
  )
  const [trashBins, setTrashBins] = useState<TrashBinInput[]>(
    initialCustomization.trash_bins ?? [],
  )
  const [otherCityPois, setOtherCityPois] = useState<OtherCityPoiSelection[]>(initialOtherCityPois)
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

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
    welcomeOverLimit ||
    ownerNoteOverLimit ||
    clientValidationMessage !== null

  // Règle métier inchangée
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

  // Règle métier inchangée
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
        welcome_message: welcomeMessage.trim() === '' ? null : welcomeMessage.trim(),
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
        trash_bins: trashBins,
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
    setWelcomeMessage(payload.welcome_message ?? '')
    setCategoryOrder(payload.category_order.length > 0 ? payload.category_order : categoryOrder)
    const otherCityPoiIds = new Set(otherCityPois.map(poi => poi.poi_id))
    const savedByPoiId = new Map(
      payload.featured_pois.map(featuredPoi => [featuredPoi.poi_id, featuredPoi]),
    )
    setFeaturedPois(
      payload.featured_pois
        .filter(featuredPoi => !otherCityPoiIds.has(featuredPoi.poi_id))
        .map(featuredPoi => ({
          poi_id: featuredPoi.poi_id,
          owner_note: featuredPoi.owner_note,
          sort_order: featuredPoi.sort_order,
        })),
    )
    setOtherCityPois(current => current.map(poi => ({
      ...poi,
      owner_note: savedByPoiId.get(poi.poi_id)?.owner_note ?? null,
    })))
    setPracticalInfo({
      cover_photo_url: payload.cover_photo_url ?? null,
      presentation_video_url: payload.presentation_video_url ?? null,
      lodging_address: payload.lodging_address ?? null,
      wifi_ssid: payload.wifi_ssid ?? null,
      wifi_password: payload.wifi_password ?? null,
      checkout_instructions: payload.checkout_instructions ?? null,
      trash_info: payload.trash_info ?? null,
      trash_location: payload.trash_location ?? null,
      house_rules: payload.house_rules ?? null,
      emergency_contacts: payload.emergency_contacts ?? null,
      useful_services: payload.useful_services ?? null,
    })
    setPracticalBlocks(payload.practical_blocks ?? [])
    setArrivalInstructions(payload.arrival_instructions ?? [])
    setTrashBins(payload.trash_bins ?? [])
    setStatus('saved')
    setMessage(
      payload.ignored_category_slugs.length > 0
        ? `Sauvegarde effectuée. Slugs ignorés: ${payload.ignored_category_slugs.join(', ')}.`
        : 'Personnalisation sauvegardée.',
    )
  }

  return (
    <div className="space-y-6 pb-32">
      {/* Aide markdown globale : explique la mise en forme aux owners */}
      <MarkdownHint />

      {/* 1. Message d'accueil */}
      <section className="overflow-hidden rounded-[25px] border border-gray-50 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            Accueil voyageur
          </p>
          <h2 className="mt-1 text-base font-bold text-neutral-900">Message d&apos;accueil</h2>
          <p className="mt-1 text-xs text-gray-500">
            Affiché en haut du guide public personnalisé de ce logement.
          </p>
        </div>
        <div className="p-6">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="welcome-message" className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                Message
              </Label>
              {welcomeMessage.trim() !== '' && (
                <button
                  type="button"
                  onClick={() => setWelcomePreview(previewing => !previewing)}
                  className="inline-flex h-7 items-center rounded-lg bg-[#F4F7FE] px-2.5 text-[10px] font-bold uppercase tracking-widest text-[#0B1437] transition-colors hover:bg-[#0B1437] hover:text-white"
                >
                  {welcomePreview ? 'Masquer' : 'Aperçu'}
                </button>
              )}
            </div>
            <div className="group relative">
              <Textarea
                id="welcome-message"
                maxLength={5000}
                value={welcomeMessage}
                onChange={event => setWelcomeMessage(event.target.value)}
                placeholder="Bienvenue, voici nos recommandations locales..."
                className="peer min-h-[100px] w-full resize-none rounded-none border-0 border-b-2 border-gray-200 bg-white px-0 py-2.5 text-sm text-neutral-900 placeholder-gray-300 shadow-none transition-colors focus-visible:outline-none focus-visible:ring-0"
              />
              <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#0B1437] transition-all duration-300 ease-out group-hover:w-full peer-focus:w-full" />
            </div>
            {welcomePreview && (
              <div className="mt-3 rounded-[18px] border border-[#0B1437]/15 bg-[#F4F7FE]/40 p-4">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#0B1437]">Aperçu Markdown</p>
                <MarkdownText source={welcomeMessage} breaks className="text-sm leading-relaxed text-neutral-900" />
              </div>
            )}
            <p className={`text-right text-[11px] font-medium ${welcomeOverLimit ? 'text-rose-500' : 'text-gray-400'}`}>
              {welcomeWordCount} / {WELCOME_MESSAGE_MAX_WORDS} mots
            </p>
          </div>
        </div>
      </section>

      {/* 2. Infos Pratiques (Sous-composant refondu plus bas) */}
      <PracticalInfoCard lodgingId={lodgingId} practicalInfo={practicalInfo} setPracticalField={setPracticalField} trashBins={trashBins} setTrashBins={setTrashBins} />

      {/* 2b. Blocs personnalisés « Infos pratiques » */}
      <section className="overflow-hidden rounded-[25px] border border-gray-50 bg-white p-6 shadow-sm">
        <PracticalBlocksEditor value={practicalBlocks} onChange={setPracticalBlocks} lodgingId={lodgingId} />
      </section>

      {/* 2c. Instructions d'arrivée (texte + photos + vidéo) */}
      <section className="overflow-hidden rounded-[25px] border border-gray-50 bg-white p-6 shadow-sm">
        <ArrivalInstructionsEditor value={arrivalInstructions} onChange={setArrivalInstructions} lodgingId={lodgingId} />
      </section>

      {/* 2c. Recommandations dans d'autres villes */}
      <section className="overflow-hidden rounded-[25px] border border-gray-50 bg-white p-6 shadow-sm">
        <OtherCityRecommendations
          value={otherCityPois}
          onChange={setOtherCityPois}
          excludeCitySlug={citySlug}
        />
      </section>

      {/* 3. Ordre des catégories */}
      <section className="overflow-hidden rounded-[25px] border border-gray-50 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            Mise en page
          </p>
          <h2 className="mt-1 text-base font-bold text-neutral-900">Ordre des catégories</h2>
          <p className="mt-1 text-xs text-gray-500">
            Glissez les catégories pour définir leur ordre dans le guide.
          </p>
        </div>
        {/* id stable : sinon @dnd-kit génère des ids d'accessibilité non déterministes
            (DndDescribedBy-N) qui diffèrent entre SSR et client → mismatch d'hydratation. */}
        <DndContext id="category-order-dnd" sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={categoryOrder} strategy={verticalListSortingStrategy}>
            <ol className="flex flex-col">
              {orderedCategories.map(category => (
                <SortableCategoryItem key={category.slug} category={category} />
              ))}
            </ol>
          </SortableContext>
        </DndContext>
      </section>

      {/* 4. Mes recommandations (POIs) */}
      <section className="overflow-hidden rounded-[25px] border border-gray-50 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-6">
          <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
            Coups de cœur
          </p>
          <h2 className="mt-1 text-base font-bold text-neutral-900">Mes recommandations</h2>
          <p className="mt-1 text-xs text-gray-500">
            Maximum 5 POI mis en avant par catégorie.
          </p>
        </div>
        <div className="divide-y divide-gray-50">
          {orderedCategories.map(category => {
            const categoryPois = pois.filter(poi => poi.category_id === category.id)
            if (categoryPois.length === 0) return null
            const selectedCount = categoryPois.filter(poi => selectedPoiIds.has(poi.id)).length

            return (
              <details key={category.id} className="group">
                <summary className="flex cursor-pointer list-none items-center justify-between px-6 py-4 outline-none transition-colors hover:bg-gray-50/50 [&::-webkit-details-marker]:hidden">
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
                <div className="space-y-3 bg-gray-50/30 px-6 py-5">
                  {categoryPois.map(poi => {
                    const isSelected = selectedPoiIds.has(poi.id)
                    const featuredPoi = featuredByPoiId.get(poi.id)
                    const ownerNoteWordCount = countWords(featuredPoi?.owner_note ?? '')
                    const ownerNoteIsOverLimit = ownerNoteWordCount > OWNER_NOTE_MAX_WORDS
                    return (
                      <div
                        key={poi.id}
                        className={`rounded-[18px] border bg-white p-5 transition-colors ${
                          isSelected ? 'border-[#0B1437]/15 shadow-sm' : 'border-gray-100'
                        }`}
                      >
                        <label className="flex cursor-pointer items-center gap-3 text-sm font-bold text-neutral-900">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={event => toggleFeaturedPoi(poi.id, event.target.checked)}
                            className="h-4 w-4 accent-[#0B1437]"
                          />
                          {poi.name}
                        </label>
                        {featuredPoi && (
                          <div className="mt-5 border-t border-gray-100 pt-5">
                            <Label
                              htmlFor={`owner-note-${poi.id}`}
                              className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400"
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
                              className={`mt-2 text-right text-[11px] font-medium ${
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
      </section>

      {/* 5. Barre d'action fixe en bas */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-gray-100 bg-white/95 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.05)] backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-[12px] text-gray-500">
            {clientValidationMessage || message ? (
              <span className={clientValidationMessage || status === 'error' ? 'font-semibold text-rose-500' : 'font-semibold text-emerald-600'}>
                {clientValidationMessage ?? message}
              </span>
            ) : (
              'Les changements sont appliqués uniquement à ce logement.'
            )}
          </div>
          <div className="flex gap-2">
            <Link
              href={`/guide/${citySlug}?lodging=${lodgingId}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-6 text-[13px] font-bold text-[#0B1437] shadow-sm transition-all hover:border-[#0B1437]/30 hover:bg-gray-50"
            >
              Aperçu
            </Link>
            <button
              type="button"
              onClick={saveCustomization}
              disabled={saveDisabled}
              title={
                clientValidationMessage ?? (welcomeOverLimit
                  ? `Message d'accueil limité à ${WELCOME_MESSAGE_MAX_WORDS} mots`
                  : ownerNoteOverLimit
                    ? `Commentaire limité à ${OWNER_NOTE_MAX_WORDS} mots`
                    : undefined)
              }
              className="group inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[#0B1437] px-6 text-[13px] font-bold text-white shadow-sm transition-all hover:bg-gray-900 hover:shadow-md disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Save size={14} className="transition-transform duration-300 group-hover:scale-110" />
              {status === 'saving' ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

type PracticalSection = {
  key: keyof PracticalInfoFields
  label: string
  placeholder: string
  type: 'input' | 'textarea'
  maxLength: number
  rows?: number
  markdown?: boolean
}

const PRACTICAL_SECTIONS: PracticalSection[] = [
  {
    key: 'lodging_address',
    label: 'Adresse du logement',
    placeholder: '12 rue des Alpages, 74170 Saint-Gervais-les-Bains',
    type: 'input',
    maxLength: 255,
  },
  {
    key: 'wifi_ssid',
    label: 'Wi-Fi — Nom du réseau (SSID)',
    placeholder: 'Chalet-StGervais',
    type: 'input',
    maxLength: 120,
  },
  {
    key: 'wifi_password',
    label: 'Wi-Fi — Mot de passe',
    placeholder: 'mon-mot-de-passe-wifi',
    type: 'input',
    maxLength: 120,
  },
  {
    key: 'trash_location',
    label: 'Localisation du point de tri (adresse ou lien Google Maps)',
    placeholder: '12 rue des Alpages, Saint-Gervais — ou https://maps.app.goo.gl/abcd',
    type: 'input',
    maxLength: 500,
  },
  // « Urgences » est désormais une carte en dur côté guide (aucune saisie).
  // Les « Numéros utiles » (ex-`useful_services`) sont édités via
  // UsefulNumbersEditor, hors de cette liste de champs texte.
]

function PracticalInfoCard({
  lodgingId,
  practicalInfo,
  setPracticalField,
  trashBins,
  setTrashBins,
}: {
  lodgingId: string
  practicalInfo: PracticalInfoFields
  setPracticalField: <K extends keyof PracticalInfoFields>(key: K, value: string) => void
  trashBins: TrashBinInput[]
  setTrashBins: (next: TrashBinInput[]) => void
}) {
  const [previewKey, setPreviewKey] = useState<keyof PracticalInfoFields | null>(null)

  return (
    <section className="overflow-hidden rounded-[25px] border border-gray-50 bg-white shadow-sm">
      <div className="border-b border-gray-100 p-6">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">
          Pratique
        </p>
        <h2 className="mt-1 text-base font-bold text-neutral-900">Infos pratiques</h2>
        <p className="mt-1 text-xs text-gray-500">
          Renseignements affichés sur le guide du voyageur. Markdown supporté pour les champs longs (**gras**, listes, [liens](url)).
        </p>
      </div>

      <div className="space-y-8 p-6">
        {/* Photo du logement */}
        <div className="space-y-3">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
            <Label htmlFor="practical-cover_photo_url" className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              Photo du logement (URL)
            </Label>
            <span className="text-[10px] uppercase tracking-widest text-gray-300">Hero sur la home voyageur</span>
          </div>

          <div className="group relative">
            <Input
              id="practical-cover_photo_url"
              type="url"
              value={practicalInfo.cover_photo_url ?? ''}
              maxLength={1000}
              placeholder="https://exemple.com/ma-photo.jpg"
              onChange={event => setPracticalField('cover_photo_url', event.target.value)}
              className="peer w-full rounded-none border-0 border-b-2 border-gray-200 bg-white px-0 py-2.5 text-sm text-neutral-900 placeholder-gray-300 shadow-none transition-colors focus-visible:outline-none focus-visible:ring-0"
            />
            <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#0B1437] transition-all duration-300 ease-out group-hover:w-full peer-focus:w-full" />
          </div>

          {/* Upload natif (en plus de l'URL) : convertit png/jpeg → webp côté serveur */}
          <ImageUpload
            endpoint={`/api/dashboard/lodgings/${lodgingId}/cover-photo`}
            onUploaded={url => setPracticalField('cover_photo_url', url)}
            label="Téléverser une photo"
          />

          {practicalInfo.cover_photo_url && practicalInfo.cover_photo_url.trim() !== '' && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={practicalInfo.cover_photo_url}
              alt="Aperçu photo du logement"
              referrerPolicy="no-referrer"
              className="h-48 w-full rounded-[18px] border border-gray-100 object-cover shadow-sm"
            />
          )}
          <p className="text-[10px] uppercase tracking-widest text-gray-300">
            Collez une URL d&apos;image, ou téléversez un fichier (PNG, JPEG, WebP, AVIF).
          </p>

          <YouTubeUrlField
            id="practical-presentation_video_url"
            label="Vidéo de présentation (lien YouTube)"
            value={practicalInfo.presentation_video_url}
            onChange={url => setPracticalField('presentation_video_url', url ?? '')}
          />
        </div>

        {PRACTICAL_SECTIONS.map(section => {
          const value = practicalInfo[section.key] ?? ''
          const isPreviewing = previewKey === section.key
          return (
            <Fragment key={section.key}>
            {section.key === 'trash_location' && (
              <div className="pt-2">
                <TrashBinsEditor value={trashBins} onChange={setTrashBins} />
              </div>
            )}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor={`practical-${section.key}`} className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                  {section.label}
                </Label>
                {section.markdown && value.trim() !== '' && (
                  <button
                    type="button"
                    onClick={() => setPreviewKey(isPreviewing ? null : section.key)}
                    className="inline-flex h-7 items-center rounded-lg bg-[#F4F7FE] px-2.5 text-[10px] font-bold uppercase tracking-widest text-[#0B1437] transition-colors hover:bg-[#0B1437] hover:text-white"
                  >
                    {isPreviewing ? 'Masquer' : 'Aperçu'}
                  </button>
                )}
              </div>

              <div className="group relative">
                {section.type === 'input' ? (
                  <Input
                    id={`practical-${section.key}`}
                    value={value}
                    maxLength={section.maxLength}
                    placeholder={section.placeholder}
                    onChange={event => setPracticalField(section.key, event.target.value)}
                    className="peer w-full rounded-none border-0 border-b-2 border-gray-200 bg-white px-0 py-2.5 text-sm text-neutral-900 placeholder-gray-300 shadow-none transition-colors focus-visible:outline-none focus-visible:ring-0"
                  />
                ) : (
                  <Textarea
                    id={`practical-${section.key}`}
                    rows={section.rows}
                    maxLength={section.maxLength}
                    value={value}
                    placeholder={section.placeholder}
                    onChange={event => setPracticalField(section.key, event.target.value)}
                    className="peer w-full resize-none rounded-none border-0 border-b-2 border-gray-200 bg-white px-0 py-2.5 text-sm text-neutral-900 placeholder-gray-300 shadow-none transition-colors focus-visible:outline-none focus-visible:ring-0"
                  />
                )}
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-[#0B1437] transition-all duration-300 ease-out group-hover:w-full peer-focus:w-full" />
              </div>

              {isPreviewing && (
                <div className="mt-3 rounded-[18px] border border-[#0B1437]/15 bg-[#F4F7FE]/40 p-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-[#0B1437]">
                    Aperçu Markdown
                  </p>
                  <MarkdownText source={value} className="text-sm leading-relaxed text-neutral-900" />
                </div>
              )}

              <p className="text-right text-[11px] font-medium text-gray-400">
                {value.length}/{section.maxLength}
              </p>
            </div>
            </Fragment>
          )
        })}

        <UsefulNumbersEditor
          value={practicalInfo.useful_services}
          onChange={value => setPracticalField('useful_services', value)}
        />
      </div>
    </section>
  )
}
