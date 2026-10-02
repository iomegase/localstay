'use client'

import { useId } from 'react'
import { GripVertical, Plus, Star, Trash2, X } from 'lucide-react'
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
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { ImageUpload } from '@/shared/components/ImageUpload'
import { YouTubeUrlField } from './YouTubeUrlField'
import { reorderById } from '@/features/guide-customization/lib/validation'
import type { ArrivalInstructionInput } from '@/features/guide-customization/types'
import {
  arrivalMediaCount,
  ARRIVAL_STEP_ITEMS_MAX,
  ARRIVAL_STEP_MAX_MEDIA,
  ARRIVAL_STEP_MULTI_UPLOAD_MAX,
  ARRIVAL_STEP_KIND_LABELS,
  ARRIVAL_STEP_KINDS,
  type ArrivalStepKind,
} from '@/features/guide-app/lib/arrival-steps'

interface Props {
  value: ArrivalInstructionInput[]
  onChange: (next: ArrivalInstructionInput[]) => void
  lodgingId: string
}

function instructionUid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `tmp-${crypto.randomUUID()}`
    : `tmp-${Math.random().toString(36).slice(2)}-${Date.now()}`
}

export function ArrivalInstructionsEditor({ value, onChange, lodgingId }: Props) {
  const dndId = useId()
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function addInstruction() {
    onChange([
      ...value,
      {
        id: instructionUid(),
        title: '',
        text: '',
        video_url: null,
        photos: [],
        sort_order: value.length,
        kind: 'custom',
        tip: null,
        substeps: [],
        facts: [],
      },
    ])
  }

  function update(index: number, patch: Partial<ArrivalInstructionInput>) {
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function removeInstruction(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  // Ajout groupé (upload multiple), borné à 5 médias par étape (spec 054 AC-05-03).
  function addPhotos(index: number, urls: string[]) {
    const instruction = value[index]
    const room = ARRIVAL_STEP_MAX_MEDIA - arrivalMediaCount(instruction.photos, instruction.video_url)
    update(index, { photos: [...instruction.photos, ...urls.slice(0, Math.max(0, room))] })
  }

  function removePhoto(index: number, photoIndex: number) {
    update(index, { photos: value[index].photos.filter((_, i) => i !== photoIndex) })
  }

  // Spec 054 AC-05-03 : l'image principale est la première photo de l'étape.
  function makeHero(index: number, photoIndex: number) {
    const photos = value[index].photos
    update(index, { photos: [photos[photoIndex], ...photos.filter((_, i) => i !== photoIndex)] })
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    onChange(reorderById(value, String(active.id), String(over.id)))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-charcoal">Instructions d&apos;arrivée</h3>
          <p className="text-xs text-gray-500">
            Étapes pour arriver au logement (texte, photos, vidéo).
          </p>
        </div>
        <button
          type="button"
          onClick={addInstruction}
          aria-label="Ajouter une instruction"
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-charcoal px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-white"
        >
          <Plus className="h-3.5 w-3.5" /> Ajouter une instruction
        </button>
      </div>

      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={value.map(instruction => instruction.id ?? '')} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {value.map((instruction, index) => (
              <SortableInstructionRow
                key={instruction.id ?? index}
                instruction={instruction}
                index={index}
                lodgingId={lodgingId}
                onUpdate={update}
                onRemove={removeInstruction}
                onAddPhotos={addPhotos}
                onMakeHero={makeHero}
                onRemovePhoto={removePhoto}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

function SortableInstructionRow({
  instruction,
  index,
  lodgingId,
  onUpdate,
  onRemove,
  onAddPhotos,
  onRemovePhoto,
  onMakeHero,
}: {
  instruction: ArrivalInstructionInput
  index: number
  lodgingId: string
  onUpdate: (index: number, patch: Partial<ArrivalInstructionInput>) => void
  onRemove: (index: number) => void
  onAddPhotos: (index: number, urls: string[]) => void
  onMakeHero: (index: number, photoIndex: number) => void
  onRemovePhoto: (index: number, photoIndex: number) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: instruction.id ?? String(index),
  })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const mediaCount = arrivalMediaCount(instruction.photos, instruction.video_url)
  const substeps = instruction.substeps ?? []
  const facts = instruction.facts ?? []
  const smallLabelClass = 'block text-[10px] font-semibold uppercase tracking-widest text-gray-400'
  const addItemClass = 'inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:border-charcoal hover:text-charcoal disabled:opacity-40'
  const removeItemClass = 'grid h-9 w-9 shrink-0 place-items-center rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-500'

  return (
    <div ref={setNodeRef} style={style} className="space-y-3 rounded-2xl border border-gray-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Déplacer l'instruction"
            className="flex h-8 w-8 cursor-grab items-center justify-center rounded-lg bg-[#F4F7FE] text-[#0B1437] active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <Label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Étape {index + 1}
          </Label>
        </div>
        <button
          type="button"
          onClick={() => onRemove(index)}
          aria-label="Supprimer l'instruction"
          className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:border-red-300 hover:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" /> Supprimer
        </button>
      </div>

      {/* Spec 054 AC-05-01 — type d'étape (onglet du parcours d'arrivée). */}
      <div className="space-y-2">
        <Label htmlFor={`instruction-kind-${index}`} className={smallLabelClass}>
          Type d&apos;étape
        </Label>
        <select
          id={`instruction-kind-${index}`}
          value={instruction.kind ?? 'custom'}
          onChange={event => onUpdate(index, { kind: event.target.value as ArrivalStepKind })}
          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
        >
          {ARRIVAL_STEP_KINDS.map(kind => (
            <option key={kind} value={kind}>{ARRIVAL_STEP_KIND_LABELS[kind]}</option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`instruction-title-${index}`} className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Titre de l&apos;étape
        </Label>
        <Input
          id={`instruction-title-${index}`}
          value={instruction.title ?? ''}
          maxLength={120}
          placeholder="Ex. Accueil & parking"
          onChange={event => onUpdate(index, { title: event.target.value })}
        />
      </div>

      <Textarea
        aria-label="Texte de l'instruction"
        value={instruction.text}
        rows={2}
        maxLength={2000}
        placeholder="Ex. Ouvrez le portail avec le badge remis à l'entrée."
        onChange={event => onUpdate(index, { text: event.target.value })}
      />

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <span className={smallLabelClass}>Sous-étapes (optionnelles)</span>
          <button
            type="button"
            className={addItemClass}
            disabled={substeps.length >= ARRIVAL_STEP_ITEMS_MAX}
            onClick={() => onUpdate(index, { substeps: [...substeps, { title: '', detail: '' }] })}
          >
            <Plus className="h-3.5 w-3.5" /> Ajouter une sous-étape
          </button>
        </div>
        {substeps.map((substep, subIndex) => (
          <div key={subIndex} className="flex items-start gap-2">
            <div className="grid flex-1 gap-2">
              <Input
                aria-label={`Sous-étape ${subIndex + 1} — titre`}
                value={substep.title}
                maxLength={120}
                placeholder="Ex. Entrez le code"
                onChange={event => onUpdate(index, {
                  substeps: substeps.map((item, i) => (i === subIndex ? { ...item, title: event.target.value } : item)),
                })}
              />
              <Textarea
                aria-label={`Sous-étape ${subIndex + 1} — détail`}
                value={substep.detail}
                rows={2}
                maxLength={600}
                placeholder="Ex. Tirez le levier vers le bas."
                onChange={event => onUpdate(index, {
                  substeps: substeps.map((item, i) => (i === subIndex ? { ...item, detail: event.target.value } : item)),
                })}
              />
            </div>
            <button
              type="button"
              aria-label={`Retirer la sous-étape ${subIndex + 1}`}
              className={removeItemClass}
              onClick={() => onUpdate(index, { substeps: substeps.filter((_, i) => i !== subIndex) })}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between gap-3">
          <span className={smallLabelClass}>Repères (optionnels)</span>
          <button
            type="button"
            className={addItemClass}
            disabled={facts.length >= ARRIVAL_STEP_ITEMS_MAX}
            onClick={() => onUpdate(index, { facts: [...facts, { label: '', value: '' }] })}
          >
            <Plus className="h-3.5 w-3.5" /> Ajouter un repère
          </button>
        </div>
        {facts.map((fact, factIndex) => (
          <div key={factIndex} className="flex items-center gap-2">
            <Input
              aria-label={`Repère ${factIndex + 1} — libellé`}
              value={fact.label}
              maxLength={40}
              placeholder="Ex. Niveau"
              onChange={event => onUpdate(index, {
                facts: facts.map((item, i) => (i === factIndex ? { ...item, label: event.target.value } : item)),
              })}
            />
            <Input
              aria-label={`Repère ${factIndex + 1} — valeur`}
              value={fact.value}
              maxLength={60}
              placeholder="Ex. −2"
              onChange={event => onUpdate(index, {
                facts: facts.map((item, i) => (i === factIndex ? { ...item, value: event.target.value } : item)),
              })}
            />
            <button
              type="button"
              aria-label={`Retirer le repère ${factIndex + 1}`}
              className={removeItemClass}
              onClick={() => onUpdate(index, { facts: facts.filter((_, i) => i !== factIndex) })}
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`instruction-tip-${index}`} className={smallLabelClass}>
          Conseil (optionnel)
        </Label>
        <Input
          id={`instruction-tip-${index}`}
          value={instruction.tip ?? ''}
          maxLength={300}
          placeholder="Ex. Hauteur maximale 1,90 m."
          onChange={event => onUpdate(index, { tip: event.target.value })}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <Label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Photos et vidéo (optionnelles)
          </Label>
          <span className="text-[11px] text-gray-500">{mediaCount} / {ARRIVAL_STEP_MAX_MEDIA} médias</span>
        </div>
        <p className="text-[11px] text-gray-500">
          La première photo est l&apos;image principale ; les autres photos et la vidéo s&apos;affichent dessous.
        </p>
        {mediaCount < ARRIVAL_STEP_MAX_MEDIA ? (
          <ImageUpload
            endpoint={`/api/dashboard/lodgings/${lodgingId}/cover-photo`}
            onUploaded={url => onAddPhotos(index, [url])}
            onUploadedMany={urls => onAddPhotos(index, urls)}
            maxFiles={Math.min(ARRIVAL_STEP_MULTI_UPLOAD_MAX, ARRIVAL_STEP_MAX_MEDIA - mediaCount)}
            label="Ajouter des photos"
          />
        ) : (
          <p className="text-[11px] font-semibold text-gray-500">
            Limite atteinte : 1 image principale + 4 photos ou vidéo.
          </p>
        )}
        {instruction.photos.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {instruction.photos.map((photo, photoIndex) => (
              <div key={photoIndex} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo}
                  alt=""
                  className={`h-16 w-20 rounded-lg object-cover ${photoIndex === 0 ? 'ring-2 ring-pink-600 ring-offset-1' : ''}`}
                />
                {photoIndex === 0 ? (
                  <span className="absolute inset-x-0 bottom-0 rounded-b-lg bg-pink-600/90 px-1 text-center text-[9px] font-bold text-white">
                    Image principale
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => onMakeHero(index, photoIndex)}
                    aria-label={`Définir la photo ${photoIndex + 1} comme image principale`}
                    title="Définir comme image principale"
                    className="absolute -left-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-white text-pink-600 shadow"
                  >
                    <Star className="h-3 w-3" />
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => onRemovePhoto(index, photoIndex)}
                  aria-label={`Retirer la photo ${photoIndex + 1}`}
                  className="absolute -right-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-charcoal text-white"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {!instruction.video_url && instruction.photos.length >= ARRIVAL_STEP_MAX_MEDIA ? (
        <p className="text-[11px] text-gray-500">Retirez une photo pour ajouter une vidéo.</p>
      ) : (
        <YouTubeUrlField
          id={`instruction-video-${index}`}
          label="Vidéo YouTube (optionnelle)"
          value={instruction.video_url}
          onChange={url => onUpdate(index, { video_url: url })}
        />
      )}
    </div>
  )
}
