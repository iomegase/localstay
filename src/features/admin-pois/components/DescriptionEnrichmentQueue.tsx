'use client'

import { useState } from 'react'
import { AlertTriangle, CheckCircle2, ExternalLink, Loader2, Sparkles } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { MarkdownText } from '@/shared/components/MarkdownText'
import { countWords } from '@/shared/lib/description-length'
import { findHollowPhrases } from '@/shared/lib/description-style'
import { sanitizeDescriptionSources } from '@/shared/lib/description-sources'
import { DescriptionSuggestionSchema, type DescriptionSuggestion } from '@/features/poi-description-assistance/lib/contracts'
import type { DescriptionEnrichmentItem } from '../queries/description-enrichment'

type RowState =
  | { status: 'idle' }
  | { status: 'running' }
  | { status: 'ready'; suggestion: DescriptionSuggestion }
  | { status: 'insufficient' }
  | { status: 'error'; message: string }
  | { status: 'publishing'; suggestion: DescriptionSuggestion }
  | { status: 'published' }
  | { status: 'ignored' }

/** Spec 098 BR-05 : 10 POI au plus par clic, traités un à la fois. */
export const ENRICHMENT_BATCH_SIZE = 10
/** Spec 098 BR-03 : en dessous, la proposition porte « Sources maigres ». */
const THIN_PROPOSAL_WORDS = 80

const STATUS_LABELS: Record<RowState['status'], string> = {
  idle: 'À générer',
  running: 'Génération…',
  ready: 'Proposition prête',
  insufficient: 'Sources insuffisantes',
  error: 'Échec',
  publishing: 'Publication…',
  published: 'Publiée',
  ignored: 'Ignorée',
}

