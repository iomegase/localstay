'use client'

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { ROOM_TYPE_LABELS } from '../lib/detail-view'
import type { PhotoCategoryOption } from '../lib/photo-categories'

export function PhotoCategorySelect({ options, roomType, roomLabel, label, disabled, onChange }: {
  options: PhotoCategoryOption[]
  roomType: string | null
  roomLabel: string | null
  label: string
  disabled: boolean
  onChange: (value: string) => void
}) {
  const value = roomLabel ? `${roomType ?? 'other'}::${roomLabel}` : (roomType ?? 'other')
  const missing = !options.some(option => option.value === value)
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger aria-label={label} className="bg-white text-charcoal shadow-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {missing && <SelectItem value={value}>{roomLabel ?? ROOM_TYPE_LABELS[roomType ?? 'other'] ?? 'Autre'}</SelectItem>}
        {options.map(option => <SelectItem key={option.value} value={option.value}>{option.label}</SelectItem>)}
      </SelectContent>
    </Select>
  )
}
