'use client'

import { useEffect, useId, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Search, Trash2, X } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Switch } from '@/shared/components/ui/switch'
import { Textarea } from '@/shared/components/ui/textarea'
import { ImageUpload } from '@/shared/components/ImageUpload'
import {
  SIMULATOR_DEFAULT_PARTICIPANTS,
  SIMULATOR_MAX_PARTICIPANTS,
  SIMULATOR_MIN_PARTICIPANTS,
  VAT_RATE_PERCENT,
  centsToEurosInput,
  formatEuros,
  parseEurosToCents,
  simulateActivityTotal,
  ttcCents,
} from '../lib/pricing'
import { SEMINAR_LEVEL_OPTIONS, SEMINAR_SEASON_OPTIONS, optionsWithCurrent } from '../lib/options'
import {
  HUB_SURFACE_KEY,
  SEMINAR_ACTIVITY_CATEGORIES,
  SEMINAR_ACTIVITY_CATEGORY_LABELS,
  type ProviderSearchItem,
  type SeminarActivityAdmin,
  type SeminarActivityCategory,
  type SeminarActivityProviderAdmin,
  type SeminarSurfaceOption,
} from '../types'
import { adminCall } from './admin-client'

type Draft = {
  title: string
  category: SeminarActivityCategory
  description: string
  season_label: string
  level_label: string
  is_published: boolean
  price_per_person: string
  price_per_group: string
  internal_notes: string
  providers: SeminarActivityProviderAdmin[]
  include_hub: boolean
  destination_ids: string[]
}

function toDraft(activity: SeminarActivityAdmin | null): Draft {
  return {
    title: activity?.title ?? '',
    category: activity?.category ?? 'TEAM_BUILDING',
    description: activity?.description ?? '',
    season_label: activity?.season_label ?? '',
    level_label: activity?.level_label ?? '',
    is_published: activity?.is_published ?? false,
    price_per_person: centsToEurosInput(activity?.price_per_person_cents ?? null),
    price_per_group: centsToEurosInput(activity?.price_per_group_cents ?? null),
    internal_notes: activity?.internal_notes ?? '',
    providers: activity?.providers ?? [],
    include_hub: activity?.placements.some(placement => placement.surface_key === HUB_SURFACE_KEY) ?? false,
    destination_ids: activity?.placements.flatMap(placement => (placement.destination_id ? [placement.destination_id] : [])) ?? [],
  }
}

type FieldErrors = Partial<Record<'title' | 'description' | 'season_label' | 'level_label' | 'price_per_person' | 'price_per_group', string>>

function validate(draft: Draft): FieldErrors {
  const errors: FieldErrors = {}
  if (!draft.title.trim()) errors.title = 'Titre requis'
  if (!draft.description.trim()) errors.description = 'Description requise'
  if (!draft.season_label.trim()) errors.season_label = 'Saison requise'
  if (!draft.level_label.trim()) errors.level_label = 'Niveau requis'
  if (parseEurosToCents(draft.price_per_person) === undefined) errors.price_per_person = 'Montant invalide (ex. 45,00)'
  if (parseEurosToCents(draft.price_per_group) === undefined) errors.price_per_group = 'Montant invalide (ex. 450,00)'
  return errors
}

const fieldClass = 'grid gap-1 text-xs font-semibold text-gray-500'
const selectClass = 'h-9 w-full rounded-lg border border-gray-200 bg-white px-2 text-sm text-neutral-900'

function FieldError({ message }: { message?: string }) {
  return message ? <span role="alert" className="text-xs font-semibold text-rose-600">{message}</span> : null
}

