'use client'

import { useState } from 'react'
import { marketingPrimaryButtonClass } from '@/features/marketing/components/marketing-styles'
import { ContactDialogFrame } from './ContactDialogFrame'

type FormState = 'idle' | 'submitting' | 'sent' | 'error'

const fieldClass = 'mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-normal normal-case tracking-normal outline-none transition-colors placeholder:text-slate-400 focus:border-pink-600 focus:ring-2 focus:ring-pink-100'
const labelClass = 'text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600'

// Prestations à chiffrer en plus de la location du chalet (spec 052, amendement du 2026-10-13).
const SERVICES = ['Salle de réunion', 'Repas', 'Transferts', 'Activités'] as const

/**
 * Bouton + modal de demande de devis séminaire (spec 052) : alimente le circuit
 * ContactMessage existant avec la source `seminar_lead`.
 */
export function SeminarLeadDialog({ label, cityName, triggerClassName = marketingPrimaryButtonClass }: { label: string; cityName?: string; triggerClassName?: string }) {
  const placePhrase = cityName ? `à ${cityName}` : 'dans le Pays du Mont-Blanc'
  const [open, setOpen] = useState(false)

  return (
    <ContactDialogFrame
      open={open}
      onOpenChange={setOpen}
      eyebrow="Séminaire d’entreprise"
      title="Demander une estimation"
      description={`Votre séminaire ${placePhrase} : location d’un chalet et prestations sur mesure. Décrivez votre projet, nous vous adressons une estimation sous 48 h.`}
      trigger={<button type="button" className={triggerClassName}>{label}</button>}
    >
      <SeminarLeadForm cityName={cityName} />
    </ContactDialogFrame>
  )
}

/** Formulaire séminaire, réutilisé par la modale contact (spec 053 AC-02-03). */
export function SeminarLeadForm({ cityName }: { cityName?: string }) {
  // Sans commune (page /seminaires) : demande pour le Pays du Mont-Blanc (spec 052 BR-05).
  const place = cityName ?? 'Pays du Mont-Blanc'
  const [state, setState] = useState<FormState>('idle')

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const text = (name: string) => String(data.get(name) ?? '').trim()
    const company = text('company')
    const dates = text('dates')
    const services = data.getAll('services').map(String)
    const budget = text('budget')
    setState('submitting')

    try {
      const response = await fetch('/api/public/contact-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'seminar_lead',
          destination: 'concierge',
          lodging_id: null,
          sender_name: text('name'),
          sender_email: text('email'),
          sender_phone: text('phone') || null,
          subject: `Demande séminaire — ${company} — ${place}`,
          message: [
            `Entreprise : ${company}`,
            `Participants : ${text('participants')}`,
            `Nuits : ${text('nights')}`,
            ...(dates ? [`Dates souhaitées : ${dates}`] : []),
            ...(services.length > 0 ? [`Prestations : ${services.join(', ')}`] : []),
            ...(budget ? [`Budget indicatif : ${budget}`] : []),
            '',
            text('project'),
          ].join('\n'),
          website: text('website'),
        }),
      })
      if (!response.ok) throw new Error('request_failed')
      form.reset()
      setState('sent')
    } catch {
      setState('error')
    }
  }

  return (
    <form aria-label="Demande séminaire" className="mt-7" onSubmit={submit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={labelClass}>Prénom et nom *<input className={fieldClass} autoComplete="name" name="name" required minLength={2} maxLength={120} /></label>
        <label className={labelClass}>Entreprise *<input className={fieldClass} autoComplete="organization" name="company" required minLength={2} maxLength={80} /></label>
        <label className={labelClass}>Adresse e-mail *<input className={fieldClass} autoComplete="email" name="email" required type="email" maxLength={180} /></label>
        <label className={labelClass}>Téléphone<input className={fieldClass} autoComplete="tel" name="phone" type="tel" maxLength={40} /></label>
        <label className={labelClass}>Nombre de participants *<input className={fieldClass} inputMode="numeric" name="participants" required type="number" min={1} max={500} /></label>
        <label className={labelClass}>Nombre de nuits *<input className={fieldClass} inputMode="numeric" name="nights" required type="number" min={1} max={30} /></label>
        <label className={labelClass}>Dates souhaitées<input className={fieldClass} name="dates" placeholder="Ex. : 12-14 mars 2027" maxLength={120} /></label>
        <label className={labelClass}>Budget indicatif<input className={fieldClass} name="budget" placeholder="Ex. : 15 000 € HT" maxLength={80} /></label>
      </div>
      <fieldset className="mt-5">
        <legend className={labelClass}>Prestations souhaitées</legend>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-3">
          {SERVICES.map(service => (
            <label key={service} className="flex min-h-11 items-center gap-2 text-sm text-slate-700">
              <input className="h-4 w-4 accent-pink-600" name="services" type="checkbox" value={service} />{service}
            </label>
          ))}
        </div>
      </fieldset>
      <label className={`${labelClass} mt-5 block`}>Votre projet *<textarea className={`${fieldClass} min-h-[120px] py-3`} name="project" required minLength={10} maxLength={1500} placeholder="Objectifs, format, besoins de travail, activités souhaitées…" /></label>
      <label className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">Site web<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <label className="mt-5 flex items-start gap-3 text-xs leading-5 text-slate-500"><input className="mt-1 accent-pink-600" required type="checkbox" />J’accepte que MyStay utilise ces informations uniquement pour répondre à ma demande.</label>
      {state === 'sent' && <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800" role="status">Merci. Votre demande a bien été envoyée. Nous revenons vers vous sous 48 h.</p>}
      {state === 'error' && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700" role="alert">La demande n’a pas pu être envoyée. Vérifiez les champs et réessayez.</p>}
      <button className={`${marketingPrimaryButtonClass} mt-6 w-full sm:w-auto`} disabled={state === 'submitting'} type="submit">
        {state === 'submitting' ? 'Envoi…' : 'Envoyer ma demande'}
      </button>
    </form>
  )
}
