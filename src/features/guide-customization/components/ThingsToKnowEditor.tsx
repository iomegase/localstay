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
import { reorderById, THING_TO_KNOW_MAX_PHOTOS } from '@/features/guide-customization/lib/validation'
import type { ThingToKnowInput } from '@/features/guide-customization/types'

interface Props {
  value: ThingToKnowInput[]
  onChange: (next: ThingToKnowInput[]) => void
  lodgingId: string
  /** Spec 083 : erreurs par carte (« 0.title »), affichées sous le champ. */
  errors?: Record<string, string>
}

function itemUid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `tmp-${crypto.randomUUID()}`
    : `tmp-${Math.random().toString(36).slice(2)}-${Date.now()}`
}

/** Spec 099 US-01 : cartes « Choses à savoir » (titre, description, photos). */
export function ThingsToKnowEditor({ value, onChange, lodgingId, errors = {} }: Props) {
  const dndId = useId()
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function addItem() {
    onChange([...value, { id: itemUid(), title: '', body: null, photos: [], sort_order: value.length }])
  }

  function update(index: number, patch: Partial<ThingToKnowInput>) {
    onChange(value.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  }

  // Spec 099 BR-01 : 5 photos maximum par carte.
  function addPhotos(index: number, urls: string[]) {
    const photos = value[index].photos
    update(index, { photos: [...photos, ...urls].slice(0, THING_TO_KNOW_MAX_PHOTOS) })
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
          <h3 className="text-sm font-semibold text-charcoal">Choses à savoir</h3>
          <p className="text-xs text-gray-500">
            Les particularités du logement : un titre, une description et des photos.
          </p>
        </div>
        <button
          type="button"
          onClick={addItem}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-charcoal px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-white"
        >
          <Plus className="h-3.5 w-3.5" /> Ajouter une chose à savoir
        </button>
      </div>

      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={value.map(item => item.id ?? '')} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {value.map((item, index) => (
              <SortableThingRow
                key={item.id ?? index}
                item={item}
                index={index}
                lodgingId={lodgingId}
                error={errors[`${index}.title`]}
                onUpdate={update}
                onRemove={i => onChange(value.filter((_, j) => j !== i))}
                onAddPhotos={addPhotos}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

function SortableThingRow({
  item,
  index,
  lodgingId,
  error,
  onUpdate,
  onRemove,
  onAddPhotos,
}: {
  item: ThingToKnowInput
  index: number
  lodgingId: string
  error?: string
  onUpdate: (index: number, patch: Partial<ThingToKnowInput>) => void
  onRemove: (index: number) => void
  onAddPhotos: (index: number, urls: string[]) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: item.id ?? String(index) })
  const style = { transform: CSS.Transform.toString(transform), transition }
  const smallLabelClass = 'block text-[10px] font-semibold uppercase tracking-widest text-gray-400'
  const room = THING_TO_KNOW_MAX_PHOTOS - item.photos.length

  return (
    <div ref={setNodeRef} style={style} data-testid="thing-to-know-row" className="space-y-3 rounded-2xl border border-gray-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Déplacer la carte"
            className="flex h-8 w-8 cursor-grab items-center justify-center rounded-lg bg-[#F4F7FE] text-[#0B1437] active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <Label className={smallLabelClass}>Carte {index + 1}</Label>
        </div>
        <button
          type="button"
          onClick={() => onRemove(index)}
          aria-label={`Supprimer la carte ${index + 1}`}
          className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:border-red-300 hover:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" /> Supprimer
        </button>
      </div>

      <div className="space-y-2">
        <Label htmlFor={`thing-title-${index}`} className={smallLabelClass}>Titre</Label>
        <Input
          id={`thing-title-${index}`}
          value={item.title}
          maxLength={120}
          placeholder="Ex. Volets roulants"
          aria-invalid={error ? true : undefined}
          data-field-error={error ? '' : undefined}
          className={error ? 'border-rose-400 focus-visible:ring-rose-400' : undefined}
          onChange={event => onUpdate(index, { title: event.target.value })}
        />
        {error ? <p className="text-xs font-semibold text-rose-600">{error}</p> : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor={`thing-body-${index}`} className={smallLabelClass}>Description (optionnelle)</Label>
        <Textarea
          id={`thing-body-${index}`}
          value={item.body ?? ''}
          maxLength={2000}
          placeholder="Ex. Le volet du salon se manœuvre avec la télécommande posée sur la cheminée."
          className="min-h-[88px]"
          onChange={event => onUpdate(index, { body: event.target.value })}
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-baseline justify-between gap-3">
          <Label className={smallLabelClass}>Photos (optionnelles)</Label>
          <span className="text-[11px] text-gray-500">{item.photos.length} / {THING_TO_KNOW_MAX_PHOTOS} photos</span>
        </div>
        {room > 0 ? (
          <ImageUpload
            endpoint={`/api/dashboard/lodgings/${lodgingId}/cover-photo`}
            onUploaded={url => onAddPhotos(index, [url])}
            onUploadedMany={urls => onAddPhotos(index, urls)}
            maxFiles={room}
            label="Ajouter des photos"
          />
        ) : (
          <p className="text-[11px] font-semibold text-gray-500">Limite atteinte : {THING_TO_KNOW_MAX_PHOTOS} photos.</p>
        )}
        {item.photos.length > 0 && (
          <div className="flex flex-wrap gap-3">
            {item.photos.map((photo, photoIndex) => (
              <div key={`${photo}-${photoIndex}`} className="relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo} alt="" className="h-16 w-20 rounded-lg object-cover" />
                <button
                  type="button"
                  onClick={() => onUpdate(index, { photos: item.photos.filter((_, i) => i !== photoIndex) })}
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
    </div>
  )
}
