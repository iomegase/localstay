'use client'

import type { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'

export function SortablePhotoCard({ id, label, disabled, cover, children }: {
  id: string
  label: string
  disabled: boolean
  cover: boolean
  children: ReactNode
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({ id, disabled })
  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
      className={`relative rounded-xl border bg-white ${cover ? 'border-pink-600 ring-1 ring-pink-600' : 'border-gray-100'} ${isDragging ? 'z-30 shadow-xl opacity-80' : ''}`}>
      <Button ref={setActivatorNodeRef} type="button" size="icon" variant="secondary"
        {...attributes} {...listeners} disabled={disabled} aria-label={`Réorganiser ${label}`}
        className="absolute left-1/2 top-3 z-20 h-9 w-9 -translate-x-1/2 touch-none cursor-grab active:cursor-grabbing">
        <GripVertical className="h-5 w-5" aria-hidden="true" />
      </Button>
      <div className="overflow-hidden rounded-xl">{children}</div>
    </div>
  )
}
