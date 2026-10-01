'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/shared/components/ui/button'

export function SeminarSelectionButton({ lodgingId, selected }: { lodgingId: string; selected: boolean }) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [refreshing, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const busy = saving || refreshing

  async function toggleSelection() {
    setSaving(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/lodgings/${lodgingId}/seminar-selection`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ seminar_selected: !selected }),
      })
      if (!response.ok) throw new Error('Impossible d’enregistrer la sélection. Réessayez.')
      startTransition(() => router.refresh())
    } catch {
      setError('Impossible d’enregistrer la sélection. Réessayez.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-2">
      {selected && <p className="text-xs font-medium text-emerald-700">Sélectionné pour les séminaires</p>}
      <Button type="button" size="sm" variant="outline" disabled={busy} aria-busy={busy} onClick={() => void toggleSelection()}>
        {busy ? 'Enregistrement…' : selected ? 'Retirer de la page Séminaires' : 'Ajouter à la page Séminaires'}
      </Button>
      {error && <p role="alert" className="text-xs text-red-700">{error}</p>}
    </div>
  )
}
