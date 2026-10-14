'use client'

import { useMemo, useState } from 'react'
import { ImageOff, Plus } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/shared/components/ui/dialog'
import { formatEuros } from '../lib/pricing'
import {
  SEMINAR_ACTIVITY_CATEGORIES,
  SEMINAR_ACTIVITY_CATEGORY_LABELS,
  type SeminarActivityAdmin,
  type SeminarActivityCategory,
  type SeminarSurfaceOption,
} from '../types'
import { SeminarActivityEditor } from './SeminarActivityEditor'
import { SeminarSurfaceOrder } from './SeminarSurfaceOrder'

type Status = 'published' | 'draft' | 'no_image'
type StatusFilter = Status | 'all'

const STATUS_LABELS: Record<Status, string> = { published: 'Publiée', draft: 'Brouillon', no_image: 'Sans image' }
const STATUS_TONES: Record<Status, string> = {
  published: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  draft: 'bg-gray-50 text-gray-600 border-gray-200',
  no_image: 'bg-amber-50 text-amber-800 border-amber-200',
}

function statusOf(activity: SeminarActivityAdmin): Status {
  if (!activity.image_url) return 'no_image'
  return activity.is_published ? 'published' : 'draft'
}

function priceSummary(activity: SeminarActivityAdmin): string {
  const parts = [
    activity.price_per_person_cents !== null ? `${formatEuros(activity.price_per_person_cents)} / pers.` : null,
    activity.price_per_group_cents !== null ? `${formatEuros(activity.price_per_group_cents)} / groupe` : null,
  ].filter(Boolean)
  return parts.length ? `${parts.join(' + ')} HT` : '—'
}

function surfaceSummary(activity: SeminarActivityAdmin, surfaces: SeminarSurfaceOption[]): string {
  const names = activity.placements.map(placement => (
    placement.destination_id
      ? surfaces.find(surface => surface.destination_id === placement.destination_id)?.city_name ?? 'Landing'
      : 'Page Séminaires'
  ))
  return names.length ? names.join(', ') : 'Non diffusée'
}

/** Spec 097 UI admin : catalogue filtrable, panneau d'édition latéral, ordre par page. */
export function AdminSeminarActivities({ activities, surfaces }: { activities: SeminarActivityAdmin[]; surfaces: SeminarSurfaceOption[] }) {
  const [tab, setTab] = useState<'catalogue' | 'order'>('catalogue')
  const [category, setCategory] = useState<SeminarActivityCategory | 'all'>('all')
  const [status, setStatus] = useState<StatusFilter>('all')
  // null = fermé, 'new' = création, sinon id de l'activité éditée.
  const [selected, setSelected] = useState<string | null>(null)

  const visible = useMemo(() => activities.filter(activity =>
    (category === 'all' || activity.category === category) && (status === 'all' || statusOf(activity) === status),
  ), [activities, category, status])
  const editing = selected && selected !== 'new' ? activities.find(activity => activity.id === selected) ?? null : null

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Vues">
        {(['catalogue', 'order'] as const).map(value => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            onClick={() => setTab(value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${tab === value ? 'bg-neutral-900 text-white' : 'bg-white text-gray-600 shadow-sm'}`}
          >
            {value === 'catalogue' ? 'Catalogue' : 'Ordre d’affichage'}
          </button>
        ))}
      </div>

      {tab === 'order' ? (
        <SeminarSurfaceOrder activities={activities} surfaces={surfaces} />
      ) : (
        <>
          <div className="flex flex-wrap items-end gap-3">
            <Button type="button" onClick={() => setSelected('new')}>
              <Plus className="h-4 w-4" /> Nouvelle activité
            </Button>
            <label className="grid gap-1 text-xs font-semibold text-gray-500">Catégorie
              <select value={category} className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm text-neutral-900" onChange={event => setCategory(event.target.value as SeminarActivityCategory | 'all')}>
                <option value="all">Toutes</option>
                {SEMINAR_ACTIVITY_CATEGORIES.map(value => <option key={value} value={value}>{SEMINAR_ACTIVITY_CATEGORY_LABELS[value]}</option>)}
              </select>
            </label>
            <label className="grid gap-1 text-xs font-semibold text-gray-500">Statut
              <select value={status} className="h-9 rounded-lg border border-gray-200 bg-white px-2 text-sm text-neutral-900" onChange={event => setStatus(event.target.value as StatusFilter)}>
                <option value="all">Tous</option>
                {(Object.keys(STATUS_LABELS) as Status[]).map(value => <option key={value} value={value}>{STATUS_LABELS[value]}</option>)}
              </select>
            </label>
            <p className="ml-auto text-xs text-gray-500">{visible.length} activité{visible.length > 1 ? 's' : ''}</p>
          </div>

          {visible.length === 0 ? (
            <p className="rounded-[25px] bg-white p-8 text-sm text-gray-500 shadow-sm">Aucune activité pour ces filtres.</p>
          ) : (
            <ul className="grid gap-3">
              {visible.map(activity => {
                const activityStatus = statusOf(activity)
                return (
                  <li key={activity.id} data-testid="seminar-activity-row" className="flex flex-wrap items-center gap-4 rounded-[20px] border border-gray-100 bg-white p-4 shadow-sm">
                    {activity.image_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={activity.image_url} alt="" className="h-14 w-20 shrink-0 rounded-lg object-cover" />
                    ) : (
                      <span className="grid h-14 w-20 shrink-0 place-items-center rounded-lg bg-gray-50 text-gray-300"><ImageOff className="h-5 w-5" /></span>
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">{SEMINAR_ACTIVITY_CATEGORY_LABELS[activity.category]}</p>
                      <p className="truncate text-sm font-bold text-neutral-900">{activity.title}</p>
                      <p className="mt-1 text-xs text-gray-500">
                        {priceSummary(activity)} · {activity.providers.length} prestataire{activity.providers.length > 1 ? 's' : ''} · {surfaceSummary(activity, surfaces)}
                      </p>
                    </div>
                    <span className={`rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-wider ${STATUS_TONES[activityStatus]}`}>
                      {STATUS_LABELS[activityStatus]}
                    </span>
                    <Button type="button" variant="outline" onClick={() => setSelected(activity.id)}>Modifier</Button>
                  </li>
                )
              })}
            </ul>
          )}
        </>
      )}

      <Dialog open={selected !== null} onOpenChange={open => !open && setSelected(null)}>
        <DialogContent className="left-auto right-0 top-0 h-dvh max-w-xl translate-x-0 translate-y-0 overflow-y-auto rounded-none data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right sm:rounded-none">
          <DialogTitle>{editing ? editing.title : 'Nouvelle activité'}</DialogTitle>
          <DialogDescription>Les prix et les prestataires restent internes : ils ne sont jamais publiés.</DialogDescription>
          {selected !== null && (
            <SeminarActivityEditor
              // Remonte l'éditeur quand l'activité créée apparaît après rafraîchissement.
              key={`${selected}:${editing ? 'loaded' : 'empty'}`}
              activity={editing}
              surfaces={surfaces}
              onSaved={id => setSelected(id)}
              onClose={() => setSelected(null)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
