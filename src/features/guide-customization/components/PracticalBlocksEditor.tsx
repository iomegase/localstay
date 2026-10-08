'use client'

import { useId, useState } from 'react'
import { Plus, Trash2, GripVertical, Library } from 'lucide-react'
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
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { ImageUpload } from '@/shared/components/ImageUpload'
import { MarkdownHint } from '@/shared/components/MarkdownHint'
import { YouTubeUrlField } from './YouTubeUrlField'
import { EquipmentNameField } from './EquipmentNameField'
import { CategoryIcon } from '@/features/city-guide/lib/category-icon'
import {
  PRACTICAL_BLOCK_ICONS,
  DEFAULT_PRACTICAL_BLOCK_ICON,
} from '@/features/guide-customization/lib/practical-block-icons'
import { reorderById } from '@/features/guide-customization/lib/validation'
import type { PracticalBlockInput } from '@/features/guide-customization/types'
import { equipmentTitleKey } from '@/features/equipment-library/lib/title-key'
import type { EquipmentTemplate } from '@/features/equipment-library/types'

interface Props {
  value: PracticalBlockInput[]
  onChange: (next: PracticalBlockInput[]) => void
  lodgingId: string
  /** Spec 083 : erreurs par bloc (« 0.title »), affichées sous le champ. */
  errors?: Record<string, string>
  /** Spec 095 : équipements validés de la bibliothèque, ajoutables en copie. */
  library?: EquipmentTemplate[]
}

function blockUid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `tmp-${crypto.randomUUID()}`
    : `tmp-${Math.random().toString(36).slice(2)}-${Date.now()}`
}

