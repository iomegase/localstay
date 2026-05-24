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
import type {
  FeaturedPoiInput,
  LodgingCustomizationResponse,
} from '../types'

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
  const [status, setStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [message, setMessage] = useState<string | null>(null)

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
