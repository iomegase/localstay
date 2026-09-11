'use client'

import { Fragment, type ReactNode } from 'react'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Switch } from '@/shared/components/ui/switch'
import type { AdminLandingDestinationDto } from '../types/landing-pages'

type Props = {
  destinations: AdminLandingDestinationDto[]
  pendingId: string | null
  selectedId: string | null
  onEdit: (destination: AdminLandingDestinationDto) => void
  onPublication: (destination: AdminLandingDestinationDto, active: boolean) => void
  onDelete: (destination: AdminLandingDestinationDto) => void
  editor: ReactNode
}

function Publication({ published }: { published: boolean }) {
  return <span className={published ? 'text-emerald-700' : 'text-slate-500'}>{published ? 'Publiée' : 'Non publiée'}</span>
}

function DestinationActions({ destination, pending, selected, onEdit, onPublication, onDelete }: {
  destination: AdminLandingDestinationDto
  pending: boolean
  selected: boolean
} & Pick<Props, 'onEdit' | 'onPublication' | 'onDelete'>) {
  return <div className="flex flex-wrap items-center gap-2">
    <Switch checked={destination.is_active} disabled={pending} aria-label={`${destination.is_active ? 'Archiver' : 'Activer'} ${destination.city.name}`} onCheckedChange={active => onPublication(destination, active)} />
    <Button type="button" variant="ghost" size="icon" disabled={pending} aria-label={`Modifier ${destination.city.name}`} aria-expanded={selected} onClick={() => onEdit(destination)}><Pencil aria-hidden="true" /></Button>
    <Button type="button" variant="ghost" size="icon" disabled={pending} aria-label={`Supprimer les landings de ${destination.city.name}`} onClick={() => onDelete(destination)}><Trash2 aria-hidden="true" /></Button>
  </div>
}

export function AdminLandingDestinationTable({ destinations, pendingId, selectedId, onEdit, onPublication, onDelete, editor }: Props) {
  const actions = (destination: AdminLandingDestinationDto) => <DestinationActions destination={destination} pending={Boolean(pendingId)} selected={selectedId === destination.id} onEdit={onEdit} onPublication={onPublication} onDelete={onDelete} />
  const selected = destinations.find(destination => destination.id === selectedId)
  if (!destinations.length) return <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">Aucune ville configurée.</p>
  return <>
    <table aria-label="Landings par ville" className="hidden w-full table-fixed border-separate border-spacing-0 rounded-2xl border border-slate-200 bg-white text-left text-sm md:table">
      <thead className="text-xs text-slate-500"><tr>
        <th scope="col" className="p-3">Ville</th><th scope="col" className="p-3">Conciergerie</th><th scope="col" className="p-3">Séminaires</th><th scope="col" className="p-3">Locations de vacances</th><th scope="col" className="w-16 p-3">Avis</th><th scope="col" className="w-40 p-3">Actions</th>
      </tr></thead>
      <tbody>{destinations.map(destination => <Fragment key={destination.id}>
        <tr className="align-top">
          <th scope="row" className="break-words border-t border-slate-100 p-3 font-semibold">{destination.city.name}</th>
          <td className="border-t border-slate-100 p-3"><Publication published={destination.publication.concierge} /></td>
          <td className="border-t border-slate-100 p-3"><Publication published={destination.publication.seminar} /></td>
          <td className="break-words border-t border-slate-100 p-3">{destination.publicLodgingCount === 0 ? <span className="text-slate-500">Aucun logement associé</span> : <Publication published={destination.publication.vacationRental} />}</td>
          <td className="border-t border-slate-100 p-3">{destination.reviewCount}</td>
          <td className="border-t border-slate-100 p-3">{actions(destination)}</td>
        </tr>
      </Fragment>)}</tbody>
    </table>
    <div data-testid="landing-mobile-cards" className="space-y-3 md:hidden">{destinations.map(destination => <article key={destination.id} className="min-w-0 space-y-4 rounded-2xl border border-slate-200 bg-white p-4" aria-label={`Landings de ${destination.city.name}`}>
      <h2 className="break-words font-semibold text-slate-950">{destination.city.name}</h2>
      <dl className="space-y-2 text-sm">
        <div className="flex flex-wrap justify-between gap-2"><dt>Conciergerie</dt><dd><Publication published={destination.publication.concierge} /></dd></div>
        <div className="flex flex-wrap justify-between gap-2"><dt>Séminaires</dt><dd><Publication published={destination.publication.seminar} /></dd></div>
        <div className="flex flex-wrap justify-between gap-2"><dt>Locations de vacances</dt><dd>{destination.publicLodgingCount === 0 ? <span className="text-slate-500">Aucun logement associé</span> : <Publication published={destination.publication.vacationRental} />}</dd></div>
        <div className="flex justify-between gap-2"><dt>Avis</dt><dd>{destination.reviewCount}</dd></div>
      </dl>
      {actions(destination)}
    </article>)}</div>
    {selected && editor ? <section aria-labelledby="landing-editor-title" className="mt-4 min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
      <h2 id="landing-editor-title" className="mb-2 text-lg font-semibold text-slate-950">Modifier les landings de {selected.city.name}</h2>
      {editor}
    </section> : null}
  </>
}