/** Spec 097 UI admin : panneau d'édition (carte, prix, prestataires, diffusion). */
export function SeminarActivityEditor({
  activity,
  surfaces,
  onSaved,
  onClose,
}: {
  activity: SeminarActivityAdmin | null
  surfaces: SeminarSurfaceOption[]
  onSaved: (id: string) => void
  onClose: () => void
}) {
  const router = useRouter()
  const [draft, setDraft] = useState<Draft>(() => toDraft(activity))
  const [imageUrl, setImageUrl] = useState<string | null>(activity?.image_url ?? null)
  const [errors, setErrors] = useState<FieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [pending, startTransition] = useTransition()
  const update = (patch: Partial<Draft>) => {
    setSaved(false)
    setDraft(current => ({ ...current, ...patch }))
  }

  function save() {
    setError(null)
    setSaved(false)
    const fieldErrors = validate(draft)
    setErrors(fieldErrors)
    if (Object.keys(fieldErrors).length) return

    const payload = {
      title: draft.title,
      category: draft.category,
      description: draft.description,
      season_label: draft.season_label,
      level_label: draft.level_label,
      price_per_person_cents: parseEurosToCents(draft.price_per_person) ?? null,
      price_per_group_cents: parseEurosToCents(draft.price_per_group) ?? null,
      internal_notes: draft.internal_notes.trim() || null,
    }

    startTransition(async () => {
      const main = activity
        ? await adminCall<SeminarActivityAdmin>(`/api/admin/seminar-activities/${activity.id}`, 'PATCH', { ...payload, is_published: draft.is_published })
        : await adminCall<SeminarActivityAdmin>('/api/admin/seminar-activities', 'POST', payload)
      if (!main.ok) return setError(main.message)
      const id = main.data.id

      const providers = await adminCall(`/api/admin/seminar-activities/${id}/providers`, 'PUT', {
        providers: draft.providers.map(provider => ({ poi_id: provider.poi_id, notes: provider.notes?.trim() || null })),
      })
      if (!providers.ok) return setError(providers.message)

      const placements = await adminCall(`/api/admin/seminar-activities/${id}/placements`, 'PUT', {
        include_hub: draft.include_hub,
        destination_ids: draft.destination_ids,
      })
      if (!placements.ok) return setError(placements.message)

      setSaved(true)
      onSaved(id)
      router.refresh()
    })
  }

  function remove() {
    if (!activity) return
    setError(null)
    startTransition(async () => {
      const result = await adminCall(`/api/admin/seminar-activities/${activity.id}`, 'DELETE')
      if (!result.ok) return setError(result.message)
      onClose()
      router.refresh()
    })
  }

  return (
    <div data-testid="seminar-activity-editor" className="space-y-6">
      <section className="space-y-3">
        <h3 className="text-sm font-bold text-neutral-900">Carte</h3>
        <label className={fieldClass}>Titre
          <Input value={draft.title} maxLength={120} aria-invalid={Boolean(errors.title)} onChange={event => update({ title: event.target.value })} />
          <FieldError message={errors.title} />
        </label>
        <label className={fieldClass}>Catégorie
          <select value={draft.category} className={selectClass} onChange={event => update({ category: event.target.value as SeminarActivityCategory })}>
            {SEMINAR_ACTIVITY_CATEGORIES.map(category => (
              <option key={category} value={category}>{SEMINAR_ACTIVITY_CATEGORY_LABELS[category]}</option>
            ))}
          </select>
        </label>
        <label className={fieldClass}>Description
          <Textarea value={draft.description} rows={3} maxLength={400} aria-invalid={Boolean(errors.description)} onChange={event => update({ description: event.target.value })} />
          <FieldError message={errors.description} />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={fieldClass}>Saison
            <select value={draft.season_label} className={selectClass} aria-invalid={Boolean(errors.season_label)} onChange={event => update({ season_label: event.target.value })}>
              <option value="" disabled>Choisir une saison</option>
              {optionsWithCurrent(SEMINAR_SEASON_OPTIONS, activity?.season_label ?? '').map(option => <option key={option} value={option}>{option}</option>)}
            </select>
            <FieldError message={errors.season_label} />
          </label>
          <label className={fieldClass}>Niveau
            <select value={draft.level_label} className={selectClass} aria-invalid={Boolean(errors.level_label)} onChange={event => update({ level_label: event.target.value })}>
              <option value="" disabled>Choisir un niveau</option>
              {optionsWithCurrent(SEMINAR_LEVEL_OPTIONS, activity?.level_label ?? '').map(option => <option key={option} value={option}>{option}</option>)}
            </select>
            <FieldError message={errors.level_label} />
          </label>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-gray-500">Image</p>
          {activity ? (
            <>
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="" className="aspect-[4/3] w-full max-w-xs rounded-xl object-cover" />
              )}
              <ImageUpload
                endpoint={`/api/admin/seminar-activities/${activity.id}/image`}
                onUploaded={url => {
                  setImageUrl(url)
                  router.refresh()
                }}
                label={imageUrl ? 'Remplacer l’image' : 'Téléverser une image'}
              />
            </>
          ) : (
            <p className="text-xs text-gray-500">Enregistrez l’activité pour pouvoir ajouter son image.</p>
          )}
        </div>
        {activity && (
          <label className="flex items-center gap-3 text-sm font-semibold text-neutral-900">
            <Switch
              checked={draft.is_published}
              disabled={!imageUrl && !draft.is_published}
              onCheckedChange={checked => update({ is_published: checked })}
            />
            Publiée
            {!imageUrl && <span className="text-xs font-normal text-gray-500">Ajoutez une image pour pouvoir publier.</span>}
          </label>
        )}
      </section>

      <PriceSection draft={draft} errors={errors} onChange={update} />

      <ProvidersSection providers={draft.providers} onChange={providers => update({ providers })} />

      <section className="space-y-3">
        <h3 className="text-sm font-bold text-neutral-900">Diffusion</h3>
        <p className="text-xs text-gray-500">Une carte n’est visible que si elle est publiée, illustrée et que la page est en ligne.</p>
        <label className="flex items-center gap-2 text-sm text-neutral-900">
          <input type="checkbox" checked={draft.include_hub} onChange={event => update({ include_hub: event.target.checked })} />
          Page Séminaires
        </label>
        {surfaces.map(surface => (
          <label key={surface.destination_id} className="flex items-center gap-2 text-sm text-neutral-900">
            <input
              type="checkbox"
              checked={draft.destination_ids.includes(surface.destination_id)}
              onChange={event => update({
                destination_ids: event.target.checked
                  ? [...draft.destination_ids, surface.destination_id]
                  : draft.destination_ids.filter(id => id !== surface.destination_id),
              })}
            />
            Séminaires — {surface.city_name}
            <span className={`text-[11px] font-semibold ${surface.seminar_published ? 'text-emerald-700' : 'text-gray-400'}`}>
              {surface.seminar_published ? 'en ligne' : 'non publiée'}
            </span>
          </label>
        ))}
      </section>

      {error && <p role="alert" className="text-sm font-semibold text-rose-600">{error}</p>}
      {saved && <p role="status" className="text-sm font-semibold text-emerald-700">Activité enregistrée.</p>}

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-4">
        {activity ? (
          confirmDelete ? (
            <span className="flex gap-2">
              <Button type="button" variant="destructive" disabled={pending} onClick={remove}>Confirmer la suppression</Button>
              <Button type="button" variant="outline" disabled={pending} onClick={() => setConfirmDelete(false)}>Annuler</Button>
            </span>
          ) : (
            <Button type="button" variant="outline" disabled={pending} onClick={() => setConfirmDelete(true)}>
              <Trash2 className="h-4 w-4" /> Supprimer
            </Button>
          )
        ) : <span />}
        <span className="flex gap-2">
          <Button type="button" variant="outline" disabled={pending} onClick={onClose}>Fermer</Button>
          <Button type="button" disabled={pending} onClick={save}>{activity ? 'Enregistrer' : 'Créer l’activité'}</Button>
        </span>
      </div>
    </div>
  )
}