export function PracticalBlocksEditor({ value, onChange, lodgingId, errors = {}, library = [] }: Props) {
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  // Spec 095 AC-04-01 : équipements validés absents du logement (même nom).
  const presentKeys = new Set(value.map(block => equipmentTitleKey(block.title)))
  const available = library.filter(template => !presentKeys.has(equipmentTitleKey(template.title)))

  function addFromLibrary() {
    const picked = available.filter(template => selected.has(template.id))
    // AC-04-02 : copies modifiables ; photo et vidéo restent propres au logement (BR-02).
    onChange([
      ...value,
      ...picked.map((template, offset) => ({
        id: blockUid(), title: template.title, body: template.body, icon: template.icon,
        photo_url: null, video_url: null, sort_order: value.length + offset,
      })),
    ])
    setSelected(new Set())
    setLibraryOpen(false)
  }

  // Spec 095 AC-04-03 : pour le champ Nom, équipements validés absents des AUTRES équipements.
  function nameOptionsFor(index: number): EquipmentTemplate[] {
    const otherKeys = new Set(value.filter((_, i) => i !== index).map(block => equipmentTitleKey(block.title)))
    return library.filter(template => !otherKeys.has(equipmentTitleKey(template.title)))
  }

  // id stable pour DndContext : évite le mismatch d'hydratation SSR/client sur
  // l'aria-describedby généré par le compteur global de dnd-kit.
  const dndId = useId()
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  function addBlock() {
    onChange([
      ...value,
      { id: blockUid(), title: '', body: null, icon: DEFAULT_PRACTICAL_BLOCK_ICON, photo_url: null, video_url: null, sort_order: value.length },
    ])
  }

  function updateBlock(index: number, patch: Partial<PracticalBlockInput>) {
    onChange(value.map((block, i) => (i === index ? { ...block, ...patch } : block)))
  }

  function removeBlock(index: number) {
    onChange(value.filter((_, i) => i !== index))
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    onChange(reorderById(value, String(active.id), String(over.id)))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-charcoal">Équipements</h3>
          <p className="text-xs text-gray-500">Ajoutez les équipements du logement : nom, icône, texte, photo.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {library.length > 0 && (
            <button
              type="button"
              onClick={() => setLibraryOpen(open => !open)}
              aria-expanded={libraryOpen}
              className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-charcoal"
            >
              <Library className="h-3.5 w-3.5" /> Ajouter depuis la bibliothèque
            </button>
          )}
          <button
            type="button"
            onClick={addBlock}
            className="inline-flex items-center gap-1.5 rounded-full bg-charcoal px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-white"
          >
            <Plus className="h-3.5 w-3.5" /> Ajouter un équipement
          </button>
        </div>
      </div>

      {libraryOpen && (
        <div data-testid="equipment-library-picker" className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50/60 p-4">
          {available.length === 0 ? (
            <p className="text-xs text-gray-500">Tous les équipements de la bibliothèque sont déjà dans votre guide.</p>
          ) : (
            <>
              <label className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                <input
                  type="checkbox"
                  checked={selected.size === available.length}
                  onChange={event => setSelected(event.target.checked ? new Set(available.map(template => template.id)) : new Set())}
                  className="h-4 w-4 accent-[#0B1437]"
                />
                Tout sélectionner
              </label>
              <ul className="grid gap-2 sm:grid-cols-2">
                {available.map(template => (
                  <li key={template.id}>
                    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-gray-100 bg-white p-3 text-sm">
                      <input
                        type="checkbox"
                        checked={selected.has(template.id)}
                        onChange={event => setSelected(current => {
                          const next = new Set(current)
                          if (event.target.checked) next.add(template.id)
                          else next.delete(template.id)
                          return next
                        })}
                        className="mt-1 h-4 w-4 shrink-0 accent-[#0B1437]"
                      />
                      <CategoryIcon iconSlug={template.icon} className="mt-0.5 h-4 w-4 shrink-0 text-gray-500" />
                      <span className="min-w-0">
                        <span className="block font-semibold text-charcoal">{template.title}</span>
                        {template.body ? <span className="line-clamp-2 text-xs text-gray-500">{template.body}</span> : null}
                      </span>
                    </label>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                disabled={selected.size === 0}
                onClick={addFromLibrary}
                className="inline-flex items-center gap-1.5 rounded-full bg-charcoal px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-white disabled:opacity-40"
              >
                Ajouter ({selected.size})
              </button>
            </>
          )}
        </div>
      )}

      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={value.map(block => block.id ?? '')} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {value.map((block, index) => (
              <SortableBlockRow
                key={block.id ?? index}
                block={block}
                index={index}
                lodgingId={lodgingId}
                onUpdate={updateBlock}
                onRemove={removeBlock}
                titleError={errors[`${index}.title`]}
                nameOptions={nameOptionsFor(index)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

function SortableBlockRow({
  block,
  index,
  lodgingId,
  onUpdate,
  onRemove,
  titleError,
  nameOptions,
}: {
  titleError?: string
  nameOptions: EquipmentTemplate[]
  block: PracticalBlockInput
  index: number
  lodgingId: string
  onUpdate: (index: number, patch: Partial<PracticalBlockInput>) => void
  onRemove: (index: number) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: block.id ?? String(index),
  })
  const style = { transform: CSS.Transform.toString(transform), transition }

  return (
    <div ref={setNodeRef} style={style} className="space-y-3 rounded-2xl border border-gray-200 p-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-label="Déplacer l’équipement"
            className="flex h-8 w-8 cursor-grab items-center justify-center rounded-lg bg-[#F4F7FE] text-[#0B1437] active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <Label htmlFor={`block-title-${index}`} className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            Nom de l’équipement
          </Label>
        </div>
        <button
          type="button"
          onClick={() => onRemove(index)}
          aria-label="Supprimer l’équipement"
          className="inline-flex items-center gap-1 rounded-full border border-gray-200 px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:border-red-300 hover:text-red-500"
        >
          <Trash2 className="h-3.5 w-3.5" /> Supprimer
        </button>
      </div>

      <EquipmentNameField
        id={`block-title-${index}`}
        value={block.title}
        options={nameOptions}
        error={titleError}
        onChange={title => onUpdate(index, { title })}
        // Le texte de la bibliothèque ne remplace jamais un texte déjà saisi.
        onPick={template => onUpdate(index, {
          title: template.title,
          icon: template.icon,
          ...(block.body?.trim() ? {} : { body: template.body }),
        })}
      />
      {titleError ? <p className="text-xs font-semibold text-rose-600">{titleError}</p> : null}

      <div>
        <Label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400">Icône</Label>
        <div className="mt-2 flex flex-wrap gap-2">
          {PRACTICAL_BLOCK_ICONS.map(icon => {
            const selected = block.icon === icon.slug
            return (
              <button
                key={icon.slug}
                type="button"
                aria-label={icon.label}
                aria-pressed={selected}
                title={icon.label}
                onClick={() => onUpdate(index, { icon: icon.slug })}
                className={`flex h-9 w-9 items-center justify-center rounded-xl border ${
                  selected ? 'border-charcoal bg-charcoal text-white' : 'border-gray-200 text-charcoal'
                }`}
              >
                <CategoryIcon iconSlug={icon.slug} className="h-4 w-4" />
              </button>
            )
          })}
        </div>
      </div>

      <div>
        <Label htmlFor={`block-body-${index}`} className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400">
          Texte
        </Label>
        <Textarea
          id={`block-body-${index}`}
          value={block.body ?? ''}
          rows={4}
          onChange={event => onUpdate(index, { body: event.target.value })}
        />
        <MarkdownHint />
      </div>

      <div className="space-y-2">
        <Label className="block text-[10px] font-semibold uppercase tracking-widest text-gray-400">Photo (optionnelle)</Label>
        <ImageUpload
          endpoint={`/api/dashboard/lodgings/${lodgingId}/cover-photo`}
          onUploaded={url => onUpdate(index, { photo_url: url })}
          label="Téléverser une photo"
        />
        {block.photo_url && (
          <div className="flex items-center gap-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={block.photo_url} alt="Aperçu du bloc" className="h-16 w-24 rounded-lg object-cover" />
            <button
              type="button"
              onClick={() => onUpdate(index, { photo_url: null })}
              className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-red-500"
            >
              Retirer la photo
            </button>
          </div>
        )}
      </div>

      <YouTubeUrlField
        id={`block-video-${index}`}
        label="Vidéo YouTube (optionnelle)"
        value={block.video_url}
        onChange={url => onUpdate(index, { video_url: url })}
      />
    </div>
  )
}
