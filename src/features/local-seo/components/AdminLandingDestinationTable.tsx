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
    <Button type="button" variant="ghost" size="icon" disabled={pending} aria-label={`Modifier ${destination.city.name}`} aria-expanded={selected} aria-controls={selected ? `landing-editor-${destination.id}` : undefined} onClick={() => onEdit(destination)}><Pencil aria-hidden="true" /></Button>
    <Button type="button" variant="ghost" size="icon" disabled={pending} aria-label={`Supprimer les landings de ${destination.city.name}`} onClick={() => onDelete(destination)}><Trash2 aria-hidden="true" /></Button>
  </div>
}

export function AdminLandingDestinationTable({ destinations, pendingId, selectedId, onEdit, onPublication, onDelete, editor }: Props) {
  const actions = (destination: AdminLandingDestinationDto) => <DestinationActions destination={destination} pending={Boolean(pendingId)} selected={selectedId === destination.id} onEdit={onEdit} onPublication={onPublication} onDelete={onDelete} />
  if (!destinations.length) return <p className="rounded-2xl border border-dashed border-slate-300 bg-white p-6 text-sm text-slate-500">Aucune ville configurée.</p>
  const cellClass = 'flex flex-wrap justify-between gap-2 p-3 md:table-cell md:border-t md:border-slate-100'
  return (
    <table role="table" aria-label="Landings par ville" className="block w-full table-fixed border-separate border-spacing-0 text-left text-sm md:table md:rounded-2xl md:border md:border-slate-200 md:bg-white">
      <thead role="rowgroup" className="hidden text-xs text-slate-500 md:table-header-group"><tr role="row">
        <th scope="col" className="p-3">Ville</th><th scope="col" className="p-3">Conciergerie</th><th scope="col" className="p-3">Séminaires</th><th scope="col" className="p-3">Locations de vacances</th><th scope="col" className="w-16 p-3">Avis</th><th scope="col" className="w-40 p-3">Actions</th>
      </tr></thead>
      <tbody role="rowgroup" data-testid="landing-mobile-cards" className="block space-y-3 md:table-row-group md:space-y-0">{destinations.map(destination => <Fragment key={destination.id}>
        <tr role="row" className="block min-w-0 rounded-2xl border border-slate-200 bg-white p-1 align-top md:table-row md:rounded-none md:border-0 md:p-0">
          <th role="rowheader" scope="row" className="block break-words p-3 font-semibold md:table-cell md:border-t md:border-slate-100">{destination.city.name}</th>
          <td role="cell" className={cellClass}><span aria-hidden="true" className="md:hidden">Conciergerie</span><Publication published={destination.publication.concierge} /></td>
          <td role="cell" className={cellClass}><span aria-hidden="true" className="md:hidden">Séminaires</span><Publication published={destination.publication.seminar} /></td>
          <td role="cell" className={`${cellClass} break-words`}><span aria-hidden="true" className="md:hidden">Locations de vacances</span>{destination.publicLodgingCount === 0 ? <span className="text-slate-500">Aucun logement associé</span> : <Publication published={destination.publication.vacationRental} />}</td>
          <td role="cell" className={cellClass}><span aria-hidden="true" className="md:hidden">Avis</span><span>{destination.reviewCount}</span></td>
          <td role="cell" className="block p-3 md:table-cell md:border-t md:border-slate-100">{actions(destination)}</td>
        </tr>
        {selectedId === destination.id && editor ? <tr role="row" className="block md:table-row">
          <td role="cell" colSpan={6} className="block min-w-0 md:table-cell md:p-3">
            <section id={`landing-editor-${destination.id}`} aria-labelledby="landing-editor-title" className="min-w-0 rounded-2xl border border-slate-200 bg-white p-4 sm:p-5">
              <h2 id="landing-editor-title" className="mb-2 text-lg font-semibold text-slate-950">Modifier les landings de {destination.city.name}</h2>
              {editor}
            </section>
          </td>
        </tr> : null}
      </Fragment>)}</tbody>
    </table>
  )
}
