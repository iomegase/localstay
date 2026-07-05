'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

type Props = { lodgingId: string; name: string }

export function DeleteLodgingButton({ lodgingId, name }: Props) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  async function handleDelete() {
    const ok = window.confirm(`Supprimer définitivement le logement ${name} ? Action irréversible.`)
    if (!ok) return
    setPending(true)
    try {
      const res = await fetch(`/api/admin/lodgings/${lodgingId}`, { method: 'DELETE' })
      if (!res.ok) {
        const body = await res.json().catch(() => ({}))
        alert(body?.message ?? 'Échec de la suppression')
        return
      }
      router.refresh()
    } finally {
      setPending(false)
    }
  }

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={pending}
      aria-label={`Supprimer ${name}`}
      className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
