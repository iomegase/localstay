'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { CategoryIcon } from '@/features/city-guide/lib/category-icon'
import { PRACTICAL_BLOCK_ICONS } from '@/features/guide-customization/lib/practical-block-icons'
import type { EquipmentTemplate, EquipmentTemplateStatus } from '../types'

const STATUS_LABELS: Record<EquipmentTemplateStatus, string> = { pending: 'À valider', approved: 'Validé', rejected: 'Refusé' }
const STATUS_TONES: Record<EquipmentTemplateStatus, string> = {
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  rejected: 'bg-gray-50 text-gray-500 border-gray-200',
}

/** Spec 095 AC-03-01 / AC-03-02 : relire, modifier, valider ou refuser. */
export function AdminEquipmentLibrary({ templates }: { templates: EquipmentTemplate[] }) {
  if (templates.length === 0) {
    return <p className="rounded-[25px] bg-white p-8 text-sm text-gray-500 shadow-sm">Aucun équipement pour l’instant : ils apparaîtront ici dès qu’un propriétaire en enregistrera.</p>
  }
  return (
    <ul className="grid gap-4">
      {templates.map(template => <EquipmentRow key={template.id} template={template} />)}
    </ul>
  )
}

function EquipmentRow({ template }: { template: EquipmentTemplate }) {
  const router = useRouter()
  const [title, setTitle] = useState(template.title)
  const [icon, setIcon] = useState(template.icon)
  const [body, setBody] = useState(template.body ?? '')
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const dirty = title !== template.title || icon !== template.icon || body !== (template.body ?? '')

  function save(status?: EquipmentTemplateStatus) {
    setError(null)
    startTransition(async () => {
      const response = await fetch(`/api/admin/equipment-library/${template.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, icon, body: body.trim() || null, ...(status ? { status } : {}) }),
      })
      if (!response.ok) {
        const json = await response.json().catch(() => null) as { error?: { message?: string } } | null
        setError(json?.error?.message ?? 'Enregistrement impossible')
        return
      }
      router.refresh()
    })
  }

  return (
    <li data-testid="equipment-template" className="space-y-3 rounded-[20px] border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${STATUS_TONES[template.status]}`}>
          {STATUS_LABELS[template.status]}
        </span>
        <div className="flex flex-wrap gap-2">
          {dirty && <Button type="button" variant="outline" disabled={pending} onClick={() => save()}>Enregistrer</Button>}
          {template.status !== 'approved' && <Button type="button" disabled={pending} onClick={() => save('approved')}>Valider</Button>}
          {template.status !== 'rejected' && <Button type="button" variant="outline" disabled={pending} onClick={() => save('rejected')}>Refuser</Button>}
        </div>
      </div>
      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <label className="grid gap-1 text-xs font-semibold text-gray-500">Nom de l’équipement
          <Input value={title} maxLength={120} onChange={event => setTitle(event.target.value)} />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-gray-500">Icône
          <span className="flex items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-gray-200"><CategoryIcon iconSlug={icon} className="h-4 w-4" /></span>
            <select value={icon} onChange={event => setIcon(event.target.value)} className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm">
              {PRACTICAL_BLOCK_ICONS.map(item => <option key={item.slug} value={item.slug}>{item.label}</option>)}
            </select>
          </span>
        </label>
      </div>
      <label className="grid gap-1 text-xs font-semibold text-gray-500">Texte
        <Textarea value={body} rows={4} onChange={event => setBody(event.target.value)} />
      </label>
      {error && <p role="alert" className="text-sm font-semibold text-rose-600">{error}</p>}
    </li>
  )
}
