'use client'

import { useId, useRef } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/shared/components/ui/accordion'
import { Button } from '@/shared/components/ui/button'
import { Input } from '@/shared/components/ui/input'
import { Textarea } from '@/shared/components/ui/textarea'
import type { LocalLandingPageInput } from '../types/landing-pages'

export const landingIntentLabels = { CONCIERGE: 'Conciergerie', SEMINAR: 'Séminaires', VACATION_RENTAL: 'Locations de vacances' } as const

const scalarFields = [
  ['seo_title', 'Titre SEO', 180], ['meta_description', 'Description SEO', 320],
  ['eyebrow', 'Surtitre', 100], ['h1', 'H1', 180], ['hero_title', 'Titre du bandeau', 240],
  ['hero_copy', 'Texte du bandeau', 2000], ['reassurance', 'Réassurance', 300],
  ['section_title', 'Titre de section', 240], ['section_copy', 'Texte de section', 2000],
  ['process_title', 'Titre des étapes', 240], ['local_title', 'Titre local', 240],
  ['local_copy', 'Texte local', 2000], ['cta_label', 'Libellé du CTA', 120],
  ['cta_href', 'Lien du CTA', 500], ['empty_copy', 'Texte sans logement', 2000],
] as const

type Props = {
  cityName: string
  pages: LocalLandingPageInput[]
  onChange: (pages: LocalLandingPageInput[]) => void
  onSubmit: () => void
  pending: boolean
}

export function LandingPageEditor({ cityName, pages, onChange, onSubmit, pending }: Props) {
  const prefix = useId()
  const rowSequence = useRef(0)
  const rowKeys = useRef(new Map<string, string[]>())

  function keysFor(intent: LocalLandingPageInput['intent'], field: 'highlights' | 'steps' | 'faq', length: number) {
    const group = `${intent}-${field}`
    const keys = rowKeys.current.get(group) ?? []
    while (keys.length < length) keys.push(`${prefix}-row-${rowSequence.current++}`)
    if (keys.length > length) keys.splice(length)
    rowKeys.current.set(group, keys)
    return keys
  }

  function removeRowKey(intent: LocalLandingPageInput['intent'], field: 'highlights' | 'steps' | 'faq', index: number, length: number) {
    keysFor(intent, field, length).splice(index, 1)
  }

  function update(index: number, changes: Partial<LocalLandingPageInput>) {
    onChange(pages.map((page, candidate) => candidate === index ? { ...page, ...changes } : page))
  }
  return (
    <form aria-label={`Contenus de ${cityName}`} onSubmit={event => { event.preventDefault(); onSubmit() }} className="min-w-0 space-y-4">
      <p className="text-sm text-slate-500">Les trois pages sont enregistrées ensemble. Les changements d’une ville active sont publiés immédiatement.</p>
      <fieldset disabled={pending} className="min-w-0">
        <Accordion type="single" collapsible>
          {pages.map((page, index) => (
            <AccordionItem key={page.intent} value={page.intent}>
              <AccordionTrigger>{landingIntentLabels[page.intent]}</AccordionTrigger>
              <AccordionContent>
                <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                  {scalarFields.map(([field, label, maxLength]) => {
                    const id = `${prefix}-${page.intent}-${field}`
                    const nullable = field === 'reassurance' || field === 'process_title' || field === 'empty_copy'
                    const props = { id, value: page[field] ?? '', maxLength, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(index, { [field]: nullable && !event.target.value ? null : event.target.value }) }
                    return <div key={field} className="min-w-0 space-y-2">
                      <label htmlFor={id} className="text-sm font-medium text-slate-700">{label}</label>
                      {maxLength >= 300 && field !== 'cta_href' ? <Textarea {...props} rows={3} /> : <Input {...props} />}
                    </div>
                  })}
                </div>
                {(['highlights', 'steps'] as const).map(field => {
                  const highlight = field === 'highlights'
                  const label = highlight ? 'Point fort' : 'Étape'
                  return <fieldset key={field} className="mt-6 min-w-0 space-y-3">
                    <legend className="text-sm font-semibold">{highlight ? 'Points forts' : 'Étapes'}</legend>
                    {page[field].map((item, itemIndex) => <div key={keysFor(page.intent, field, page[field].length)[itemIndex]} className="space-y-3 rounded-lg border border-slate-200 p-3">
                      {(['title', 'copy'] as const).map(key => {
                        const id = `${prefix}-${page.intent}-${field}-${itemIndex}-${key}`
                        const inputProps = { id, value: item[key], maxLength: key === 'title' ? 160 : 2000, onChange: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => update(index, { [field]: page[field].map((row, position) => position === itemIndex ? { ...row, [key]: event.target.value } : row) }) }
                        return <div key={key} className="space-y-2"><label htmlFor={id} className="text-sm">{label} {itemIndex + 1} — {key === 'title' ? 'Titre' : 'Texte'}</label>{key === 'title' ? <Input {...inputProps} /> : <Textarea {...inputProps} />}</div>
                      })}
                      <Button type="button" size="sm" variant="ghost" aria-label={`Supprimer ${highlight ? 'le point fort' : 'l’étape'} ${itemIndex + 1}`} onClick={() => {
                        removeRowKey(page.intent, field, itemIndex, page[field].length)
                        update(index, { [field]: page[field].filter((_, position) => position !== itemIndex) })
                      }}><Trash2 />Supprimer</Button>
                    </div>)}
                    <Button type="button" variant="outline" size="sm" disabled={page[field].length >= 12} onClick={() => update(index, { [field]: [...page[field], { title: '', copy: '' }] })}><Plus />{highlight ? 'Ajouter un point fort' : 'Ajouter une étape'}</Button>
                  </fieldset>
                })}
                <fieldset className="mt-6 min-w-0 space-y-3">
                  <legend className="text-sm font-semibold">FAQ</legend>
                  {page.faq.map((item, itemIndex) => <div key={keysFor(page.intent, 'faq', page.faq.length)[itemIndex]} className="space-y-3 rounded-lg border border-slate-200 p-3">
                    {(['question', 'answer'] as const).map(key => {
                      const id = `${prefix}-${page.intent}-faq-${itemIndex}-${key}`
                      return <div key={key} className="space-y-2"><label htmlFor={id} className="text-sm">FAQ {itemIndex + 1} — {key === 'question' ? 'Question' : 'Réponse'}</label><Textarea id={id} value={item[key]} maxLength={key === 'question' ? 240 : 2000} onChange={event => update(index, { faq: page.faq.map((row, position) => position === itemIndex ? { ...row, [key]: event.target.value } : row) })} /></div>
                    })}
                    <Button type="button" variant="ghost" size="sm" aria-label={`Supprimer la FAQ ${itemIndex + 1}`} onClick={() => {
                      removeRowKey(page.intent, 'faq', itemIndex, page.faq.length)
                      update(index, { faq: page.faq.filter((_, position) => position !== itemIndex) })
                    }}><Trash2 />Supprimer</Button>
                  </div>)}
                  <Button type="button" variant="outline" size="sm" disabled={page.faq.length >= 20} onClick={() => update(index, { faq: [...page.faq, { question: '', answer: '' }] })}><Plus />Ajouter une FAQ</Button>
                </fieldset>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </fieldset>
      <Button type="submit" disabled={pending} className="h-auto min-h-9 whitespace-normal">{pending ? 'Enregistrement…' : 'Enregistrer les trois pages'}</Button>
    </form>
  )
}
