'use client'

import { useId, useState } from 'react'
import { Plus, Trash2, GripVertical, Search, PlayCircle } from 'lucide-react'
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
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { MarkdownHint } from '@/shared/components/MarkdownHint'
import { CategoryIcon } from '@/features/city-guide/lib/category-icon'
import { reorderById } from '@/features/guide-customization/lib/validation'
import type { PracticalBlockInput } from '@/features/guide-customization/types'
import { equipmentTitleKey } from '@/features/equipment-library/lib/title-key'
import type { EquipmentTemplate } from '@/features/equipment-library/types'

interface Props {
  value: PracticalBlockInput[]
  onChange: (next: PracticalBlockInput[]) => void
  /** Spec 083 : erreurs par bloc (« 0.title »), affichées sous le champ. */
  errors?: Record<string, string>
  /** Spec 096 : équipements validés de la bibliothèque, seule source des équipements. */
  library?: EquipmentTemplate[]
}

function blockUid(): string {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? `tmp-${crypto.randomUUID()}`
    : `tmp-${Math.random().toString(36).slice(2)}-${Date.now()}`
}

export function PracticalBlocksEditor({ value, onChange, errors = {}, library = [] }: Props) {
  const [libraryOpen, setLibraryOpen] = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [query, setQuery] = useState('')
  // Spec 096 AC-02-01 : équipements validés absents du logement (même équipement de bibliothèque).
  const presentIds = new Set(value.flatMap(block => (block.equipment_template_id ? [block.equipment_template_id] : [])))
  const available = library.filter(template => !presentIds.has(template.id))
  const queryKey = equipmentTitleKey(query)
  const matches = queryKey ? available.filter(template => equipmentTitleKey(template.title).includes(queryKey)) : available

  function toggleLibrary() {
    setLibraryOpen(open => !open)
    setSelected(new Set())
    setQuery('')
  }

  function addFromLibrary() {
    const picked = available.filter(template => selected.has(template.id))
    // Nom et texte par défaut, modifiables ; icône, photo et vidéo affichées depuis la bibliothèque.
    onChange([
      ...value,
      ...picked.map((template, offset) => ({
        id: blockUid(), equipment_template_id: template.id, title: template.title, body: template.body,
        icon: template.icon, photo_url: template.photo_url, video_url: template.video_url, sort_order: value.length + offset,
      })),
    ])
    setSelected(new Set())
    setQuery('')
    setLibraryOpen(false)
  }

  // id stable pour DndContext : évite le mismatch d'hydratation SSR/client sur
  // l'aria-describedby généré par le compteur global de dnd-kit.
  const dndId = useId()
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

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

  const allMatchesSelected = matches.length > 0 && matches.every(template => selected.has(template.id))

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-charcoal">Équipements</h3>
          <p className="text-xs text-gray-500">Choisissez les équipements du logement, puis ajustez leur nom et leur texte.</p>
        </div>
        <button
          type="button"
          onClick={toggleLibrary}
          aria-expanded={libraryOpen}
          className="inline-flex items-center gap-1.5 rounded-full bg-charcoal px-4 py-2 text-[11px] font-bold uppercase tracking-widest text-white"
        >
          <Plus className="h-3.5 w-3.5" /> Ajouter un équipement
        </button>
      </div>

      {libraryOpen && (
        <div data-testid="equipment-library-picker" className="space-y-3 rounded-2xl border border-gray-200 bg-gray-50/60 p-4">
          {available.length === 0 ? (
            <p className="text-xs text-gray-500">Aucun équipement disponible pour l’instant.</p>
          ) : (
            <>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <Input
                  type="search"
                  value={query}
                  onChange={event => setQuery(event.target.value)}
                  placeholder="Rechercher un équipement…"
                  aria-label="Rechercher un équipement"
                  className="bg-white pl-9"
                />
              </div>
              {matches.length === 0 ? (
                <p className="text-xs text-gray-500">Aucun équipement ne correspond à « {query.trim()} ».</p>
              ) : (
                <>
                  <label className="flex items-center gap-2 text-xs font-semibold text-gray-600">
                    <input
                      type="checkbox"
                      checked={allMatchesSelected}
                      onChange={event => setSelected(current => {
                        const next = new Set(current)
                        matches.forEach(template => (event.target.checked ? next.add(template.id) : next.delete(template.id)))
                        return next
                      })}
                      className="h-4 w-4 accent-[#0B1437]"
                    />
                    Tout sélectionner
                  </label>
                  <ul className="grid gap-2 sm:grid-cols-2">
                    {matches.map(template => (
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
                          <EquipmentThumb icon={template.icon} photoUrl={template.photo_url} size="sm" />
                          <span className="min-w-0">
                            <span className="block font-semibold text-charcoal">{template.title}</span>
                            {template.body ? <span className="line-clamp-2 text-xs text-gray-500">{template.body}</span> : null}
                          </span>
                        </label>
                      </li>
                    ))}
                  </ul>
                </>
              )}
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
                onUpdate={updateBlock}
                onRemove={removeBlock}
                titleError={errors[`${index}.title`]}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  )
}

/** Spec 096 AC-02-03 : miniature en lecture seule (photo de la bibliothèque, sinon icône). */
function EquipmentThumb({ icon, photoUrl, size }: { icon: string; photoUrl: string | null; size: 'sm' | 'md' }) {
  const box = size === 'sm' ? 'h-10 w-10' : 'h-16 w-24'
  if (photoUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photoUrl} alt="Photo de l’équipement" className={`${box} shrink-0 rounded-lg object-cover`} />
  }
  return (
    <span className={`${box} grid shrink-0 place-items-center rounded-lg bg-[#F4F7FE] text-[#0B1437]`}>
      <CategoryIcon iconSlug={icon} className="h-4 w-4" />
    </span>
  )
}

function SortableBlockRow({
  block,
  index,
  onUpdate,
  onRemove,
  titleError,
}: {
  titleError?: string
  block: PracticalBlockInput
  index: number
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

      <div className="flex items-center gap-3">
        <EquipmentThumb icon={block.icon} photoUrl={block.photo_url} size="md" />
        <div className="min-w-0 text-xs text-gray-400">
          <p>Photo et icône gérées par MyStay</p>
          {block.video_url ? (
            <p className="mt-1 inline-flex items-center gap-1"><PlayCircle className="h-3.5 w-3.5" /> Vidéo incluse</p>
          ) : null}
        </div>
      </div>

      <Input
        id={`block-title-${index}`}
        value={block.title}
        maxLength={120}
        aria-invalid={titleError ? true : undefined}
        data-field-error={titleError ? '' : undefined}
        className={titleError ? 'border-rose-400 focus-visible:ring-rose-400' : undefined}
        onChange={event => onUpdate(index, { title: event.target.value })}
      />
      {titleError ? <p className="text-xs font-semibold text-rose-600">{titleError}</p> : null}

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
    </div>
  )
}