function PriceSection({ draft, errors, onChange }: { draft: Draft; errors: FieldErrors; onChange: (patch: Partial<Draft>) => void }) {
  const [participants, setParticipants] = useState(SIMULATOR_DEFAULT_PARTICIPANTS)
  const perPerson = parseEurosToCents(draft.price_per_person)
  const perGroup = parseEurosToCents(draft.price_per_group)
  const valid = perPerson !== undefined && perGroup !== undefined
  const total = valid ? simulateActivityTotal({ price_per_person_cents: perPerson, price_per_group_cents: perGroup }, participants) : null
  const participantOptions = Array.from(
    { length: SIMULATOR_MAX_PARTICIPANTS - SIMULATOR_MIN_PARTICIPANTS + 1 },
    (_, index) => SIMULATOR_MIN_PARTICIPANTS + index,
  )

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-bold text-neutral-900">Prix <span className="font-normal text-gray-400">(interne, jamais publié)</span></h3>
      <div className="grid gap-3 sm:grid-cols-2">
        <PriceInput label="Prix par personne HT (€)" value={draft.price_per_person} cents={perPerson} error={errors.price_per_person} onChange={value => onChange({ price_per_person: value })} />
        <PriceInput label="Forfait groupe HT (€)" value={draft.price_per_group} cents={perGroup} error={errors.price_per_group} onChange={value => onChange({ price_per_group: value })} />
      </div>
      <div data-testid="seminar-price-simulator" className="flex flex-wrap items-center gap-3 rounded-xl bg-gray-50 p-3 text-sm text-neutral-900">
        <label className="flex items-center gap-2 text-xs font-semibold text-gray-500">Participants
          <select value={participants} className="h-8 rounded-lg border border-gray-200 bg-white px-2 text-sm text-neutral-900" onChange={event => setParticipants(Number(event.target.value))}>
            {participantOptions.map(value => <option key={value} value={value}>{value}</option>)}
          </select>
        </label>
        {total ? (
          <span>
            Total : <strong>{formatEuros(total.htCents)} HT</strong> · {formatEuros(total.ttcCents)} TTC
          </span>
        ) : (
          <span className="text-gray-500">Corrigez les montants pour calculer le total.</span>
        )}
      </div>
    </section>
  )
}

