'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'

type Props = { userId: string; email: string; role: string; lodgingCount: number }

export function DeleteUserButton({ userId, email, role, lodgingCount }: Props) {
  const router = useRouter()
  const [pending, setPending] = useState(false)

  if (role === 'admin') return null

  async function handleDelete() {
    const ok = window.confirm(
      `Supprimer définitivement ${email} et ses ${lodgingCount} logement(s) ? Action irréversible.`,
    )
    if (!ok) return
    setPending(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
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
      aria-label={`Supprimer ${email}`}
      className="inline-flex items-center justify-center rounded-lg p-2 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
    >
      <Trash2 className="h-4 w-4" />
    </button>
  )
}
