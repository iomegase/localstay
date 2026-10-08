'use client'

import { useId, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { ImageUpload } from '@/shared/components/ImageUpload'
import { CategoryIcon } from '@/features/city-guide/lib/category-icon'
import { PRACTICAL_BLOCK_ICONS, DEFAULT_PRACTICAL_BLOCK_ICON } from '@/features/guide-customization/lib/practical-block-icons'
import { YouTubeUrlField } from '@/features/guide-customization/components/YouTubeUrlField'
import type { EquipmentTemplate, EquipmentTemplateStatus } from '../types'

const STATUS_LABELS: Record<EquipmentTemplateStatus, string> = { pending: 'À valider', approved: 'Validé', rejected: 'Refusé' }
const STATUS_TONES: Record<EquipmentTemplateStatus, string> = {
  pending: 'bg-amber-50 text-amber-800 border-amber-200',
  approved: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  rejected: 'bg-gray-50 text-gray-500 border-gray-200',
}

type Draft = { title: string; icon: string; body: string; photo_url: string | null; video_url: string | null }

function toDraft(template: EquipmentTemplate): Draft {
  return { title: template.title, icon: template.icon, body: template.body ?? '', photo_url: template.photo_url, video_url: template.video_url }
}

function toPayload(draft: Draft) {
  return {
    title: draft.title,
    icon: draft.icon,
    body: draft.body.trim() || null,
    photo_url: draft.photo_url,
    video_url: draft.video_url?.trim() || null,
  }
}

async function send(url: string, method: 'POST' | 'PATCH', payload: object): Promise<string | null> {
  const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  if (response.ok) return null
  const json = await response.json().catch(() => null) as { error?: { message?: string } } | null
  return json?.error?.message ?? 'Enregistrement impossible'
}

/** Spec 095 AC-03 / 096 US-01 : créer, modifier (photo et vidéo comprises), valider ou refuser. */
export function AdminEquipmentLibrary({ templates }: { templates: EquipmentTemplate[] }) {
  const [creating, setCreating] = useState(false)
  return (
    <div className="space-y-4">
      {creating ? (
        <NewEquipment onDone={() => setCreating(false)} />
      ) : (
        <Button type="button" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" /> Nouvel équipement
        </Button>
      )}
      {templates.length === 0 ? (
        <p className="rounded-[25px] bg-white p-8 text-sm text-gray-500 shadow-sm">Aucun équipement pour l’instant : créez le premier.</p>
      ) : (
        <ul className="grid gap-4">
          {templates.map(template => <EquipmentRow key={template.id} template={template} />)}
        </ul>
      )}
    </div>
  )
}

function NewEquipment({ onDone }: { onDone: () => void }) {
  const router = useRouter()
  const [draft, setDraft] = useState<Draft>({ title: '', icon: DEFAULT_PRACTICAL_BLOCK_ICON, body: '', photo_url: null, video_url: null })
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()

  function create() {
    setError(null)
    startTransition(async () => {
      const message = await send('/api/admin/equipment-library', 'POST', toPayload(draft))
      if (message) return setError(message)
      onDone()
      router.refresh()
    })
  }

  return (
    <div data-testid="equipment-template-new" className="space-y-3 rounded-[20px] border border-gray-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-bold text-neutral-900">Nouvel équipement</h2>
        <div className="flex gap-2">
          <Button type="button" variant="outline" disabled={pending} onClick={onDone}>Annuler</Button>
          <Button type="button" disabled={pending || !draft.title.trim()} onClick={create}>Créer</Button>
        </div>
      </div>
      <EquipmentFields draft={draft} onChange={patch => setDraft(current => ({ ...current, ...patch }))} />
      {error && <p role="alert" className="text-sm font-semibold text-rose-600">{error}</p>}
    </div>
  )
}

function EquipmentRow({ template }: { template: EquipmentTemplate }) {
  const router = useRouter()
  const [draft, setDraft] = useState<Draft>(() => toDraft(template))
  const [error, setError] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const initial = toDraft(template)
  const dirty = (Object.keys(initial) as Array<keyof Draft>).some(key => (draft[key] ?? '') !== (initial[key] ?? ''))

  function save(status?: EquipmentTemplateStatus) {
    setError(null)
    startTransition(async () => {
      const message = await send(`/api/admin/equipment-library/${template.id}`, 'PATCH', { ...toPayload(draft), ...(status ? { status } : {}) })
      if (message) return setError(message)
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
      <EquipmentFields draft={draft} onChange={patch => setDraft(current => ({ ...current, ...patch }))} />
      {error && <p role="alert" className="text-sm font-semibold text-rose-600">{error}</p>}
    </li>
  )
}

function EquipmentFields({ draft, onChange }: { draft: Draft; onChange: (patch: Partial<Draft>) => void }) {
  const videoId = useId()
  return (
    <>
      <div className="grid gap-3 md:grid-cols-[1fr_220px]">
        <label className="grid gap-1 text-xs font-semibold text-gray-500">Nom de l’équipement
          <Input value={draft.title} maxLength={120} onChange={event => onChange({ title: event.target.value })} />
        </label>
        <label className="grid gap-1 text-xs font-semibold text-gray-500">Icône
          <span className="flex items-center gap-2">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-gray-200"><CategoryIcon iconSlug={draft.icon} className="h-4 w-4" /></span>
            <select value={draft.icon} onChange={event => onChange({ icon: event.target.value })} className="h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm">
              {PRACTICAL_BLOCK_ICONS.map(item => <option key={item.slug} value={item.slug}>{item.label}</option>)}
            </select>
          </span>
        </label>
      </div>
      <label className="grid gap-1 text-xs font-semibold text-gray-500">Texte
        <Textarea value={draft.body} rows={4} onChange={event => onChange({ body: event.target.value })} />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500">Photo (optionnelle)</p>
          {draft.photo_url && (
            <div className="flex items-center gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={draft.photo_url} alt="Photo de l’équipement" className="h-16 w-24 rounded-lg object-cover" />
              <button
                type="button"
                onClick={() => onChange({ photo_url: null })}
                className="text-[10px] font-bold uppercase tracking-widest text-gray-500 hover:text-red-500"
              >
                Retirer la photo
              </button>
            </div>
          )}
          <ImageUpload
            endpoint="/api/admin/equipment-library/photo"
            onUploaded={url => onChange({ photo_url: url })}
            label="Téléverser une photo"
          />
        </div>
        <YouTubeUrlField
          id={videoId}
          label="Vidéo YouTube (optionnelle)"
          value={draft.video_url}
          onChange={url => onChange({ video_url: url })}
        />
      </div>
    </>
  )
}
