'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/shared/components/ui/alert-dialog'
import {
  AdminLandingDestinationResponseSchema,
  LandingDestinationDeleteResponseSchema,
} from '../schemas/landing-pages'
import { callLandingAdminApi } from '../lib/landing-admin-api'
import type { AdminLandingDestinationDto, EligibleLandingCityDto } from '../types/landing-pages'
import { adminLandingCityHref, AdminLandingDestinationTable } from './AdminLandingDestinationTable'

type Props = { initialDestinations: AdminLandingDestinationDto[]; eligibleCities: EligibleLandingCityDto[] }

// Spec 076 US-01 : liste des villes ; l'édition se fait sur la page de chaque ville.
export function AdminLandingPages({ initialDestinations, eligibleCities }: Props) {
  const router = useRouter()
  const [serverDestinations, setServerDestinations] = useState(initialDestinations)
  const [destinations, setDestinations] = useState(initialDestinations)
  const [serverCities, setServerCities] = useState(eligibleCities)
  const [cities, setCities] = useState(eligibleCities)
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [cityId, setCityId] = useState('')
  const [deleting, setDeleting] = useState<AdminLandingDestinationDto | null>(null)
  const [error, setError] = useState<string[] | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  if (serverDestinations !== initialDestinations) {
    setServerDestinations(initialDestinations)
    setDestinations(initialDestinations)
  }
  if (serverCities !== eligibleCities) {
    setServerCities(eligibleCities)
    setCities(eligibleCities)
  }

  const busy = Boolean(pendingId)

  function replaceActive(id: string, isActive: boolean) {
    setDestinations(current => current.map(destination => destination.id === id ? { ...destination, is_active: isActive } : destination))
  }

  async function publish(destination: AdminLandingDestinationDto, active: boolean) {
    if (busy) return
    setPendingId(destination.id)
    setError(null)
    setMessage(null)
    replaceActive(destination.id, active)
    const result = await callLandingAdminApi(`/api/admin/landing-pages/${destination.id}/publication`, 'PATCH', AdminLandingDestinationResponseSchema, { is_active: active })
    setPendingId(null)
    if (!result.ok) { replaceActive(destination.id, destination.is_active); setError(result.errors); return }
    setDestinations(current => current.map(row => row.id === result.data.id ? result.data : row))
    setMessage(active ? 'Landings activées.' : 'Landings archivées.')
    router.refresh()
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!cityId || busy) return
    setPendingId('create')
    setError(null)
    const result = await callLandingAdminApi('/api/admin/landing-pages', 'POST', AdminLandingDestinationResponseSchema, { city_id: cityId })
    setPendingId(null)
    if (!result.ok) { setError(result.errors); return }
    // Spec 076 AC-01-03 : la ville créée s'ouvre dans sa page d'édition.
    router.push(adminLandingCityHref(result.data.city.slug))
  }

  async function remove() {
    if (!deleting || busy) return
    const destination = deleting
    setPendingId(destination.id)
    setError(null)
    const result = await callLandingAdminApi(`/api/admin/landing-pages/${destination.id}`, 'DELETE', LandingDestinationDeleteResponseSchema)
    setPendingId(null)
    if (!result.ok) { setError(result.errors); return }
    setDestinations(current => current.filter(row => row.id !== destination.id))
    setDeleting(null)
    setMessage('Landings supprimées.')
    router.refresh()
  }

  return <div className="min-w-0 space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-4 rounded-[25px] border border-gray-50 bg-white p-6 shadow-sm sm:p-8">
      <div>
        <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">SEO local</p>
        <h1 className="mt-2 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">Landing pages</h1>
        <p className="mt-2 text-sm text-gray-500">Conciergerie, séminaires et locations de vacances : trois pages par ville.</p>
      </div>
      <Button type="button" disabled={cities.length === 0 || busy} onClick={() => setAdding(!adding)} className="bg-[#0B1437] text-white hover:bg-[#16204a]">
        <Plus aria-hidden="true" />Ajouter une ville
      </Button>
    </header>

    {adding ? <form onSubmit={create} className="flex flex-wrap items-end gap-3 rounded-[20px] border border-gray-100 bg-white p-5 shadow-sm">
      <div className="w-full min-w-0 space-y-2 sm:w-72"><label htmlFor="landing-city" className="text-sm font-semibold text-gray-700">Ville existante</label>
        <Select value={cityId} onValueChange={setCityId} disabled={busy}><SelectTrigger id="landing-city"><SelectValue placeholder="Choisir une ville" /></SelectTrigger><SelectContent>{cities.map(city => <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>)}</SelectContent></Select>
      </div>
      <Button type="submit" disabled={!cityId || busy}>Créer les landings</Button>
    </form> : null}

    {error && !deleting ? <div role="alert" className="break-words rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">{error.map((line, index) => <p key={index}>{line}</p>)}</div> : null}
    {message ? <p role="status" className="text-sm font-medium text-emerald-700">{message}</p> : null}

    <AdminLandingDestinationTable destinations={destinations} pendingId={pendingId} onPublication={publish} onDelete={destination => { setError(null); setDeleting(destination) }} />

    <AlertDialog open={Boolean(deleting)} onOpenChange={open => { if (!open && !busy) setDeleting(null) }}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Supprimer les landings de {deleting?.city.name} ?</AlertDialogTitle><AlertDialogDescription>Les trois pages et leurs avis seront supprimés. Les logements, POI, articles, guides et la ville sont conservés.</AlertDialogDescription></AlertDialogHeader>
        {error ? <p role="alert" aria-live="assertive" className="break-words text-sm text-red-700">{error.join(' ')}</p> : null}
        <AlertDialogFooter><AlertDialogCancel disabled={busy}>Annuler</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={event => { event.preventDefault(); void remove() }}>Supprimer les landings</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
}