function PriceInput({ label, value, cents, error, onChange }: {
  label: string
  value: string
  cents: number | null | undefined
  error?: string
  onChange: (value: string) => void
}) {
  return (
    <label className={fieldClass}>{label}
      <Input value={value} inputMode="decimal" placeholder="—" aria-invalid={Boolean(error)} onChange={event => onChange(event.target.value)} />
      {typeof cents === 'number' && (
        <span className="text-xs font-normal text-gray-500">{formatEuros(ttcCents(cents))} TTC (TVA {VAT_RATE_PERCENT} %)</span>
      )}
      <FieldError message={error} />
    </label>
  )
}

function ProvidersSection({ providers, onChange }: { providers: SeminarActivityProviderAdmin[]; onChange: (providers: SeminarActivityProviderAdmin[]) => void }) {
  const searchId = useId()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<ProviderSearchItem[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)

  useEffect(() => {
    const q = query.trim()
    if (q.length < 2) return
    let cancelled = false
    const timer = setTimeout(async () => {
      const result = await adminCall<{ items: ProviderSearchItem[] }>(`/api/admin/seminar-activities/provider-search?q=${encodeURIComponent(q)}`, 'GET')
      if (cancelled) return
      setSearchError(result.ok ? null : result.message)
      setResults(result.ok ? result.data.items : [])
    }, 250)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
  }, [query])

  const linked = new Set(providers.map(provider => provider.poi_id))
  // Résultats masqués sous 2 lettres, sans réinitialiser l'état dans l'effet.
  const shown = query.trim().length >= 2 ? results : []

  return (
    <section className="space-y-3">
      <h3 className="text-sm font-bold text-neutral-900">Prestataires <span className="font-normal text-gray-400">(interne, jamais publié)</span></h3>
      {providers.length > 0 && (
        <ul className="space-y-2">
          {providers.map(provider => (
            <li key={provider.poi_id} data-testid="seminar-activity-provider" className="space-y-2 rounded-xl border border-gray-100 p-3">
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-neutral-900">
                  {provider.poi_name} <span className="font-normal text-gray-500">· {provider.city_name}</span>
                  {provider.poi_deleted && <span className="ml-2 text-xs font-semibold text-rose-600">fiche supprimée</span>}
                </p>
                <button
                  type="button"
                  aria-label={`Retirer ${provider.poi_name}`}
                  className="text-gray-400 hover:text-rose-600"
                  onClick={() => onChange(providers.filter(item => item.poi_id !== provider.poi_id))}
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <Textarea
                value={provider.notes ?? ''}
                rows={2}
                maxLength={1000}
                placeholder="Note interne : contact, capacité, conditions"
                aria-label={`Note interne pour ${provider.poi_name}`}
                onChange={event => onChange(providers.map(item => (item.poi_id === provider.poi_id ? { ...item, notes: event.target.value } : item)))}
              />
            </li>
          ))}
        </ul>
      )}
      <label htmlFor={searchId} className={fieldClass}>Ajouter un prestataire
        <span className="relative">
          <Search className="pointer-events-none absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input id={searchId} value={query} className="pl-8" placeholder="Nom du lieu (2 lettres minimum)" onChange={event => setQuery(event.target.value)} />
        </span>
      </label>
      {searchError && <p role="alert" className="text-xs font-semibold text-rose-600">{searchError}</p>}
      {shown.length > 0 && (
        <ul className="max-h-56 overflow-y-auto rounded-xl border border-gray-100">
          {shown.map(item => (
            <li key={item.poi_id} className="flex items-center justify-between gap-2 border-b border-gray-50 px-3 py-2 text-sm last:border-b-0">
              <span>{item.poi_name} <span className="text-gray-500">· {item.city_name}</span></span>
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={linked.has(item.poi_id)}
                onClick={() => onChange([...providers, { ...item, poi_deleted: false, notes: null }])}
              >
                {linked.has(item.poi_id) ? 'Ajouté' : 'Ajouter'}
              </Button>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
