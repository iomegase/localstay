'use client'

import { useId } from 'react'
import { GripVertical, Plus, Trash2, X } from 'lucide-react'
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

interface Props {
  value: ArrivalInstructionInput[]
  onChange: (next: ArrivalInstructionInput[]) => void
  lodgingId: string
}

function instructionUid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
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
      { id: instructionUid(), title: '', text: '', video_url: null, photos: [], sort_order: value.length },
    ])
  }

  function update(index: number, patch: Partial<ArrivalInstructionInput>) {
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  function removeInstruction(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  function addPhoto(index: number, url: string) {
    update(index, { photos: [...value[index].photos, url] })
  }

  function removePhoto(index: number, photoIndex: number) {
    update(index, { photos: value[index].photos.filter((_, i) => i !== photoIndex) })
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
                onAddPhoto={addPhoto}
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
  onAddPhoto,
  onRemovePhoto,
}: {
  instruction: ArrivalInstructionInput
  index: number
  lodgingId: string
  onUpdate: (index: number, patch: Partial<ArrivalInstructionInput>) => void
  onRemove: (index: number) => void
  onAddPhoto: (index: number, url: string) => void
  onRemovePhoto: (index: number, photoIndex: number) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: instruction.id ?? String(index),
  })
  const style = { transform: CSS.Transform.toString(transform), transition }

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
        <Label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Photos (optionnelles)
        </Label>
        <ImageUpload
          endpoint={`/api/dashboard/lodgings/${lodgingId}/cover-photo`}
          onUploaded={url => onAddPhoto(index, url)}
          label="Ajouter une photo"
        />
        {instruction.photos.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {instruction.photos.map((photo, photoIndex) => (
              <div key={photoIndex} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt="" className="h-16 w-20 rounded-lg object-cover" />
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

      <YouTubeUrlField
        id={`instruction-video-${index}`}
        label="Vidéo YouTube (optionnelle)"
        value={instruction.video_url}
        onChange={url => onUpdate(index, { video_url: url })}
      />
    </div>
  )
}
