'use client'

import { useState } from 'react'
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
import { GripVertical, Save } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/components/ui/card'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { Input } from '@/shared/components/ui/input'
import { MarkdownText } from '@/shared/components/MarkdownText'
import type {
  FeaturedPoiInput,
  LodgingCustomizationResponse,
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
      className="flex items-center gap-3 rounded-lg border bg-background px-3 py-2 text-sm"
    >
      <button
        type="button"
        className="cursor-grab text-muted-foreground active:cursor-grabbing"
        aria-label={`Deplacer ${category.name}`}
        {...attributes}
        {...listeners}
      >
        <GripVertical className="h-4 w-4" />
      </button>
      <span>{category.name}</span>
    </li>
  )
}

export function CustomizationForm({
  lodgingId,
  citySlug,
  categories,
  pois,
  initialCustomization,
}: Props) {
  const [welcomeMessage, setWelcomeMessage] = useState(initialCustomization.welcome_message ?? '')
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
      .map(featuredPoi => ({
        poi_id: featuredPoi.poi_id,
        owner_note: featuredPoi.owner_note,
        sort_order: featuredPoi.sort_order,
      }))
      .sort((a, b) => a.sort_order - b.sort_order),
  )
  const [practicalInfo, setPracticalInfo] = useState<PracticalInfoFields>(() => ({
    cover_photo_url: initialCustomization.cover_photo_url ?? null,
    lodging_address: initialCustomization.lodging_address ?? null,
    wifi_ssid: initialCustomization.wifi_ssid ?? null,
    wifi_password: initialCustomization.wifi_password ?? null,
    parking_info: initialCustomization.parking_info ?? null,
    equipment_info: initialCustomization.equipment_info ?? null,
    checkout_instructions: initialCustomization.checkout_instructions ?? null,
    trash_info: initialCustomization.trash_info ?? null,
    trash_location: initialCustomization.trash_location ?? null,
    house_rules: initialCustomization.house_rules ?? null,
    emergency_contacts: initialCustomization.emergency_contacts ?? null,
    useful_services: initialCustomization.useful_services ?? null,
  }))
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
  const featuredByPoiId = new Map(featuredPois.map(featuredPoi => [featuredPoi.poi_id, featuredPoi]))
  const selectedPoiIds = new Set(featuredPois.map(featuredPoi => featuredPoi.poi_id))

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
        featured_pois: featuredPois.map((featuredPoi, index) => ({
          poi_id: featuredPoi.poi_id,
          owner_note: featuredPoi.owner_note?.trim() || null,
          sort_order: index,
        })),
        ...practicalPayload,
      }),
    })

    if (!response.ok) {
      const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null
      setStatus('error')
      setMessage(payload?.error?.message ?? 'Sauvegarde impossible.')
      return
    }

    const payload = await response.json() as LodgingCustomizationResponse
    setWelcomeMessage(payload.welcome_message ?? '')
    setCategoryOrder(payload.category_order.length > 0 ? payload.category_order : categoryOrder)
    setFeaturedPois(payload.featured_pois.map(featuredPoi => ({
      poi_id: featuredPoi.poi_id,
      owner_note: featuredPoi.owner_note,
      sort_order: featuredPoi.sort_order,
    })))
    setPracticalInfo({
      cover_photo_url: payload.cover_photo_url ?? null,
      lodging_address: payload.lodging_address ?? null,
      wifi_ssid: payload.wifi_ssid ?? null,
      wifi_password: payload.wifi_password ?? null,
      parking_info: payload.parking_info ?? null,
      equipment_info: payload.equipment_info ?? null,
      checkout_instructions: payload.checkout_instructions ?? null,
      trash_info: payload.trash_info ?? null,
      trash_location: payload.trash_location ?? null,
      house_rules: payload.house_rules ?? null,
      emergency_contacts: payload.emergency_contacts ?? null,
      useful_services: payload.useful_services ?? null,
    })
    setStatus('saved')
    setMessage(
      payload.ignored_category_slugs.length > 0
        ? `Sauvegarde effectuee. Slugs ignores: ${payload.ignored_category_slugs.join(', ')}.`
        : 'Personnalisation sauvegardee.',
    )
  }

  return (
    <div className="space-y-6 pb-24">
      <Card>
        <CardHeader>
          <CardTitle>Message d'accueil</CardTitle>
          <CardDescription>Affiche sur le guide public personnalise de ce logement.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <Label htmlFor="welcome-message">Message</Label>
          <Textarea
            id="welcome-message"
            maxLength={300}
            value={welcomeMessage}
            onChange={event => setWelcomeMessage(event.target.value)}
            placeholder="Bienvenue, voici nos recommandations locales..."
          />
          <p className="text-right text-xs text-muted-foreground">{welcomeMessage.length}/300</p>
        </CardContent>
      </Card>

      <PracticalInfoCard practicalInfo={practicalInfo} setPracticalField={setPracticalField} />

      <Card>
        <CardHeader>
          <CardTitle>Ordre des categories</CardTitle>
          <CardDescription>Glissez les categories pour definir leur ordre dans le guide.</CardDescription>
        </CardHeader>
        <CardContent>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
            <SortableContext items={categoryOrder} strategy={verticalListSortingStrategy}>
              <ol className="space-y-2">
                {orderedCategories.map(category => (
                  <SortableCategoryItem key={category.slug} category={category} />
                ))}
              </ol>
            </SortableContext>
          </DndContext>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Mes recommandations</CardTitle>
          <CardDescription>Maximum 5 POI mis en avant par categorie, avec note personnelle optionnelle.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {orderedCategories.map(category => {
            const categoryPois = pois.filter(poi => poi.category_id === category.id)
            if (categoryPois.length === 0) return null

            return (
              <details key={category.id} className="rounded-lg border bg-background px-3 py-2">
                <summary className="cursor-pointer text-sm font-medium">{category.name}</summary>
                <div className="mt-3 space-y-3">
                  {categoryPois.map(poi => {
                    const featuredPoi = featuredByPoiId.get(poi.id)
                    return (
                      <div key={poi.id} className="rounded-md border border-muted px-3 py-2">
                        <label className="flex items-center gap-2 text-sm">
                          <input
                            type="checkbox"
                            checked={selectedPoiIds.has(poi.id)}
                            onChange={event => toggleFeaturedPoi(poi.id, event.target.checked)}
                          />
                          {poi.name}
                        </label>
                        {featuredPoi && (
                          <Textarea
                            className="mt-2 min-h-[64px]"
                            maxLength={150}
                            value={featuredPoi.owner_note ?? ''}
                            onChange={event => updateOwnerNote(poi.id, event.target.value)}
                            placeholder="Pourquoi recommander cette adresse ?"
                          />
                        )}
                      </div>
                    )
                  })}
                </div>
              </details>
            )
          })}
        </CardContent>
      </Card>

      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-background/95 p-4 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="text-sm text-muted-foreground">
            {message ?? 'Les changements sont appliques uniquement a ce logement.'}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" asChild>
              <Link href={`/guide/${citySlug}?lodging=${lodgingId}`} target="_blank">
                Voir le guide comme un Tourist
              </Link>
            </Button>
            <Button onClick={saveCustomization} disabled={status === 'saving'} className="gap-2">
              <Save className="h-4 w-4" />
              {status === 'saving' ? 'Sauvegarde...' : 'Sauvegarder'}
            </Button>
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
    key: 'parking_info',
    label: 'Parking',
    placeholder: 'Place numéro 12 dans la cour intérieure, code portail 1234.',
    type: 'textarea',
    maxLength: 2000,
    rows: 3,
    markdown: true,
  },
  {
    key: 'equipment_info',
    label: 'Fonctionnement des équipements',
    placeholder: 'Chauffage : thermostat à droite de la cheminée…\nTV : télécommande grise, source HDMI 1…',
    type: 'textarea',
    maxLength: 4000,
    rows: 5,
    markdown: true,
  },
  {
    key: 'checkout_instructions',
    label: 'Consignes de départ',
    placeholder: 'Merci de vider le frigo, lancer le lave-vaisselle, fermer les volets et déposer les clés dans la boîte à l’entrée.',
    type: 'textarea',
    maxLength: 4000,
    rows: 4,
    markdown: true,
  },
  {
    key: 'trash_info',
    label: 'Poubelles',
    placeholder: 'Tri sélectif : conteneurs bleu/jaune au bout de la rue.\nRamassage ordures ménagères : mardi et vendredi matin.',
    type: 'textarea',
    maxLength: 2000,
    rows: 3,
    markdown: true,
  },
  {
    key: 'trash_location',
    label: 'Localisation du point de tri (adresse ou lien Google Maps)',
    placeholder: '12 rue des Alpages, Saint-Gervais — ou https://maps.app.goo.gl/abcd',
    type: 'input',
    maxLength: 500,
  },
  {
    key: 'house_rules',
    label: 'Règlement intérieur',
    placeholder: 'Non-fumeur. Animaux acceptés sur demande. Soirées calmes après 22h.',
    type: 'textarea',
    maxLength: 4000,
    rows: 4,
    markdown: true,
  },
  {
    key: 'emergency_contacts',
    label: 'Urgences',
    placeholder: 'Pompiers : 18\nSAMU : 15\nGendarmerie Saint-Gervais : 04 50 47 75 49\nProprietaire : 06 12 34 56 78',
    type: 'textarea',
    maxLength: 2000,
    rows: 4,
    markdown: true,
  },
  {
    key: 'useful_services',
    label: 'Services utiles',
    placeholder: 'Boulangerie du village (50m).\nMédecin de garde : 39 66.\nLocation skis : Sport 2000 (200m).',
    type: 'textarea',
    maxLength: 4000,
    rows: 4,
    markdown: true,
  },
]

