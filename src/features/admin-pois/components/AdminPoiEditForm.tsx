"use client"

import { FormEvent, ReactNode, useId, useState, useTransition } from 'react'
import { Info, MapPin, Tag as TagIcon, Image as ImageIcon, Map, Building2, CheckCircle2, Trash2, Star, Plus, GripVertical } from 'lucide-react'
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
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import type { AdminPoiCategory, AdminPoiDetail } from '../types'
import { TrailGpxUploader } from './TrailGpxUploader'
import { MarkdownText } from '@/shared/components/MarkdownText'
import { ImageUpload } from '@/shared/components/ImageUpload'

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
  const dndSensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const dndContextId = useId()
  const [photoUrlError, setPhotoUrlError] = useState<string | null>(null)
  const [descriptionValue, setDescriptionValue] = useState(poi.description ?? '')
  const [showDescriptionPreview, setShowDescriptionPreview] = useState(false)

  // Données rando : seules les valeurs manquantes deviennent éditables (le reste du tracé
  // reste piloté par le GPX). On envoie les saisies dans un patch dédié `trail_metrics`.
  const trail = poi.trail_detail
  const trailMissing = {
    difficulty: Boolean(trail) && trail!.difficulty === 'unknown',
    distance_km: Boolean(trail) && trail!.distance_km === null,
    elevation_gain_m: Boolean(trail) && trail!.elevation_gain_m === null,
    estimated_duration_min: Boolean(trail) && trail!.estimated_duration_min === null,
  }
  const [trailEdits, setTrailEdits] = useState({
    difficulty: '',
    distance_km: '',
    elevation_gain_m: '',
    estimated_duration_min: '',
  })

  function reorderPhotos(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    setPhotos(current => {
      const oldIndex = current.indexOf(String(active.id))
      const newIndex = current.indexOf(String(over.id))
      if (oldIndex === -1 || newIndex === -1) return current
      return arrayMove(current, oldIndex, newIndex)
    })
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setMessage(null)
    const formData = new FormData(event.currentTarget)
    const trailMetrics: Record<string, number | string> = {}
    if (trail) {
      if (trailMissing.distance_km && trailEdits.distance_km.trim() !== '') {
        trailMetrics.distance_km = Number(trailEdits.distance_km)
      }
      if (trailMissing.elevation_gain_m && trailEdits.elevation_gain_m.trim() !== '') {
        trailMetrics.elevation_gain_m = Number(trailEdits.elevation_gain_m)
      }
      if (trailMissing.estimated_duration_min && trailEdits.estimated_duration_min.trim() !== '') {
        trailMetrics.estimated_duration_min = Number(trailEdits.estimated_duration_min)
      }
      if (trailMissing.difficulty && trailEdits.difficulty !== '') {
        trailMetrics.difficulty = trailEdits.difficulty
      }
    }
    const payload = {
      name: String(formData.get('name') ?? ''),
      description: descriptionValue,
      address: String(formData.get('address') ?? ''),
      phone: nullableString(formData.get('phone')),
      website: nullableString(formData.get('website')),
      category_id: String(formData.get('category_id') ?? ''),
      subcategory_id: nullableString(formData.get('subcategory_id')),
      tags: splitLines(String(formData.get('tags') ?? '')),
      photos,
      is_active: formData.get('is_active') === 'true',
      force_geocode: forceGeocode,
      ...(Object.keys(trailMetrics).length > 0 ? { trail_metrics: trailMetrics } : {}),
    }

    startTransition(async () => {
      const response = await fetch(`/api/admin/pois/${poi.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await response.json().catch(() => null) as {
        error?: {
          message?: string
          details?: {
            fieldErrors?: Record<string, string[]>
            formErrors?: string[]
          }
        }
      } | null
      if (!response.ok) {
        const fieldErrors = json?.error?.details?.fieldErrors ?? {}
        const fieldsWithErrors = Object.entries(fieldErrors)
          .filter(([, errs]) => Array.isArray(errs) && errs.length > 0)
          .map(([field, errs]) => `${field} — ${errs!.join(', ')}`)
          .join(' · ')
        const generic = json?.error?.message ?? 'Enregistrement impossible'
        setMessage(fieldsWithErrors ? `${generic} : ${fieldsWithErrors}` : generic)
        return
      }
      setForceGeocode(false)
      setMessage('Modifications enregistrées avec succès')
    })
  }

  return (
    <form onSubmit={submit} className="grid relative gap-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* SECTION 1: Identité publique */}
      <section className="group overflow-hidden rounded-[24px] border border-slate-100 bg-white p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all duration-300 hover:border-indigo-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] md:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-indigo-50 text-indigo-500 transition-colors duration-300 group-hover:bg-indigo-100 group-hover:text-indigo-600">
            <Info size={24} strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Identité publique</h2>
            <p className="mt-1 text-[13px] font-medium text-slate-500">Informations de base visibles par les utilisateurs</p>
          </div>
        </div>
        
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Field label="Nom" htmlFor="name">
            <Input 
              id="name" 
              name="name" 
              defaultValue={poi.name} 
              className="h-12 w-full rounded-xl border-slate-200 bg-slate-50 px-4 text-[15px] font-medium text-slate-900 transition-all hover:border-indigo-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 shadow-sm" 
            />
          </Field>
          <Field label="Slug verrouillé" htmlFor="slug">
            <Input 
              id="slug" 
              name="slug" 
              defaultValue={poi.slug} 
              readOnly 
              className="h-12 w-full rounded-xl border-slate-100 bg-slate-100/50 px-4 text-[14px] font-mono text-slate-500 shadow-none focus-visible:ring-0" 
            />
          </Field>
          <Field label="Description" htmlFor="description" className="md:col-span-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
                  Markdown supporté : **gras**, *italique*, listes, [liens](url), titres (# Titre, ## Sous-titre, ### Section — espace obligatoire après les #), &gt; citation, --- séparateur, retour à la ligne en appuyant sur Entrée
                </p>
                <button
                  type="button"
                  onClick={() => setShowDescriptionPreview(prev => !prev)}
                  className="text-[11px] font-bold uppercase tracking-wider text-indigo-600 hover:text-indigo-700"
                >
                  {showDescriptionPreview ? 'Masquer l\'aperçu' : 'Afficher l\'aperçu'}
                </button>
              </div>
              <Textarea
                id="description"
                name="description"
                value={descriptionValue}
                onChange={e => setDescriptionValue(e.target.value)}
                className="min-h-32 w-full rounded-[16px] border-slate-200 bg-slate-50 p-4 text-[15px] font-medium leading-relaxed text-slate-900 transition-all hover:border-indigo-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 shadow-sm resize-y"
              />
              {showDescriptionPreview && (
                <div className="rounded-[16px] border border-indigo-100 bg-indigo-50/40 p-4">
                  <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-indigo-600">Aperçu</p>
                  {descriptionValue.trim() === '' ? (
                    <p className="text-sm italic text-slate-400">Description vide.</p>
                  ) : (
                    <MarkdownText source={descriptionValue} breaks className="text-[14px] leading-relaxed text-slate-700" />
                  )}
                </div>
              )}
            </div>
          </Field>
          <Field label="Téléphone" htmlFor="phone">
            <Input 
              id="phone" 
              name="phone" 
              defaultValue={poi.phone ?? ''} 
              className="h-12 w-full rounded-xl border-slate-200 bg-slate-50 px-4 text-[15px] font-medium text-slate-900 transition-all hover:border-indigo-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 shadow-sm" 
            />
          </Field>
          <Field label="Site web" htmlFor="website">
            <Input 
              id="website" 
              name="website" 
              defaultValue={poi.website ?? ''} 
              className="h-12 w-full rounded-xl border-slate-200 bg-slate-50 px-4 text-[15px] font-medium text-slate-900 transition-all hover:border-indigo-200 focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 shadow-sm" 
            />
          </Field>
        </div>
      </section>

      {/* SECTION 2: Classification et localisation */}
      <section className="group overflow-hidden rounded-[24px] border border-slate-100 bg-white p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all duration-300 hover:border-emerald-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] md:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-500 transition-colors duration-300 group-hover:bg-emerald-100 group-hover:text-emerald-600">
            <MapPin size={24} strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Classification & Localisation</h2>
            <p className="mt-1 text-[13px] font-medium text-slate-500">Catégorisation et positionnement sur la carte</p>
          </div>
        </div>

        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Field label="Catégorie" htmlFor="category_id">
            <select
              id="category_id"
              name="category_id"
              value={selectedCategoryId}
              onChange={event => {
                setSelectedCategoryId(event.target.value)
                setSelectedSubcategoryId('')
              }}
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-[14px] font-medium text-slate-900 outline-none transition-all hover:border-emerald-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 shadow-sm"
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
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-[14px] font-medium text-slate-900 outline-none transition-all hover:border-emerald-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 shadow-sm"
            >
              <option value="">Aucune</option>
              {subcategories.map(subcategory => (
                <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Adresse postale complète" htmlFor="address" className="md:col-span-2">
            <Input 
              id="address" 
              name="address" 
              defaultValue={poi.address} 
              className="h-12 w-full rounded-xl border-slate-200 bg-slate-50 px-4 text-[15px] font-medium text-slate-900 transition-all hover:border-emerald-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 shadow-sm" 
            />
          </Field>
          <Field label="Statut public" htmlFor="is_active">
            <select
              id="is_active"
              name="is_active"
              defaultValue={poi.status === 'active' ? 'true' : 'false'}
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-[14px] font-medium text-slate-900 outline-none transition-all hover:border-emerald-200 focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10 shadow-sm disabled:opacity-50"
              disabled={poi.status === 'archived'}
            >
              <option value="true">Actif</option>
              <option value="false">Inactif</option>
            </select>
          </Field>
          
          <div className="md:col-span-2 mt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-[20px] border border-slate-100 bg-slate-50/50 p-5 shadow-inner">
            <div className="flex-1">
              <p className="text-[13px] font-bold text-slate-700">Coordonnées géographiques</p>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <span className="inline-flex items-center rounded-full bg-white border border-slate-200 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-600 shadow-sm">
                  {poi.geocode_status}
                </span>
                <span className="font-mono text-[13px] font-medium text-slate-500">
                  {poi.latitude.toFixed(5)}, {poi.longitude.toFixed(5)}
                </span>
              </div>
              {forceGeocode && (
                <p className="mt-3 flex max-w-max items-center gap-2 rounded-lg bg-emerald-50 px-3 py-1.5 text-[12px] font-bold text-emerald-600">
                  <CheckCircle2 size={16} />
                  Recalcul directionnel Mapbox forcé au prochain enregistrement
                </p>
              )}
            </div>
            <Button
              type="button"
              variant="outline"
              className="h-11 rounded-xl bg-white px-5 font-bold text-slate-700 shadow-sm transition-all hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 active:scale-95"
              onClick={() => {
                setForceGeocode(true)
                setMessage("Recalcul activé. N'oubliez pas d'enregistrer.")
              }}
            >
              Recalculer
            </Button>
          </div>
        </div>
      </section>

      {/* SECTION 3: Tags du POI */}
      <section className="group overflow-hidden rounded-[24px] border border-slate-100 bg-white p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all duration-300 hover:border-sky-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] md:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-50 text-sky-500 transition-colors duration-300 group-hover:bg-sky-100 group-hover:text-sky-600">
            <TagIcon size={24} strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Tags de recherche</h2>
            <p className="mt-1 text-[13px] font-medium text-slate-500">Mots-clés pour le moteur de recherche interne</p>
          </div>
        </div>
        <div className="mt-8 max-w-3xl">
          <Field label="Un tag par ligne" htmlFor="tags">
            <Textarea
              id="tags"
              name="tags"
              defaultValue={poi.tags.join('\n')}
              className="min-h-36 w-full rounded-[16px] border-slate-200 bg-slate-50 p-4 text-[14px] font-medium leading-relaxed text-slate-900 transition-all hover:border-sky-200 focus:border-sky-500 focus:bg-white focus:ring-4 focus:ring-sky-500/10 shadow-sm resize-y"
            />
          </Field>
          <p className="mt-3 text-[13px] font-medium text-slate-400">
            Ces attributs ne sont pas liés à l'IA d'extraction photo, mais améliorent la découverte intraréseau.
          </p>
        </div>
      </section>

      {/* SECTION 4: Photos */}
      <section className="group overflow-hidden rounded-[24px] border border-slate-100 bg-white p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)] transition-all duration-300 hover:border-amber-100 hover:shadow-[0_8px_30px_rgb(0,0,0,0.06)] md:p-8">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-50 text-amber-500 transition-colors duration-300 group-hover:bg-amber-100 group-hover:text-amber-600">
            <ImageIcon size={24} strokeWidth={2} />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900">Médias & Photos</h2>
            <p className="mt-1 text-[13px] font-medium text-slate-500">Gérez l'apparence visuelle ({photos.length}/12)</p>
          </div>
        </div>
        
        <div className="mt-8 max-w-5xl">
          <div className="mb-6 rounded-2xl border border-slate-100 bg-slate-50/50 p-5">
            <Label htmlFor="new_photo_url" className="text-[14px] font-bold text-slate-700">Ajouter une URL d'image existante</Label>
            <div className="mt-3 flex flex-col sm:flex-row gap-3">
              <Input
                id="new_photo_url"
                value={newPhotoUrl}
                onChange={event => setNewPhotoUrl(event.target.value)}
                placeholder="https://example.com/asset/photo.jpg"
                className="h-12 flex-1 rounded-xl border-slate-200 bg-white px-4 text-[14px] transition-all hover:border-amber-200 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 shadow-sm"
              />
              <Button
                type="button"
                onClick={addPhoto}
                disabled={photos.length >= 12}
                className="h-12 w-full sm:w-auto rounded-xl bg-amber-500 px-6 font-bold text-white shadow-sm transition-all hover:-translate-y-0.5 hover:bg-amber-600 hover:shadow-amber-500/20 active:scale-95 disabled:pointer-events-none disabled:opacity-50"
              >
                <Plus size={18} className="mr-2" strokeWidth={2.5} />
                Ajouter
              </Button>
            </div>
            {photoUrlError && (
              <p className="mt-3 text-[13px] font-medium text-red-600">{photoUrlError}</p>
            )}

            {/* Upload natif (en plus de l'URL) : png/jpeg → webp côté serveur */}
            <div className="mt-4 border-t border-slate-100 pt-4">
              <ImageUpload
                endpoint="/api/admin/pois/photo"
                onUploaded={addUploadedPhoto}
                label="Téléverser une image"
              />
            </div>
          </div>

          <DndContext id={dndContextId} sensors={dndSensors} collisionDetection={closestCenter} onDragEnd={reorderPhotos}>
            <div className="overflow-hidden rounded-[20px] border border-slate-100 bg-white shadow-sm">
              <table aria-label="Photos du POI" className="w-full text-left">
                <caption className="sr-only">Photos du POI</caption>
                <thead className="bg-slate-50/80 border-b border-slate-100">
                  <tr>
                    <th className="px-3 py-4 w-10"></th>
                    <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500">Image</th>
                    <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500 hidden sm:table-cell">Asset</th>
                    <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500 text-center">Rôle</th>
                    <th className="px-5 py-4 text-[12px] font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                  </tr>
                </thead>
                <SortableContext items={photos} strategy={verticalListSortingStrategy}>
                  <tbody className="divide-y divide-slate-50">
                    {photos.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="px-5 py-12 text-center">
                          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-50 text-slate-300 mb-4">
                            <ImageIcon size={32} />
                          </div>
                          <p className="text-[14px] font-medium text-slate-500">Aucune photo actuellement liée à cette fiche.</p>
                        </td>
                      </tr>
                    ) : (
                      photos.map((photo, index) => (
                        <SortablePhotoRow
                          key={photo}
                          photo={photo}
                          index={index}
                          onRemove={() => removePhoto(index)}
                          onSetHero={() => setHeroPhoto(index)}
                        />
                      ))
                    )}
                  </tbody>
                </SortableContext>
              </table>
            </div>
          </DndContext>
        </div>
      </section>

      {/* Trail GPX Uploader — visible pour tout POI rando, qu'il ait déjà un
          TrailDetail ou non. Si manquant, l'upload le créera. */}
      {(poi.trail_fields_locked || poi.category.slug === 'rando') && (
        <TrailGpxUploader poiId={poi.id} hasTrailDetail={poi.trail_fields_locked} />
      )}

      {/* Données rando issues du TrailDetail. Valeurs présentes = lecture seule (pilotées
          par le tracé GPX) ; valeurs manquantes = éditables et enregistrées via trail_metrics. */}
      {trail && (
        <section
          data-testid="trail-stats-readonly"
          className="overflow-hidden rounded-[24px] border border-slate-100 bg-white p-6 shadow-[0_2px_10px_rgb(0,0,0,0.02)] md:p-8"
        >
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
              <Map size={24} strokeWidth={2} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Données randonnée</h2>
              <p className="mt-1 text-[13px] font-medium text-slate-500">
                Renseignez les valeurs manquantes. Les valeurs déjà issues du tracé restent verrouillées.
              </p>
            </div>
          </div>
          <div className="mt-8 grid grid-cols-2 gap-4 md:grid-cols-4">
            {trailMissing.distance_km ? (
              <Field label="Distance (km)" htmlFor="trail_distance_km">
                <Input
                  id="trail_distance_km"
                  type="number"
                  inputMode="decimal"
                  step="0.1"
                  min="0"
                  value={trailEdits.distance_km}
                  onChange={e => setTrailEdits(prev => ({ ...prev, distance_km: e.target.value }))}
                  className="h-12 w-full rounded-xl border-slate-200 bg-slate-50 px-4 text-[15px] font-medium text-slate-900 shadow-sm focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
              </Field>
            ) : (
              <TrailStat label="Distance" value={formatDistanceKm(trail.distance_km)} />
            )}

            {trailMissing.difficulty ? (
              <Field label="Difficulté" htmlFor="trail_difficulty">
                <select
                  id="trail_difficulty"
                  value={trailEdits.difficulty}
                  onChange={e => setTrailEdits(prev => ({ ...prev, difficulty: e.target.value }))}
                  className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 text-[14px] font-medium text-slate-900 shadow-sm outline-none focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                >
                  <option value="">— choisir —</option>
                  <option value="easy">Facile</option>
                  <option value="medium">Modéré</option>
                  <option value="hard">Difficile</option>
                  <option value="expert">Expert</option>
                </select>
              </Field>
            ) : (
              <TrailStat label="Difficulté" value={trailDifficultyLabel(trail.difficulty)} />
            )}

            {trailMissing.estimated_duration_min ? (
              <Field label="Durée (min)" htmlFor="trail_duration">
                <Input
                  id="trail_duration"
                  type="number"
                  inputMode="numeric"
                  step="1"
                  min="0"
                  value={trailEdits.estimated_duration_min}
                  onChange={e => setTrailEdits(prev => ({ ...prev, estimated_duration_min: e.target.value }))}
                  className="h-12 w-full rounded-xl border-slate-200 bg-slate-50 px-4 text-[15px] font-medium text-slate-900 shadow-sm focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
              </Field>
            ) : (
              <TrailStat label="Durée" value={formatTrailDuration(trail.estimated_duration_min)} />
            )}

            {trailMissing.elevation_gain_m ? (
              <Field label="Dénivelé (m)" htmlFor="trail_elevation">
                <Input
                  id="trail_elevation"
                  type="number"
                  inputMode="numeric"
                  step="1"
                  min="0"
                  value={trailEdits.elevation_gain_m}
                  onChange={e => setTrailEdits(prev => ({ ...prev, elevation_gain_m: e.target.value }))}
                  className="h-12 w-full rounded-xl border-slate-200 bg-slate-50 px-4 text-[15px] font-medium text-slate-900 shadow-sm focus:border-emerald-500 focus:bg-white focus:ring-4 focus:ring-emerald-500/10"
                />
              </Field>
            ) : (
              <TrailStat label="Dénivelé" value={formatElevation(trail.elevation_gain_m)} />
            )}
          </div>
        </section>
      )}

      {/* Lock Warnings Section */}
      {(poi.trail_fields_locked || poi.merchant_attached) && (
        <div className="grid gap-4 md:grid-cols-2">
          {poi.trail_fields_locked && (
            <section className="flex items-start gap-4 rounded-[20px] border border-amber-200/60 bg-amber-50/50 p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-amber-100 text-amber-600 shadow-sm">
                <Map size={20} strokeWidth={2.5} />
              </div>
              <div className="pt-1">
                <h2 className="text-[15px] font-bold text-amber-900">Randonnée protégée</h2>
                <p className="mt-1.5 text-[13px] font-medium leading-relaxed text-amber-700/80">Distance, dénivelé et difficulté restent verrouillés ici. Le tracé GPX se met à jour ci-dessus.</p>
              </div>
            </section>
          )}

          {poi.merchant_attached && (
            <section className="flex items-start gap-4 rounded-[20px] border border-sky-200/60 bg-sky-50/50 p-6">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sky-100 text-sky-600 shadow-sm">
                <Building2 size={20} strokeWidth={2.5} />
              </div>
              <div className="pt-1">
                <h2 className="text-[15px] font-bold text-sky-900">Revendication valide</h2>
                <p className="mt-1.5 text-[13px] font-medium leading-relaxed text-sky-700/80">Les actions sensibles (modifications cat/sub et archivage) peuvent impacter la visibilité d'un Merchant qui exploite cette fiche au public.</p>
              </div>
            </section>
          )}
        </div>
      )}

      {/* Floating Action Bar */}
      <div className="sticky bottom-6 z-10 mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 rounded-[24px] border border-slate-200/60 bg-white/80 backdrop-blur-xl p-4 shadow-[0_12px_40px_-10px_rgba(0,0,0,0.1)]">
        <div className="pl-2">
          {message ? (
            <span className="flex items-center gap-2.5 text-[14px] font-bold text-emerald-600 animate-in slide-in-from-left-4">
              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-100">
                <CheckCircle2 size={14} className="text-emerald-700" strokeWidth={3} />
              </div>
              {message}
            </span>
          ) : (
             <span className="text-[13px] font-bold text-slate-400 uppercase tracking-widest pl-2">
              Statut non sauvé
            </span>
          )}
        </div>
        <Button 
          type="submit" 
          disabled={isPending}
          className="h-14 rounded-2xl bg-indigo-600 px-8 text-[15px] font-bold text-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:bg-indigo-700 hover:shadow-[0_10px_20px_-10px_rgba(79,70,229,0.5)] active:translate-y-0 disabled:pointer-events-none disabled:bg-slate-100 disabled:text-slate-400 w-full sm:w-auto"
        >
          {isPending ? (
            <span className="flex items-center gap-3">
              <span className="h-5 w-5 animate-spin rounded-full border-[3px] border-white/30 border-t-white" />
              Confirmation...
            </span>
          ) : (
            'Enregistrer la fiche'
          )}
        </Button>
      </div>
    </form>
  )

  function addPhoto() {
    setPhotoUrlError(null)
    const trimmed = newPhotoUrl.trim()
    if (!trimmed || photos.length >= 12) return
    if (photos.includes(trimmed)) {
      setPhotoUrlError('Cette URL est déjà dans la liste.')
      return
    }
    try {
      const parsed = new URL(trimmed)
      // Accepter uniquement les URLs qui ressemblent à des images
      if (!/\.(jpe?g|png|webp|avif|gif)(\?.*)?$/i.test(parsed.pathname)) {
        setPhotoUrlError("L'URL ne pointe pas vers un fichier image (jpg/png/webp/avif/gif).")
        return
      }
    } catch {
      setPhotoUrlError('URL invalide.')
      return
    }
    setPhotos(current => [...current, trimmed])
    setNewPhotoUrl('')
  }

  function addUploadedPhoto(url: string) {
    setPhotoUrlError(null)
    setPhotos(current => (current.length >= 12 || current.includes(url) ? current : [...current, url]))
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

function SortablePhotoRow({
  photo,
  index,
  onRemove,
  onSetHero,
}: {
  photo: string
  index: number
  onRemove: () => void
  onSetHero: () => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: photo })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }
  const title = `Photo ${index + 1}`

  return (
    <tr ref={setNodeRef} style={style} className="group hover:bg-slate-50/30 transition-colors duration-200">
      <td className="px-3 py-4 align-middle">
        <button
          type="button"
          {...attributes}
          {...listeners}
          aria-label="Réordonner cette photo"
          className="flex h-8 w-8 cursor-grab items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-600 active:cursor-grabbing"
        >
          <GripVertical size={16} />
        </button>
      </td>
      <td className="px-5 py-4">
        <div className="overflow-hidden rounded-xl bg-slate-100 w-24 h-16">
          <img
            src={photo}
            alt={title}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        </div>
      </td>
      <td className="px-5 py-4 font-semibold text-[14px] text-slate-700 hidden sm:table-cell">{title}</td>
      <td className="px-5 py-4 text-center">
        {index === 0 ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 border border-amber-200 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-amber-600 shadow-sm">
            <Star size={12} className="fill-amber-500 stroke-amber-500" />
            Hero Image
          </span>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-8 rounded-lg border-slate-200 px-3 text-[12px] font-bold text-slate-500 transition-colors hover:border-amber-200 hover:bg-amber-50 hover:text-amber-700"
            aria-label={`Définir ${title} comme hero`}
            onClick={onSetHero}
          >
            Définir hero
          </Button>
        )}
      </td>
      <td className="px-5 py-4 text-right">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0 rounded-xl text-slate-400 transition-colors hover:bg-red-50 hover:text-red-600 focus:bg-red-50 focus:text-red-600"
          aria-label={`Effacer ${title}`}
          onClick={onRemove}
        >
          <Trash2 size={18} />
        </Button>
      </td>
    </tr>
  )
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
      <Label htmlFor={htmlFor} className="mb-2 block text-[13px] font-bold text-slate-700">
        {label}
      </Label>
      <div className="relative">{children}</div>
    </div>
  )
}

const TRAIL_DIFFICULTY_LABEL: Record<string, string> = {
  easy: 'Facile',
  medium: 'Modéré',
  hard: 'Difficile',
  expert: 'Expert',
}

function trailDifficultyLabel(difficulty: string): string {
  return TRAIL_DIFFICULTY_LABEL[difficulty] ?? '—'
}

function formatDistanceKm(distanceKm: number | null): string {
  return distanceKm === null ? '—' : `${distanceKm} km`
}

function formatElevation(elevationM: number | null): string {
  return elevationM === null ? '—' : `${elevationM} m`
}

function formatTrailDuration(minutes: number | null): string {
  if (minutes === null || minutes === 0) return '—'
  const hours = Math.floor(minutes / 60)
  const mins = minutes % 60
  if (hours === 0) return `${mins}min`
  return mins === 0 ? `${hours}h` : `${hours}h${String(mins).padStart(2, '0')}`
}

function TrailStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[16px] border border-slate-100 bg-slate-50/60 p-4">
      <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 text-[17px] font-bold text-slate-900">{value}</p>
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
