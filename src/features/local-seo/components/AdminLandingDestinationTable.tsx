'use client'

import Link from 'next/link'
import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Switch } from '@/shared/components/ui/switch'
import { issueCountByIntent, LANDING_TABS, tabForIntent } from '../lib/landing-editor'
import type { AdminLandingDestinationDto, LocalLandingIntent } from '../types/landing-pages'

type Props = {
  destinations: AdminLandingDestinationDto[]
  pendingId: string | null
  onPublication: (destination: AdminLandingDestinationDto, active: boolean) => void
  onDelete: (destination: AdminLandingDestinationDto) => void
}

export function adminLandingCityHref(citySlug: string, intent?: LocalLandingIntent): string {
  const base = `/admin/landing-pages/${encodeURIComponent(citySlug)}`
  return intent ? `${base}?onglet=${tabForIntent(intent)}` : base
}

function pageStatus(destination: AdminLandingDestinationDto, intent: LocalLandingIntent): { label: string; tone: string } {
  if (intent === 'VACATION_RENTAL' && destination.publicLodgingCount === 0) {
    return { label: 'Aucun logement', tone: 'border-gray-200 bg-gray-50 text-gray-500' }
  }
  const published = intent === 'CONCIERGE'
    ? destination.publication.concierge
    : intent === 'SEMINAR' ? destination.publication.seminar : destination.publication.vacationRental
  return published
    ? { label: 'Publiée', tone: 'border-emerald-100 bg-emerald-50 text-emerald-700' }
    : { label: 'Non publiée', tone: 'border-gray-200 bg-white text-gray-500' }
}

// Spec 076 US-01 : une ligne par ville, ses trois pages en pastilles cliquables.
export function AdminLandingDestinationTable({ destinations, pendingId, onPublication, onDelete }: Props) {
  if (!destinations.length) {
    return <p className="rounded-[25px] border border-dashed border-gray-200 bg-white p-8 text-center text-sm text-gray-500">Aucune ville configurée.</p>
  }

  return (
    <ul aria-label="Landings par ville" className="space-y-3">
      {destinations.map(destination => {
        const issues = issueCountByIntent(destination.contentIssues)
        return (
          <li key={destination.id} aria-label={destination.city.name} className="flex flex-col gap-4 rounded-[20px] border border-gray-100 bg-white p-5 shadow-sm lg:flex-row lg:items-center">
            <div className="min-w-0 lg:w-56">
              <Link href={adminLandingCityHref(destination.city.slug)} className="text-base font-bold text-neutral-900 hover:underline">{destination.city.name}</Link>
              <p className="mt-0.5 text-xs text-gray-500">{destination.reviewCount} avis · {destination.is_active ? 'Active' : 'Archivée'}</p>
            </div>

            <div className="flex flex-1 flex-wrap gap-2">
              {LANDING_TABS.filter(tab => tab.intent).map(tab => {
                const intent = tab.intent as LocalLandingIntent
                const status = pageStatus(destination, intent)
                return (
                  <Link
                    key={tab.key}
                    href={adminLandingCityHref(destination.city.slug, intent)}
                    aria-label={`${tab.label} : ${status.label}`}
                    className={`inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition hover:border-[#0B1437]/40 ${status.tone}`}
                  >
                    <span className="text-neutral-900">{tab.label}</span>
                    <span>{status.label}</span>
                    {issues[intent] > 0 ? <span title="Champs à compléter" className="rounded-full bg-rose-500 px-1.5 text-[10px] font-bold text-white">{issues[intent]}</span> : null}
                  </Link>
                )
              })}
            </div>

            <div className="flex items-center gap-2">
              <Switch checked={destination.is_active} disabled={Boolean(pendingId)} aria-label={`${destination.is_active ? 'Archiver' : 'Activer'} ${destination.city.name}`} onCheckedChange={active => onPublication(destination, active)} />
              <Button asChild variant="ghost" size="icon">
                <Link href={adminLandingCityHref(destination.city.slug)} aria-label={`Modifier ${destination.city.name}`}><Pencil aria-hidden="true" /></Link>
              </Button>
              <Button type="button" variant="ghost" size="icon" disabled={Boolean(pendingId)} aria-label={`Supprimer les landings de ${destination.city.name}`} onClick={() => onDelete(destination)}>
                <Trash2 aria-hidden="true" />
              </Button>
            </div>
          </li>
        )
      })}
    </ul>
  )
}
