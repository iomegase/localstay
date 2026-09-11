'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Plus } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/shared/components/ui/alert-dialog'
import type { ZodType } from 'zod'
import {
  AdminLandingDestinationResponseSchema,
  LandingAdminApiErrorResponseSchema,
  LandingDestinationDeleteResponseSchema,
} from '../schemas/landing-pages'
import type { AdminLandingDestinationDto, EligibleLandingCityDto, LocalLandingPageInput } from '../types/landing-pages'
import { AdminLandingDestinationTable } from './AdminLandingDestinationTable'
import { AdminLandingReviews } from './AdminLandingReviews'
import { LandingPageEditor } from './LandingPageEditor'

// API details include both per-intent missing fields and nested Zod field errors.
function errorDetails(value: unknown, path = ''): string[] {
  if (typeof value === 'string') return [`${path ? `${path} : ` : ''}${value}`]
  if (Array.isArray(value)) return value.flatMap(item => errorDetails(item, path))
  if (value && typeof value === 'object') return Object.entries(value).flatMap(([key, item]) => errorDetails(item, path ? `${path}.${key}` : key))
  return []
}

type Props = { initialDestinations: AdminLandingDestinationDto[]; eligibleCities: EligibleLandingCityDto[] }

export function AdminLandingPages({ initialDestinations, eligibleCities }: Props) {
  const router = useRouter()
  const [serverDestinations, setServerDestinations] = useState(initialDestinations)
  const [destinations, setDestinations] = useState(initialDestinations)
  const [serverCities, setServerCities] = useState(eligibleCities)
  const [cities, setCities] = useState(eligibleCities)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [reviewCityId, setReviewCityId] = useState<string | null>(initialDestinations[0]?.id ?? null)
  const [pages, setPages] = useState<LocalLandingPageInput[]>([])
  const [pendingId, setPendingId] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  const [cityId, setCityId] = useState('')
  const [deleting, setDeleting] = useState<AdminLandingDestinationDto | null>(null)
  const [reviewPending, setReviewPending] = useState(false)
  const [error, setError] = useState<string[] | null>(null)
  const [message, setMessage] = useState<string | null>(null)

  // Refresh server-owned statuses and reviews without replacing unsaved editor state.
  if (serverDestinations !== initialDestinations) {
    setServerDestinations(initialDestinations)
    setDestinations(initialDestinations)
  }
  if (serverCities !== eligibleCities) {
    setServerCities(eligibleCities)
    setCities(eligibleCities)
  }

  const selected = destinations.find(destination => destination.id === selectedId)
  const reviewed = destinations.find(destination => destination.id === reviewCityId)
  const busy = Boolean(pendingId) || reviewPending

  function edit(destination: AdminLandingDestinationDto) {
    setReviewCityId(destination.id)
    setSelectedId(selectedId === destination.id ? null : destination.id)
    setPages(destination.pages)
    setError(null)
  }

  async function mutate<T>(path: string, method: string, responseSchema: ZodType<T>, body?: unknown): Promise<T | null> {
    setError(null)
    setMessage(null)
    const response = await fetch(path, { method, ...(body === undefined ? {} : { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }) })
    const result: unknown = await response.json().catch(() => null)
    if (!response.ok) {
      const payload = LandingAdminApiErrorResponseSchema.safeParse(result)
      setError([
        payload.success ? payload.data.error.message ?? 'Action impossible.' : 'Action impossible.',
        ...errorDetails(payload.success ? payload.data.error.details : undefined),
      ])
      return null
    }
    const parsed = responseSchema.safeParse(result)
    if (!parsed.success) {
      setError(['Réponse serveur invalide. Réessayez.'])
      return null
    }
    return parsed.data
  }

  function replace(updated: AdminLandingDestinationDto) {
    setDestinations(current => current.map(destination => destination.id === updated.id ? updated : destination))
  }

  function replaceActive(id: string, isActive: boolean) {
    setDestinations(current => current.map(destination => (
      destination.id === id ? { ...destination, is_active: isActive } : destination
    )))
  }

  async function publish(destination: AdminLandingDestinationDto, active: boolean) {
    if (busy) return
    setPendingId(destination.id)
    replaceActive(destination.id, active)
    try {
      const updated = await mutate(`/api/admin/landing-pages/${destination.id}/publication`, 'PATCH', AdminLandingDestinationResponseSchema, { is_active: active })
      if (!updated) { replaceActive(destination.id, destination.is_active); return }
      replace(updated)
      setMessage(active ? 'Landings activées.' : 'Landings archivées.')
      router.refresh()
    } catch {
      replaceActive(destination.id, destination.is_active)
      setError(['Connexion impossible. Réessayez.'])
    } finally { setPendingId(null) }
  }

  async function save() {
    if (!selected || busy) return
    setPendingId(selected.id)
    try {
      const updated = await mutate(`/api/admin/landing-pages/${selected.id}`, 'PATCH', AdminLandingDestinationResponseSchema, { pages })
      if (!updated) return
      replace(updated)
      setPages(updated.pages)
      setMessage('Contenus enregistrés.')
      router.refresh()
    } catch { setError(['Connexion impossible. Réessayez.']) }
    finally { setPendingId(null) }
  }

  async function create(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!cityId || busy) return
    setPendingId('create')
    try {
      const created = await mutate('/api/admin/landing-pages', 'POST', AdminLandingDestinationResponseSchema, { city_id: cityId })
      if (!created) return
      setDestinations(current => [...current, created])
      setCities(current => current.filter(city => city.id !== created.city.id))
      setSelectedId(created.id)
      setReviewCityId(created.id)
      setPages(created.pages)
      setAdding(false)
      setCityId('')
      setMessage('Ville ajoutée. Complétez les pages Conciergerie et Séminaires avant activation.')
      router.refresh()
    } catch { setError(['Connexion impossible. Réessayez.']) }
    finally { setPendingId(null) }
  }

  async function remove() {
    if (!deleting || busy) return
    const destination = deleting
    setPendingId(destination.id)
    try {
      const result = await mutate(`/api/admin/landing-pages/${destination.id}`, 'DELETE', LandingDestinationDeleteResponseSchema)
      if (!result) return
      setDestinations(current => current.filter(row => row.id !== destination.id))
      if (selectedId === destination.id) setSelectedId(null)
      if (reviewCityId === destination.id) setReviewCityId(null)
      setDeleting(null)
      setMessage('Landings supprimées.')
      router.refresh()
    } catch { setError(['Connexion impossible. Réessayez.']) }
    finally { setPendingId(null) }
  }

  return <div className="min-w-0 space-y-6">
    <header className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6">
      <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-slate-400">SEO local</p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">Landing pages</h1>
      <p className="mt-2 text-sm text-slate-500">Gérez les contenus, la publication et les avis des trois pages de chaque ville.</p>
    </header>
    {error ? <div role="alert" className="break-words rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error.map((line, index) => <p key={index}>{line}</p>)}</div> : null}
    {message ? <p role="status" className="text-sm text-slate-700">{message}</p> : null}
    <AdminLandingDestinationTable destinations={destinations} pendingId={pendingId ?? (reviewPending ? 'review' : null)} selectedId={selectedId} onEdit={edit} onPublication={publish} onDelete={setDeleting}
      editor={selected ? <LandingPageEditor key={`${selected.id}:${selected.updated_at}`} cityName={selected.city.name} pages={pages} onChange={setPages} onSubmit={save} pending={busy} /> : null} />
    <div className="space-y-4">
      <Button type="button" variant="outline" disabled={cities.length === 0 || busy} onClick={() => setAdding(!adding)}><Plus />Ajouter une ville</Button>
      {adding ? <form onSubmit={create} className="flex flex-wrap items-end gap-3 rounded-xl border border-slate-200 bg-white p-4">
        <div className="w-full min-w-0 space-y-2 sm:w-72"><label htmlFor="landing-city" className="text-sm font-medium">Ville existante</label>
          <Select value={cityId} onValueChange={setCityId} disabled={busy}><SelectTrigger id="landing-city"><SelectValue placeholder="Choisir une ville" /></SelectTrigger><SelectContent>{cities.map(city => <SelectItem key={city.id} value={city.id}>{city.name}</SelectItem>)}</SelectContent></Select>
        </div>
        <Button type="submit" disabled={!cityId || busy}>Créer les landings</Button>
      </form> : null}
    </div>
    {reviewed ? <AdminLandingReviews key={reviewed.id} selected={{ slug: reviewed.city.slug, name: reviewed.city.name, published: reviewed.publication.concierge, reviews: reviewed.reviews }} disabled={Boolean(pendingId)} onPendingChange={setReviewPending} /> : null}
    <AlertDialog open={Boolean(deleting)} onOpenChange={open => { if (!open && !busy) setDeleting(null) }}>
      <AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Supprimer les landings de {deleting?.city.name} ?</AlertDialogTitle><AlertDialogDescription>Les trois pages et leurs avis seront supprimés. Les logements, POI, articles, guides et la ville sont conservés.</AlertDialogDescription></AlertDialogHeader>
        {error ? <p role="alert" aria-live="assertive" className="break-words text-sm text-red-700">{error.join(' ')}</p> : null}
        <AlertDialogFooter><AlertDialogCancel disabled={busy}>Annuler</AlertDialogCancel><AlertDialogAction disabled={busy} onClick={event => { event.preventDefault(); void remove() }}>Supprimer les landings</AlertDialogAction></AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
}
