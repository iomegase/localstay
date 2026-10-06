'use client'

import { useId, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import { blocksForIntent, seoLength, type EditorBlock, type EditorField } from '../lib/landing-editor'
import type { LocalLandingPageInput } from '../types/landing-pages'

export const landingIntentLabels = { CONCIERGE: 'Conciergerie', SEMINAR: 'Séminaires', VACATION_RENTAL: 'Locations de vacances' } as const

type Repeatable = NonNullable<EditorBlock['repeatable']>

const REPEATABLE = {
  highlights: { legend: 'Points forts', item: 'Point fort', add: 'Ajouter un point fort', keys: ['title', 'copy'], labels: ['Titre', 'Texte'], max: 12 },
  steps: { legend: 'Étapes', item: 'Étape', add: 'Ajouter une étape', keys: ['title', 'copy'], labels: ['Titre', 'Texte'], max: 12 },
  faq: { legend: 'Questions', item: 'Question', add: 'Ajouter une question', keys: ['question', 'answer'], labels: ['Question', 'Réponse'], max: 20 },
} as const

type Props = {
  page: LocalLandingPageInput
  publicUrl: string
  /** Spec 076 AC-02-05 : chemins des champs à compléter. */
  issues: Set<string>
  onChange: (page: LocalLandingPageInput) => void
}

const NULLABLE_FIELDS = new Set(['reassurance', 'process_title', 'empty_copy'])

function Missing({ show }: { show: boolean }) {
  return show ? <p className="text-xs font-semibold text-rose-600">À compléter</p> : null
}

// Spec 076 AC-02-02 : une page éditée par blocs, dans l'ordre de la page publique.
export function LandingPageEditor({ page, publicUrl, issues, onChange }: Props) {
  const prefix = useId()
  // Clés stables des lignes répétables (ajout / suppression sans perdre le focus).
  const [rowKeys, setRowKeys] = useState(() => ({
    next: 0,
    highlights: page.highlights.map((_, index) => `h${index}`),
    steps: page.steps.map((_, index) => `s${index}`),
    faq: page.faq.map((_, index) => `f${index}`),
  }))

  function setField(field: EditorField['field'], value: string) {
    onChange({ ...page, [field]: NULLABLE_FIELDS.has(field) && !value ? null : value })
  }

  function addRow(kind: Repeatable) {
    setRowKeys(current => ({ ...current, next: current.next + 1, [kind]: [...current[kind], `n${current.next}`] }))
    onChange(kind === 'faq'
      ? { ...page, faq: [...page.faq, { question: '', answer: '' }] }
      : { ...page, [kind]: [...page[kind], { title: '', copy: '' }] })
  }

  function removeRow(kind: Repeatable, index: number) {
    setRowKeys(current => ({ ...current, [kind]: current[kind].filter((_, position) => position !== index) }))
    onChange({ ...page, [kind]: (page[kind] as unknown[]).filter((_, position) => position !== index) })
  }

  function setRowValue(kind: Repeatable, index: number, key: string, value: string) {
    onChange({ ...page, [kind]: (page[kind] as Array<Record<string, string>>).map((row, position) => position === index ? { ...row, [key]: value } : row) })
  }

  return (
    <div className="space-y-5">
      {blocksForIntent(page.intent).map(block => (
        <section key={block.id} aria-labelledby={`${prefix}-${block.id}`} className="rounded-[20px] border border-gray-100 bg-white p-5 shadow-sm sm:p-6">
          <header className="mb-4">
            <h3 id={`${prefix}-${block.id}`} className="text-base font-bold text-neutral-900">{block.title}</h3>
            <p className="mt-0.5 text-xs text-gray-500">{block.description}</p>
          </header>

          <div className={block.id === 'seo' ? 'grid gap-5 lg:grid-cols-2' : ''}>
            <div className="grid gap-4">
              {block.fields.map(field => {
                const id = `${prefix}-${field.field}`
                const value = page[field.field] ?? ''
                const counter = field.recommended ? seoLength(value, field.recommended) : null
                const missing = issues.has(field.field)
                const common = {
                  id, value, maxLength: field.maxLength,
                  'aria-invalid': missing || undefined,
                  onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setField(field.field, event.target.value),
                }
                return (
                  <div key={field.field} className="min-w-0 space-y-1.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <label htmlFor={id} className="text-[13px] font-semibold text-gray-700">{field.label}</label>
                      {counter ? (
                        <span data-testid={`counter-${field.field}`} className={`text-[11px] font-semibold tabular-nums ${counter.over ? 'text-amber-600' : 'text-gray-400'}`}>
                          {counter.length} / {field.recommended}
                        </span>
                      ) : null}
                    </div>
                    {field.multiline ? <Textarea {...common} rows={3} /> : <Input {...common} />}
                    {field.hint ? <p className="text-[11px] text-gray-400">{field.hint}</p> : null}
                    <Missing show={missing} />
                  </div>
                )
              })}
            </div>

            {/* Spec 076 AC-02-03 : aperçu du résultat Google. */}
            {block.id === 'seo' ? (
              <div aria-label="Aperçu Google" className="rounded-xl border border-gray-100 bg-gray-50/60 p-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Aperçu Google</p>
                <p className="mt-3 truncate text-xs text-gray-600">{publicUrl.replace(/^https?:\/\//, '')}</p>
                <p className="mt-1 line-clamp-2 text-lg leading-snug text-[#1a0dab]">{page.seo_title || 'Titre SEO'}</p>
                <p className="mt-1 line-clamp-3 text-[13px] leading-relaxed text-gray-600">{page.meta_description || 'Description SEO'}</p>
              </div>
            ) : null}
          </div>

          {block.repeatable ? (() => {
            const kind = block.repeatable
            const config = REPEATABLE[kind]
            const rows = page[kind] as Array<Record<string, string>>
            return (
              <fieldset className={`${block.fields.length > 0 ? 'mt-5 border-t border-gray-100 pt-5' : ''} min-w-0 space-y-3`}>
                <legend className="sr-only">{config.legend}</legend>
                {block.fields.length > 0 ? <p className="text-[13px] font-semibold text-gray-700">{config.legend} ({rows.length})</p> : null}
                <Missing show={issues.has(kind)} />
                {rows.map((row, index) => (
                  <div key={rowKeys[kind][index] ?? `${kind}-${index}`} className="grid gap-3 rounded-xl border border-gray-100 bg-gray-50/40 p-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,3fr)_auto] sm:items-start">
                    {config.keys.map((key, keyIndex) => {
                      const id = `${prefix}-${kind}-${index}-${key}`
                      const missing = issues.has(`${kind}.${index}.${key}`)
                      const props = {
                        id, value: row[key] ?? '',
                        maxLength: keyIndex === 0 ? (kind === 'faq' ? 240 : 160) : 2000,
                        'aria-invalid': missing || undefined,
                        onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setRowValue(kind, index, key, event.target.value),
                      }
                      return (
                        <div key={key} className="min-w-0 space-y-1">
                          <label htmlFor={id} className="text-[11px] font-semibold text-gray-500">{config.item} {index + 1} — {config.labels[keyIndex]}</label>
                          {keyIndex === 0 && kind !== 'faq' ? <Input {...props} /> : <Textarea {...props} rows={2} />}
                          <Missing show={missing} />
                        </div>
                      )
                    })}
                    <Button type="button" variant="ghost" size="icon" className="self-end text-gray-400 hover:text-rose-600 sm:mt-5 sm:self-start" aria-label={`Supprimer ${config.item.toLowerCase()} ${index + 1}`} onClick={() => removeRow(kind, index)}>
                      <Trash2 aria-hidden="true" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" disabled={rows.length >= config.max} onClick={() => addRow(kind)}>
                  <Plus aria-hidden="true" />{config.add}
                </Button>
              </fieldset>
            )
          })() : null}
        </section>
      ))}
    </div>
  )
}
