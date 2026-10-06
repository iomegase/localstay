'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/shared/components/ui/button'
import type { ReviewMemoryDto } from '../queries/review-memory'

/** Spec 071 AC-03-03 : lieux exclus ou rejetés, réintégrables. */
export function AdminReviewMemoryList({ memories }: { memories: ReviewMemoryDto[] }) {
  const router = useRouter()
  const [pendingId, setPendingId] = useState<string | null>(null)

  async function reinstate(id: string) {
    setPendingId(id)
    try {
      const response = await fetch(`/api/admin/poi-acquisition/memories/${id}`, { method: 'DELETE' })
      if (response.ok) router.refresh()
    } finally {
      setPendingId(null)
    }
  }

  if (memories.length === 0) {
    return <p className="text-sm text-gray-500">Aucun lieu exclu ou rejeté.</p>
  }

  return (
    <ul className="divide-y divide-gray-50">
      {memories.map(memory => (
        <li key={memory.id} aria-label={memory.name} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="min-w-0">
            <p className="text-[13px] font-bold text-neutral-900">{memory.name}</p>
            <p className="text-[11px] text-gray-500">{memory.address} · {memory.city.name}</p>
          </div>
          <div className="flex items-center gap-3">
            <span className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              {memory.kind === 'excluded' ? 'Exclu' : `Rejeté — ${memory.category?.name ?? ''}`}
            </span>
            <Button type="button" size="sm" variant="outline" disabled={pendingId === memory.id} onClick={() => void reinstate(memory.id)}>
              Réintégrer
            </Button>
          </div>
        </li>
      ))}
    </ul>
  )
}