function PracticalInfoCard({
  practicalInfo,
  setPracticalField,
}: {
  practicalInfo: PracticalInfoFields
  setPracticalField: <K extends keyof PracticalInfoFields>(key: K, value: string) => void
}) {
  const [previewKey, setPreviewKey] = useState<keyof PracticalInfoFields | null>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle>Infos pratiques</CardTitle>
        <CardDescription>
          Renseignements affichés sur le guide du voyageur. Markdown supporté pour les champs longs
          (**gras**, listes, [liens](url)).
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">

        {/* Photo du logement : URL + miniature aperçu, affichée en hero sur la home voyageur */}
        <div className="space-y-2 rounded-xl border border-slate-100 bg-slate-50/40 p-4">
          <div className="flex items-center justify-between gap-3">
            <Label htmlFor="practical-cover_photo_url">Photo du logement (URL)</Label>
            <span className="text-[11px] text-slate-400">Hero sur la home voyageur</span>
          </div>
          <Input
            id="practical-cover_photo_url"
            type="url"
            value={practicalInfo.cover_photo_url ?? ''}
            maxLength={1000}
            placeholder="https://exemple.com/ma-photo.jpg"
            onChange={event => setPracticalField('cover_photo_url', event.target.value)}
          />
          {practicalInfo.cover_photo_url && practicalInfo.cover_photo_url.trim() !== '' && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={practicalInfo.cover_photo_url}
              alt="Aperçu photo du logement"
              referrerPolicy="no-referrer"
              className="h-40 w-full rounded-lg object-cover"
            />
          )}
          <p className="text-[11px] text-slate-400">
            URL d&apos;une image (.jpg, .png, .webp). L&apos;upload natif arrivera plus tard.
          </p>
        </div>

        {PRACTICAL_SECTIONS.map(section => {
          const value = practicalInfo[section.key] ?? ''
          const isPreviewing = previewKey === section.key
          return (
            <div key={section.key} className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor={`practical-${section.key}`}>{section.label}</Label>
                {section.markdown && value.trim() !== '' && (
                  <button
                    type="button"
                    onClick={() => setPreviewKey(isPreviewing ? null : section.key)}
                    className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-700"
                  >
                    {isPreviewing ? 'Masquer aperçu' : 'Aperçu'}
                  </button>
                )}
              </div>
              {section.type === 'input' ? (
                <Input
                  id={`practical-${section.key}`}
                  value={value}
                  maxLength={section.maxLength}
                  placeholder={section.placeholder}
                  onChange={event => setPracticalField(section.key, event.target.value)}
                />
              ) : (
                <Textarea
                  id={`practical-${section.key}`}
                  rows={section.rows}
                  maxLength={section.maxLength}
                  value={value}
                  placeholder={section.placeholder}
                  onChange={event => setPracticalField(section.key, event.target.value)}
                />
              )}
              {isPreviewing && (
                <div className="rounded-lg border border-indigo-100 bg-indigo-50/40 p-3">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                    Aperçu Markdown
                  </p>
                  <MarkdownText source={value} className="text-sm leading-relaxed text-slate-700" />
                </div>
              )}
              <p className="text-right text-xs text-muted-foreground">
                {value.length}/{section.maxLength}
              </p>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
