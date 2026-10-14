'use client'

import { useId, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowDown, ArrowUp, GripVertical } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { HUB_SURFACE_KEY, type SeminarActivityAdmin, type SeminarSurfaceOption } from '../types'
import { adminCall } from './admin-client'

function surfaceActivities(activities: SeminarActivityAdmin[], surfaceKey: string): SeminarActivityAdmin[] {
  return activities
    .flatMap(activity => {
      const placement = activity.placements.find(item => item.surface_key === surfaceKey)
      return placement ? [{ activity, position: placement.position }] : []
    })
    .sort((a, b) => a.position - b.position || a.activity.id.localeCompare(b.activity.id))
    .map(item => item.activity)
}

/** Spec 097 AC-08 / BR-10 : ordre d'affichage propre à chaque surface. */
export function SeminarSurfaceOrder({ activities, surfaces }: { activities: SeminarActivityAdmin[]; surfaces: SeminarSurfaceOption[] }) {
  const [surfaceKey, setSurfaceKey] = useState(HUB_SURFACE_KEY)
  const initial = useMemo(() => surfaceActivities(activities, surfaceKey), [activities, surfaceKey])

  return (
    <div className="space-y-4 rounded-[20px] border border-gray-100 bg-white p-5 shadow-sm">
      <label className="grid max-w-sm gap-1 text-xs font-semibold text-gray-500">Page
        <select
          value={surfaceKey}
          className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm text-neutral-900"
          onChange={event => setSurfaceKey(event.target.value)}
        >
          <option value={HUB_SURFACE_KEY}>Page Séminaires</option>
          {surfaces.map(surface => (
            <option key={surface.destination_id} value={surface.destination_id}>Séminaires — {surface.city_name}</option>
          ))}
        </select>
      </label>
      <OrderList key={`${surfaceKey}:${initial.map(activity => activity.id).join(',')}`} surfaceKey={surfaceKey} initial={initial} />
    </div>
  )
}

function OrderList({ surfaceKey, initial }: { surfaceKey: string; initial: SeminarActivityAdmin[] }) {
  const router = useRouter()
  const dndId = useId()
  const [items, setItems] = useState(initial)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [pending, startTransition] = useTransition()
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )
  const dirty = items.some((item, index) => item.id !== initial[index]?.id)

  function move(from: number, to: number) {
    if (to < 0 || to >= items.length) return
    setSaved(false)
    setItems(current => arrayMove(current, from, to))
  }

  function onDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return
    move(items.findIndex(item => item.id === active.id), items.findIndex(item => item.id === over.id))
  }

  function save() {
    setError(null)
    startTransition(async () => {
      const result = await adminCall('/api/admin/seminar-activity-placements/order', 'PUT', {
        surface_key: surfaceKey,
        activity_ids: items.map(item => item.id),
      })
      if (!result.ok) return setError(result.message)
      setSaved(true)
      router.refresh()
    })
  }

  if (!items.length) {
    return <p className="text-sm text-gray-500">Aucune activité attribuée à cette page.</p>
  }

  return (
    <div className="space-y-3">
      <DndContext id={dndId} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
        <SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
          <ol className="space-y-2">
            {items.map((item, index) => (
              <OrderRow
                key={item.id}
                activity={item}
                index={index}
                last={index === items.length - 1}
                onMove={to => move(index, to)}
              />
            ))}
          </ol>
        </SortableContext>
      </DndContext>
      {error && <p role="alert" className="text-sm font-semibold text-rose-600">{error}</p>}
      {saved && <p role="status" className="text-sm font-semibold text-emerald-700">Ordre enregistré.</p>}
      <Button type="button" disabled={pending || !dirty} onClick={save}>Enregistrer l’ordre</Button>
    </div>
  )
}

function OrderRow({ activity, index, last, onMove }: {
  activity: SeminarActivityAdmin
  index: number
  last: boolean
  onMove: (to: number) => void
}) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: activity.id })
  const visible = activity.is_published && activity.image_url

  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      data-testid="seminar-order-row"
      className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-2"
    >
      <button type="button" aria-label={`Déplacer ${activity.title}`} className="cursor-grab text-gray-400" {...attributes} {...listeners}>
        <GripVertical className="h-4 w-4" />
      </button>
      <span className="w-6 text-xs font-bold text-gray-400">{index + 1}</span>
      <span className="flex-1 text-sm font-semibold text-neutral-900">
        {activity.title}
        {!visible && <span className="ml-2 text-xs font-normal text-gray-400">(non visible : brouillon ou sans image)</span>}
      </span>
      <Button type="button" size="icon" variant="ghost" aria-label={`Monter ${activity.title}`} disabled={index === 0} onClick={() => onMove(index - 1)}>
        <ArrowUp className="h-4 w-4" />
      </Button>
      <Button type="button" size="icon" variant="ghost" aria-label={`Descendre ${activity.title}`} disabled={last} onClick={() => onMove(index + 1)}>
        <ArrowDown className="h-4 w-4" />
      </Button>
    </li>
  )
}
