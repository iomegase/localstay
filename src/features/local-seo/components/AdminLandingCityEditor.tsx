'use client'

import { useEffect, useId, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, ExternalLink, Loader2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Switch } from '@/shared/components/ui/switch'
import { AdminLandingDestinationResponseSchema } from '../schemas/landing-pages'
import { callLandingAdminApi } from '../lib/landing-admin-api'
import {
  fieldIssues,
  isLandingDraftDirty,
  issueCountByIntent,
  LANDING_TABS,
  landingPublicPath,
  type LandingTabKey,
} from '../lib/landing-editor'
import type { AdminLandingDestinationDto, LocalLandingPageInput } from '../types/landing-pages'
import { AdminLandingReviews } from './AdminLandingReviews'
import { LandingPageEditor } from './LandingPageEditor'

// Domaine canonique affiché dans l'aperçu Google.
const PUBLIC_SITE_ORIGIN = 'https://www.mystay.city'

type Props = { destination: AdminLandingDestinationDto; initialTab: LandingTabKey }

// Spec 076 US-02 : édition des trois landings et des avis d'une ville.
export function AdminLandingCityEditor({ destination: initialDestination, initialTab }: Props) {
  const router = useRouter()
  const tabsId = useId()
  const [serverDestination, setServerDestination] = useState(initialDestination)
  const [destination, setDestination] = useState(initialDestination)
  const [saved, setSaved] = useState<LocalLandingPageInput[]>(initialDestination.pages)
  const [draft, setDraft] = useState<LocalLandingPageInput[]>(initialDestination.pages)
  const [tab, setTab] = useState<LandingTabKey>(initialTab)
  const [pending, setPending] = useState<'save' | 'publication' | null>(null)
  const [reviewPending, setReviewPending] = useState(false)
  const [errors, setErrors] = useState<string[] | null>(null)
  const [message, setMessage] = useState<string | null>(null)
  // Remonte l'éditeur (lignes répétables) après annulation ou enregistrement.
  const [revision, setRevision] = useState(0)

  const dirty = isLandingDraftDirty(saved, draft)

  // Les avis rafraîchissent les données serveur : on les reprend sans écraser le brouillon.
  if (serverDestination !== initialDestination) {
    setServerDestination(initialDestination)
    setDestination(initialDestination)
    if (!dirty) {
      setSaved(initialDestination.pages)
      setDraft(initialDestination.pages)
    }
  }

  // Spec 076 AC-02-06 : quitter la page avec des modifications demande confirmation.
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault() }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const issueCounts = issueCountByIntent(destination.contentIssues)
  const busy = pending !== null || reviewPending
  const activeTab = LANDING_TABS.find(candidate => candidate.key === tab)!
  const pageIndex = activeTab.intent ? draft.findIndex(page => page.intent === activeTab.intent) : -1
  const page = pageIndex >= 0 ? draft[pageIndex] : null

  function selectTab(key: LandingTabKey) {
    setTab(key)
    router.replace(`?onglet=${key}`, { scroll: false })
  }

  async function save() {
    if (busy || !dirty) return
    setPending('save')
    setErrors(null)
    setMessage(null)
    const result = await callLandingAdminApi(`/api/admin/landing-pages/${destination.id}`, 'PATCH', AdminLandingDestinationResponseSchema, { pages: draft })
    setPending(null)
    if (!result.ok) { setErrors(result.errors); return }
    setDestination(result.data)
    setSaved(result.data.pages)
    setDraft(result.data.pages)
    setRevision(current => current + 1)
    setMessage('Contenus enregistrés.')
    router.refresh()
  }

  async function publish(active: boolean) {
    if (busy) return
    setPending('publication')
    setErrors(null)
    setMessage(null)
    setDestination(current => ({ ...current, is_active: active }))
    const result = await callLandingAdminApi(`/api/admin/landing-pages/${destination.id}/publication`, 'PATCH', AdminLandingDestinationResponseSchema, { is_active: active })
    setPending(null)
    if (!result.ok) {
      setDestination(current => ({ ...current, is_active: !active }))
      setErrors(result.errors)
      return
    }
    setDestination(result.data)
    setMessage(active ? 'Landings activées.' : 'Landings archivées.')
    router.refresh()
  }

  return (
    <div className="min-w-0 space-y-6">
      <header className="rounded-[25px] border border-gray-50 bg-white p-6 shadow-sm sm:p-8">
        <Link href="/admin/landing-pages" className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-neutral-900">
          <ArrowLeft size={14} aria-hidden="true" /> Landing pages
        </Link>
        <div className="mt-3 flex flex-wrap items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-widest text-gray-400">SEO local</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-neutral-900 sm:text-3xl">{destination.city.name}</h1>
          </div>
          <label className="flex items-center gap-3 rounded-xl border border-gray-100 px-4 py-2.5">
            <Switch checked={destination.is_active} disabled={busy} aria-label={`${destination.is_active ? 'Archiver' : 'Activer'} ${destination.city.name}`} onCheckedChange={active => void publish(active)} />
            <span className="text-sm font-semibold text-neutral-900">{destination.is_active ? 'Ville active' : 'Ville archivée'}</span>
          </label>
        </div>
      </header>

      {/* Spec 076 AC-02-01 : un onglet par page + avis. */}
      <div role="tablist" aria-label={`Pages de ${destination.city.name}`} className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
        {LANDING_TABS.map(candidate => {
          const count = candidate.intent ? issueCounts[candidate.intent] : destination.reviewCount
          const selected = candidate.key === tab
          return (
            <button
              key={candidate.key}
              id={`${tabsId}-${candidate.key}`}
              type="button"
              role="tab"
              aria-selected={selected}
              aria-controls={`${tabsId}-panel`}
              onClick={() => selectTab(candidate.key)}
              className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${selected ? 'border-[#0B1437] bg-[#0B1437] text-white' : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300 hover:text-neutral-900'}`}
            >
              {candidate.label}
              {candidate.intent && count > 0 ? (
                <span title="Champs à compléter" className="rounded-full bg-rose-500 px-1.5 text-[11px] font-bold text-white">{count}</span>
              ) : null}
              {!candidate.intent ? <span className={selected ? 'text-white/70' : 'text-gray-400'}>({count})</span> : null}
            </button>
          )
        })}
      </div>

      {errors ? (
        <div role="alert" className="break-words rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          {errors.map((line, index) => <p key={index}>{line}</p>)}
        </div>
      ) : null}
      {message && !dirty ? <p role="status" className="text-sm font-medium text-emerald-700">{message}</p> : null}

      <div role="tabpanel" id={`${tabsId}-panel`} aria-labelledby={`${tabsId}-${activeTab.key}`}>
        {page && activeTab.intent ? (
          <>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <p className="text-sm text-gray-500">
                {destination.publication[activeTab.intent === 'CONCIERGE' ? 'concierge' : activeTab.intent === 'SEMINAR' ? 'seminar' : 'vacationRental']
                  ? 'Page publiée'
                  : 'Page non publiée'}
                {activeTab.intent === 'VACATION_RENTAL' && destination.publicLodgingCount === 0 ? ' — aucun logement associé' : ''}
              </p>
              <a href={landingPublicPath(activeTab.intent, destination.city.slug)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0B1437] hover:underline">
                Voir la page <ExternalLink size={14} aria-hidden="true" />
              </a>
            </div>
            <fieldset disabled={pending === 'save'} className="min-w-0">
              <LandingPageEditor
                key={`${activeTab.intent}:${revision}`}
                page={page}
                publicUrl={`${PUBLIC_SITE_ORIGIN}${landingPublicPath(activeTab.intent, destination.city.slug)}`}
                issues={fieldIssues(destination.contentIssues, activeTab.intent)}
                onChange={updated => setDraft(current => current.map((candidate, index) => index === pageIndex ? updated : candidate))}
              />
            </fieldset>
          </>
        ) : (
          <AdminLandingReviews
            selected={{ slug: destination.city.slug, name: destination.city.name, published: destination.publication.concierge, reviews: destination.reviews }}
            disabled={pending !== null}
            onPendingChange={setReviewPending}
          />
        )}
      </div>

      {/* Spec 076 AC-02-06 : barre d'enregistrement fixe. */}
      {dirty ? (
        <div role="region" aria-label="Enregistrement" className="sticky bottom-0 z-20 rounded-t-[20px] border border-b-0 border-gray-200 bg-white/95 px-4 py-3 shadow-[0_-8px_24px_rgba(15,23,42,0.08)] backdrop-blur">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
            <p className="flex items-center gap-2 text-sm font-semibold text-amber-700">
              <span className="h-2 w-2 rounded-full bg-amber-500" aria-hidden="true" /> Modifications non enregistrées
            </p>
            <div className="flex gap-2">
              <Button type="button" variant="outline" disabled={pending === 'save'} onClick={() => { setDraft(saved); setRevision(current => current + 1); setErrors(null) }}>Annuler</Button>
              <Button type="button" disabled={busy} onClick={() => void save()} className="bg-[#0B1437] text-white hover:bg-[#16204a]">
                {pending === 'save' ? <><Loader2 className="animate-spin" aria-hidden="true" />Enregistrement…</> : 'Enregistrer les trois pages'}
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}
