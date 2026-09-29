'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Loader2, Sparkles } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Label } from '@/shared/components/ui/label'
import { Textarea } from '@/shared/components/ui/textarea'
import { DescriptionSuggestionSchema, type DescriptionSuggestion } from '../lib/contracts'

type Props = {
  poiId: string
  disabled: boolean
  identityDirty: boolean
  onAccept: (description: string) => void
}

export function PoiDescriptionAssistant({ poiId, disabled, identityDirty, onAccept }: Props) {
  const [suggestion, setSuggestion] = useState<DescriptionSuggestion | null>(null)
  const [draft, setDraft] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [pending, setPending] = useState(false)
  const controller = useRef<AbortController | null>(null)
  const id = useId()

  useEffect(() => () => { controller.current?.abort() }, [])

  async function generate() {
    if (controller.current || disabled || identityDirty) return
    const request = new AbortController()
    controller.current = request
    setPending(true)
    setError(null)
    setNotice(null)
    const timer = setTimeout(() => request.abort(), 55_000)
    try {
      const response = await fetch(`/api/admin/pois/${poiId}/suggest-description`, {
        method: 'POST', signal: request.signal,
      })
      const json: unknown = await response.json()
      if (!response.ok) {
        const message = readErrorMessage(json)
        throw new Error(message ?? 'La description n’a pas pu être préparée. Réessayez plus tard.')
      }
      const data = json && typeof json === 'object' && 'data' in json ? json.data : null
      const parsed = DescriptionSuggestionSchema.parse(data)
      if (controller.current !== request) return
      setSuggestion(parsed)
      setDraft(parsed.description)
    } catch (failure) {
      if (controller.current !== request) return
      setError(request.signal.aborted
        ? 'La préparation a pris trop de temps. Réessayez plus tard.'
        : failure instanceof Error && !(failure.name === 'ZodError') ? failure.message : 'La proposition reçue est invalide. Réessayez.')
    } finally {
      clearTimeout(timer)
      if (controller.current === request) {
        controller.current = null
        setPending(false)
      }
    }
  }

  function cancel() {
    controller.current?.abort()
    controller.current = null
    setPending(false)
    setSuggestion(null)
    setDraft('')
    setError(null)
    setNotice(null)
  }

  const blocked = disabled || identityDirty
  const validDraft = draft.trim().length > 0 && draft.trim().length <= 2000

  return (
    <div className="space-y-3 rounded-xl border border-indigo-100 bg-indigo-50/40 p-4">
      <div className="flex flex-wrap items-center gap-3">
        <Button type="button" variant="outline" disabled={blocked || pending} onClick={generate}>
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> : <Sparkles className="mr-2 h-4 w-4" aria-hidden="true" />}
          {pending ? 'Préparation en cours…' : 'Proposer une description'}
        </Button>
        {pending && <Button type="button" variant="ghost" onClick={cancel}>Annuler</Button>}
      </div>
      <p className="text-sm text-slate-600">Site officiel en priorité, sinon recherche web. Relisez les informations et leurs sources avant utilisation.</p>
      {identityDirty && <p role="status" className="text-sm text-amber-800">Enregistrez les modifications du nom, de l’adresse ou du site web avant de proposer une description.</p>}
      {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="text-sm text-emerald-800">{notice}</p>}
      {suggestion && (
        <section aria-label="Relecture de la description proposée" className="space-y-3 border-t border-indigo-100 pt-4">
          <p className="text-sm font-semibold text-indigo-900">{suggestion.source_mode === 'official_website' ? 'À partir du site officiel' : 'À partir de sources web'}</p>
          <Label htmlFor={id}>Proposition à relire</Label>
          <Textarea id={id} value={draft} onChange={event => setDraft(event.target.value)} rows={6} aria-describedby={`${id}-length`} />
          <p id={`${id}-length`} className={validDraft ? 'text-xs text-slate-500' : 'text-xs text-red-700'}>{draft.trim().length} / 2 000 caractères</p>
          <div className="space-y-1 text-sm">
            <p className="font-semibold text-slate-700">Sources à vérifier</p>
            <ul className="list-inside list-disc space-y-1">
              {suggestion.sources.map(source => (
                <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer" className="break-words text-indigo-700 underline">{source.title}</a></li>
              ))}
            </ul>
          </div>
          {suggestion.search_entry_point && (
            <iframe
              title="Suggestions de recherche Google"
              sandbox="allow-popups allow-popups-to-escape-sandbox"
              referrerPolicy="no-referrer"
              className="h-40 w-full rounded-lg border-0 bg-white"
              srcDoc={`<!doctype html><meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src 'unsafe-inline'; img-src https: data:; base-uri 'none'; form-action 'none'"><base target="_blank">${suggestion.search_entry_point}`}
            />
          )}
          <div className="flex flex-wrap gap-2">
            <Button type="button" disabled={blocked || pending || !validDraft} onClick={() => {
              onAccept(draft.trim())
              setSuggestion(null)
              setDraft('')
              setNotice('Proposition appliquée. Enregistrez la fiche pour conserver cette description.')
            }}>Utiliser cette proposition</Button>
            <Button type="button" variant="ghost" onClick={cancel}>Annuler</Button>
          </div>
        </section>
      )}
    </div>
  )
}

function readErrorMessage(value: unknown): string | null {
  if (!value || typeof value !== 'object' || !('error' in value)) return null
  const error = value.error
  return error && typeof error === 'object' && 'message' in error && typeof error.message === 'string' ? error.message : null
}