/** Spec 098 US-01 : propositions en lot, relues une par une avant publication. */
export function DescriptionEnrichmentQueue({ items }: { items: DescriptionEnrichmentItem[] }) {
  const [rows, setRows] = useState<Record<string, RowState>>({})
  const [openId, setOpenId] = useState<string | null>(null)
  const [batchRunning, setBatchRunning] = useState(false)
  const stateOf = (id: string): RowState => rows[id] ?? { status: 'idle' }
  const setRow = (id: string, state: RowState) => setRows(current => ({ ...current, [id]: state }))

  async function generate(id: string): Promise<void> {
    setRow(id, { status: 'running' })
    try {
      const response = await fetch(`/api/admin/pois/${id}/suggest-description`, { method: 'POST' })
      const body: unknown = await response.json().catch(() => null)
      if (!response.ok) {
        const code = readErrorCode(body)
        if (code === 'DESCRIPTION_SOURCES_INSUFFICIENT') setRow(id, { status: 'insufficient' })
        else setRow(id, { status: 'error', message: readErrorMessage(body) ?? 'La proposition n’a pas pu être préparée.' })
        return
      }
      const suggestion = DescriptionSuggestionSchema.parse((body as { data: unknown }).data)
      setRow(id, { status: 'ready', suggestion })
    } catch {
      setRow(id, { status: 'error', message: 'La proposition n’a pas pu être préparée.' })
    }
  }

  async function generateBatch(): Promise<void> {
    setBatchRunning(true)
    const next = items.filter(item => stateOf(item.id).status === 'idle').slice(0, ENRICHMENT_BATCH_SIZE)
    // BR-05 : séquentiel, jamais en parallèle.
    for (const item of next) await generate(item.id)
    setBatchRunning(false)
  }

  async function publish(item: DescriptionEnrichmentItem, suggestion: DescriptionSuggestion): Promise<void> {
    setRow(item.id, { status: 'publishing', suggestion })
    const response = await fetch(`/api/admin/pois/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ description: suggestion.description, description_sources: sanitizeDescriptionSources(suggestion.sources) }),
    }).catch(() => null)
    if (!response?.ok) {
      setRow(item.id, { status: 'ready', suggestion })
      window.alert('La publication a échoué. Réessayez.')
      return
    }
    setRow(item.id, { status: 'published' })
    setOpenId(null)
  }

  const pending = items.filter(item => !['published', 'ignored'].includes(stateOf(item.id).status))
  const idleCount = items.filter(item => stateOf(item.id).status === 'idle').length

  if (items.length === 0) {
    return <p className="rounded-2xl border border-dashed border-gray-200 p-10 text-center text-sm text-gray-500">Toutes les fiches publiées ont une description d’au moins 120 mots.</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <p className="text-sm text-gray-500">
          {pending.length} fiche{pending.length > 1 ? 's' : ''} à traiter · génération par lots de {ENRICHMENT_BATCH_SIZE}, une fiche à la fois.
        </p>
        <Button type="button" onClick={() => void generateBatch()} disabled={batchRunning || idleCount === 0}>
          {batchRunning ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />}
          Générer les propositions
        </Button>
      </div>

      <table className="w-full text-left text-sm" aria-label="Fiches à description courte">
        <thead className="text-xs uppercase tracking-wide text-gray-400">
          <tr><th className="py-2">POI</th><th>Commune</th><th>Catégorie</th><th>Mots</th><th>État</th><th className="text-right">Actions</th></tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {items.map(item => {
            const state = stateOf(item.id)
            const suggestion = state.status === 'ready' || state.status === 'publishing' ? state.suggestion : null
            return (
              <tr key={item.id} data-testid={`enrichment-row-${item.id}`} className={state.status === 'published' || state.status === 'ignored' ? 'opacity-50' : ''}>
                <td className="py-3 font-semibold text-gray-900">
                  <a href={item.public_path} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-pink-600">
                    {item.name}<ExternalLink className="h-3 w-3" aria-hidden="true" />
                  </a>
                </td>
                <td className="text-gray-500">{item.city_name}</td>
                <td className="text-gray-500">{item.category_name}</td>
                <td className="tabular-nums text-gray-500">{item.word_count}</td>
                <td><Badge variant="outline">{STATUS_LABELS[state.status]}</Badge>{state.status === 'error' && <span className="ml-2 text-xs text-red-600">{state.message}</span>}</td>
                <td className="space-x-2 text-right">
                  {(state.status === 'idle' || state.status === 'error') && (
                    <Button type="button" size="sm" variant="outline" disabled={batchRunning} onClick={() => void generate(item.id)}>Générer</Button>
                  )}
                  {suggestion && (
                    <Button type="button" size="sm" onClick={() => setOpenId(openId === item.id ? null : item.id)}>
                      {openId === item.id ? 'Fermer' : 'Relire'}
                    </Button>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>

      {items.map(item => {
        const state = stateOf(item.id)
        if (openId !== item.id || (state.status !== 'ready' && state.status !== 'publishing')) return null
        return (
          <ReviewPanel
            key={item.id}
            item={item}
            suggestion={state.suggestion}
            publishing={state.status === 'publishing'}
            onPublish={() => void publish(item, state.suggestion)}
            onIgnore={() => { setRow(item.id, { status: 'ignored' }); setOpenId(null) }}
          />
        )
      })}
    </div>
  )
}

/** AC-01-03 : actuelle / proposée côte à côte, mots, sources, avertissements. */
function ReviewPanel({ item, suggestion, publishing, onPublish, onIgnore }: {
  item: DescriptionEnrichmentItem
  suggestion: DescriptionSuggestion
  publishing: boolean
  onPublish: () => void
  onIgnore: () => void
}) {
  const words = countWords(suggestion.description)
  const hollow = findHollowPhrases(suggestion.description)
  return (
    <section aria-label={`Relecture : ${item.name}`} className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-lg font-bold text-gray-900">{item.name}</h2>
      <div className="mt-4 grid gap-6 lg:grid-cols-2">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Actuelle · {item.word_count} mots</p>
          <MarkdownText source={item.description || '—'} breaks className="mt-2 text-sm leading-6 text-gray-500" />
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-400">Proposée · {words} mots</p>
          <MarkdownText source={suggestion.description} breaks className="mt-2 text-sm leading-6 text-gray-800" />
        </div>
      </div>

      {(hollow.length > 0 || words < THIN_PROPOSAL_WORDS) && (
        <ul className="mt-4 space-y-1 rounded-xl bg-amber-50 p-4 text-sm text-amber-800" aria-label="Avertissements">
          {words < THIN_PROPOSAL_WORDS && <li className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" aria-hidden="true" />Sources maigres : moins de {THIN_PROPOSAL_WORDS} mots.</li>}
          {hollow.map(phrase => <li key={phrase} className="flex items-center gap-2"><AlertTriangle className="h-4 w-4" aria-hidden="true" />Formule creuse : « {phrase} »</li>)}
        </ul>
      )}

      <div className="mt-4 text-sm">
        <p className="font-semibold text-gray-700">Sources</p>
        <ul className="mt-1 list-inside list-disc space-y-1">
          {suggestion.sources.map(source => (
            <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer" className="break-words text-pink-600 underline">{source.title}</a></li>
          ))}
        </ul>
      </div>
      {suggestion.search_entry_point && (
        <iframe
          title="Suggestions de recherche Google"
          sandbox="allow-popups allow-popups-to-escape-sandbox"
          referrerPolicy="no-referrer"
          className="mt-4 h-40 w-full rounded-lg border-0 bg-white"
          srcDoc={`<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src https: data:; base-uri 'none'; form-action 'none'"><base target="_blank">${suggestion.search_entry_point}`}
        />
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        <Button type="button" disabled={publishing} onClick={onPublish}>
          {publishing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <CheckCircle2 className="mr-2 h-4 w-4" aria-hidden="true" />}
          Publier
        </Button>
        <Button type="button" variant="ghost" disabled={publishing} onClick={onIgnore}>Ignorer</Button>
      </div>
    </section>
  )
}

function readErrorCode(value: unknown): string | null {
  if (!value || typeof value !== 'object' || !('error' in value)) return null
  const error = (value as { error: unknown }).error
  return error && typeof error === 'object' && 'code' in error && typeof error.code === 'string' ? error.code : null
}

function readErrorMessage(value: unknown): string | null {
  if (!value || typeof value !== 'object' || !('error' in value)) return null
  const error = (value as { error: unknown }).error
  return error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' ? error.message : null
}
