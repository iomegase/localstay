'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/shared/components/ui/button'

type Claim = {
  id: string
  merchant_id: string
  poi_id: string
  status: string
  created_at: Date | string
  merchant_email?: string
  poi_name?: string
  city_name?: string
}

export function AdminMerchantClaimsClient({ claims }: { claims: Claim[] }) {
  const router = useRouter()
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function approve(id: string) {
    setBusyId(id)
    setError(null)
    try {
      const response = await fetch(`/api/admin/merchant-claims/${id}/approve`, { method: 'POST' })
      const json = await response.json()
      if (!response.ok) {
        setError(json.error?.message ?? 'Validation impossible.')
        return
      }
      router.refresh()
    } finally {
      setBusyId(null)
    }
  }

  async function reject(id: string) {
    const adminNote = window.prompt('Motif du rejet')
    if (!adminNote) return

    setBusyId(id)
    setError(null)
    try {
      const response = await fetch(`/api/admin/merchant-claims/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ admin_note: adminNote }),
      })
      const json = await response.json()
      if (!response.ok) {
        setError(json.error?.message ?? 'Rejet impossible.')
        return
      }
      router.refresh()
    } finally {
      setBusyId(null)
    }
  }

  if (claims.length === 0) {
    return <p className="rounded-xl border border-charcoal/10 bg-white p-6 text-sm text-charcoal/60">Aucune revendication en attente.</p>
  }

  return (
    <div className="space-y-4">
      {error && <p className="rounded-lg bg-red-50 px-4 py-2 text-sm text-red-700">{error}</p>}
      {claims.map(claim => (
        <div key={claim.id} className="rounded-xl border border-charcoal/10 bg-white p-5">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="font-medium text-charcoal">{claim.poi_name ?? `POI ${claim.poi_id}`}</p>
              <p className="text-sm text-charcoal/60">
                {claim.merchant_email ?? `Merchant ${claim.merchant_id}`} · {claim.city_name ?? 'Ville inconnue'} · {new Date(claim.created_at).toLocaleDateString('fr-FR')}
              </p>
            </div>
            <div className="flex gap-2">
              <Button type="button" onClick={() => approve(claim.id)} disabled={busyId === claim.id}>
                Valider
              </Button>
              <Button type="button" variant="outline" onClick={() => reject(claim.id)} disabled={busyId === claim.id}>
                Rejeter
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
