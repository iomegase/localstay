'use client'

import { useState, type FormEvent } from 'react'
import { Pencil } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/shared/components/ui/dialog'
import type { AcquisitionCandidateDto } from '../types'
import { DescriptionSourcesList } from '@/shared/components/DescriptionSourcesList'

type CategoryOption = { id: string; name: string; subcategories?: Array<{ id: string; name: string }> }

const fieldClass = 'h-10 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-neutral-900 focus:border-[#0B1437] focus:outline-none'

function emptyToNull(value: string): string | null {
  const trimmed = value.trim()
  return trimmed.length > 0 ? trimmed : null
}

/** Spec 071 US-01 : corriger un candidat (catégorie comprise) avant publication. */
export function AdminCandidateEditDialog({
  candidate,
  categories,
}: {
  candidate: Pick<AcquisitionCandidateDto, 'id' | 'name' | 'address' | 'phone' | 'website' | 'description' | 'category_id' | 'subcategory_id'> & Partial<Pick<AcquisitionCandidateDto, 'description_sources'>>
  categories: CategoryOption[]
}) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState({
    name: candidate.name,
    address: candidate.address,
    phone: candidate.phone ?? '',
    website: candidate.website ?? '',
    description: candidate.description ?? '',
    category_id: candidate.category_id,
    subcategory_id: candidate.subcategory_id ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const subcategories = categories.find(category => category.id === form.category_id)?.subcategories ?? []

  function update(field: keyof typeof form, value: string) {
    setForm(current => ({
      ...current,
      [field]: value,
      ...(field === 'category_id' ? { subcategory_id: '' } : {}),
    }))
  }

  async function submit(event: FormEvent) {
    event.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const response = await fetch(`/api/admin/poi-acquisition/candidates/${candidate.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name.trim(),
          address: form.address.trim(),
          phone: emptyToNull(form.phone),
          website: emptyToNull(form.website),
          description: emptyToNull(form.description),
          category_id: form.category_id,
          subcategory_id: form.subcategory_id || null,
        }),
      })
      const json = await response.json().catch(() => null) as { error?: { message?: string } } | null
      if (!response.ok) {
        setError(json?.error?.message ?? 'Enregistrement impossible.')
        return
      }
      window.location.reload()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          type="button"
          aria-label="Modifier"
          title="Modifier"
          className="flex h-[32px] w-[32px] shrink-0 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-50 hover:text-[#0B1437]"
        >
          <Pencil aria-hidden="true" size={14} strokeWidth={2.5} />
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Modifier le candidat</DialogTitle>
          <DialogDescription>Corrigez les informations ou la catégorie avant de publier. Une nouvelle adresse est regéocodée.</DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="grid gap-3">
          <label className="grid gap-1 text-xs font-semibold text-gray-500">Nom
            <input className={fieldClass} value={form.name} onChange={event => update('name', event.target.value)} required />
          </label>
          <label className="grid gap-1 text-xs font-semibold text-gray-500">Adresse
            <input className={fieldClass} value={form.address} onChange={event => update('address', event.target.value)} required />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-semibold text-gray-500">Catégorie
              <select className={fieldClass} value={form.category_id} onChange={event => update('category_id', event.target.value)}>
                {categories.map(category => <option key={category.id} value={category.id}>{category.name}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-semibold text-gray-500">Sous-catégorie
              <select className={fieldClass} value={form.subcategory_id} onChange={event => update('subcategory_id', event.target.value)}>
                <option value="">Aucune</option>
                {subcategories.map(subcategory => <option key={subcategory.id} value={subcategory.id}>{subcategory.name}</option>)}
              </select>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="grid gap-1 text-xs font-semibold text-gray-500">Téléphone
              <input className={fieldClass} value={form.phone} onChange={event => update('phone', event.target.value)} />
            </label>
            <label className="grid gap-1 text-xs font-semibold text-gray-500">Site web
              <input className={fieldClass} value={form.website} onChange={event => update('website', event.target.value)} placeholder="https://" />
            </label>
          </div>
          <label className="grid gap-1 text-xs font-semibold text-gray-500">Description
            <textarea
              className="min-h-28 w-full rounded-xl border border-gray-200 bg-white p-3 text-sm text-neutral-900 focus:border-[#0B1437] focus:outline-none"
              value={form.description}
              onChange={event => update('description', event.target.value)}
            />
          </label>
          {/* Spec 094 AC-02 : pages ayant servi à rédiger la description. */}
          <DescriptionSourcesList sources={candidate.description_sources ?? []} />
          {error && <p role="alert" className="text-sm font-semibold text-rose-600">{error}</p>}
          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>Annuler</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Enregistrement…' : 'Enregistrer'}</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
