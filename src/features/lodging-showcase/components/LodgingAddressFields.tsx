'use client'

import { useState } from 'react'
import { Loader2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Label } from '@/shared/components/ui/label'

export type LodgingAddressValue = {
  address_number: string | null
  address_street: string | null
  address_postal_code: string | null
  address_city: string | null
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

/**
 * Spec 080 AC-03-02 : l'adresse privée du logement se saisit dans la section
 * Caractéristiques (4 champs) puis est reprise par le Guide. Enregistrement à part
 * de la fiche publique : l'adresse n'est jamais publiée ni soumise à validation.
 */
export function LodgingAddressFields({
  lodgingId,
  initial,
  defaultCity,
}: {
  lodgingId: string
  initial: LodgingAddressValue
  defaultCity: string
}) {
  const [value, setValue] = useState<LodgingAddressValue>({ ...initial, address_city: initial.address_city ?? defaultCity })
  const [state, setState] = useState<SaveState>('idle')
  const [message, setMessage] = useState<string | null>(null)
  const set = (key: keyof LodgingAddressValue, next: string) => {
    setValue(current => ({ ...current, [key]: next }))
    setState('idle')
  }

  async function save() {
    setState('saving')
    setMessage(null)
    const response = await fetch(`/api/dashboard/lodgings/${lodgingId}/address`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        address_number: value.address_number || null,
        address_street: value.address_street || null,
        address_postal_code: value.address_postal_code || null,
        address_city: value.address_city || null,
      }),
    }).catch(() => null)
    if (!response?.ok) {
      const body: unknown = await response?.json().catch(() => null)
      const issue = (body as { error?: { details?: { issues?: { message?: string }[] } } } | null)?.error?.details?.issues?.[0]?.message
      setMessage(issue ?? 'L’adresse n’a pas pu être enregistrée.')
      setState('error')
      return
    }
    setState('saved')
  }

  return (
    <div data-testid="lodging-address-fields" className="rounded-xl border border-gray-100 bg-gray-50/60 p-4 sm:col-span-2 lg:col-span-3">
      <p className="text-[13px] font-semibold text-gray-700">
        Adresse du logement <span className="font-normal text-gray-400">· privée, jamais affichée · reprise dans le Guide</span>
      </p>
      <div className="mt-3 grid gap-3 sm:grid-cols-[110px_1fr] lg:grid-cols-[110px_1fr_130px_1fr]">
        <div className="space-y-1.5">
          <Label htmlFor="address-number">Numéro</Label>
          <Input id="address-number" maxLength={10} value={value.address_number ?? ''} onChange={event => set('address_number', event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address-street">Rue</Label>
          <Input id="address-street" maxLength={200} value={value.address_street ?? ''} onChange={event => set('address_street', event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address-postal-code">Code postal</Label>
          <Input id="address-postal-code" inputMode="numeric" maxLength={5} value={value.address_postal_code ?? ''} onChange={event => set('address_postal_code', event.target.value)} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="address-city">Ville</Label>
          <Input id="address-city" maxLength={120} value={value.address_city ?? ''} onChange={event => set('address_city', event.target.value)} />
        </div>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <Button type="button" size="sm" variant="outline" disabled={state === 'saving'} onClick={() => void save()}>
          {state === 'saving' && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
          Enregistrer l’adresse
        </Button>
        {state === 'saved' && <p role="status" className="text-xs text-emerald-700">Adresse enregistrée, le Guide est à jour.</p>}
        {state === 'error' && <p role="alert" className="text-xs text-red-600">{message}</p>}
      </div>
    </div>
  )
}
