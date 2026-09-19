'use client'

import { useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger,
} from '@/shared/components/ui/dialog'
import { CityUpdateSchema } from '@/features/admin/schemas/city'

type City = { slug: string; name: string; postal_code: string }

export function AdminCityEditButton({ city }: { city: City }) {
  const router = useRouter()
  const fieldId = useId()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState(city.name)
  const [postalCode, setPostalCode] = useState(city.postal_code)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function changeOpen(next: boolean) {
    if (busy) return
    if (next) {
      setName(city.name)
      setPostalCode(city.postal_code)
      setError(null)
    }
    setOpen(next)
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (busy) return
    const parsed = CityUpdateSchema.safeParse({ name, postal_code: postalCode })
    if (!parsed.success) {
      setError(parsed.error.issues[0].message)
      return
    }
    setBusy(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/cities/${encodeURIComponent(city.slug)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      })
      if (!response.ok) {
        const payload = await response.json().catch(() => null) as { error?: { message?: string } } | null
        setError(payload?.error?.message ?? 'Modification impossible.')
        return
      }
      setOpen(false)
      router.refresh()
    } catch {
      setError('Erreur réseau. Réessayez.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={changeOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-10 gap-2 rounded-xl border-gray-100 px-4 text-[13px] font-bold text-[#0B1437]">
          <Pencil aria-hidden="true" />
          Modifier
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-2xl text-left whitespace-normal">
        <DialogHeader>
          <DialogTitle>Modifier la ville</DialogTitle>
          <DialogDescription>
            Corrigez les informations de {city.name}. Les liens et QR codes existants sont conservés.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-5" aria-busy={busy}>
          <div className="space-y-2">
            <Label htmlFor={`${fieldId}-name`}>Nom</Label>
            <Input id={`${fieldId}-name`} value={name} onChange={event => setName(event.target.value)} required minLength={2} maxLength={120} disabled={busy} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${fieldId}-postal`}>Code postal</Label>
            <Input id={`${fieldId}-postal`} value={postalCode} onChange={event => setPostalCode(event.target.value)} required inputMode="numeric" pattern="[0-9]{5}" maxLength={5} disabled={busy} />
          </div>
          {error && <p role="alert" className="text-sm text-rose-600">{error}</p>}
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => changeOpen(false)} disabled={busy}>Annuler</Button>
            <Button type="submit" className="bg-[#0B1437] text-white" disabled={busy}>
              {busy ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
