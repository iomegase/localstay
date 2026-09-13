'use client'

import { useState } from 'react'
import { marketingPrimaryButtonClass } from '@/features/marketing/components/MarketingShell'

type FormState = 'idle' | 'submitting' | 'sent' | 'error'

const fieldClass = 'mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-normal normal-case tracking-normal outline-none transition-colors placeholder:text-slate-400 focus:border-pink-600 focus:ring-2 focus:ring-pink-100'
const labelClass = 'text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600'

export function OwnerLeadForm() {
  const [state, setState] = useState<FormState>('idle')

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const formElement = event.currentTarget
    setState('submitting')
    const data = new FormData(formElement)
    const capacity = String(data.get('capacity') ?? '').trim()
    const project = String(data.get('project') ?? '').trim()

    try {
      const response = await fetch('/api/public/contact-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'owner_lead',
          lodging_id: null,
          destination: 'concierge',
          sender_name: data.get('name'),
          sender_email: data.get('email'),
          sender_phone: String(data.get('phone') ?? '').trim() || null,
          subject: `Demande propriétaire — ${data.get('propertyType')} — ${data.get('city')}`,
          message: `${capacity ? `Capacité : ${capacity}\n` : ''}${project}`,
          website: data.get('website'),
        }),
      })
      if (!response.ok) throw new Error('request_failed')
      formElement.reset()
      setState('sent')
    } catch {
      setState('error')
    }
  }

  return (
    <form aria-label="Demande propriétaire" className="mt-8" onSubmit={submit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={labelClass}>Prénom et nom *<input className={fieldClass} autoComplete="name" name="name" required minLength={2} maxLength={120} /></label>
        <label className={labelClass}>Adresse e-mail *<input className={fieldClass} autoComplete="email" name="email" required type="email" maxLength={180} /></label>
        <label className={labelClass}>Téléphone<input className={fieldClass} autoComplete="tel" name="phone" type="tel" maxLength={40} /></label>
        <label className={labelClass}>Commune du logement *<input className={fieldClass} autoComplete="address-level2" name="city" required maxLength={120} /></label>
        <label className={labelClass}>Type de logement *<select className={fieldClass} defaultValue="" name="propertyType" required><option disabled value="">Sélectionner</option><option>Appartement</option><option>Chalet</option><option>Maison</option><option>Autre</option></select></label>
        <label className={labelClass}>Capacité d’accueil<select className={fieldClass} defaultValue="" name="capacity"><option value="">Sélectionner</option><option>1 à 4 voyageurs</option><option>5 à 8 voyageurs</option><option>9 à 12 voyageurs</option><option>13 voyageurs et plus</option></select></label>
      </div>
      <label className={`${labelClass} mt-5 block`}>Parlez-nous de votre projet *<textarea className={`${fieldClass} min-h-[135px] py-3`} name="project" required minLength={10} maxLength={1800} /></label>
      <label className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">Site web<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <label className="mt-5 flex items-start gap-3 text-xs leading-5 text-slate-500"><input className="mt-1 accent-pink-600" required type="checkbox" />J’accepte que MyStay utilise ces informations uniquement pour répondre à ma demande.</label>
      {state === 'sent' && <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800" role="status">Merci. Votre demande a bien été envoyée. Nous vous recontacterons personnellement.</p>}
      {state === 'error' && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700" role="alert">La demande n’a pas pu être envoyée. Vérifiez les champs et réessayez.</p>}
      <button className={`${marketingPrimaryButtonClass} mt-6`} disabled={state === 'submitting'} type="submit">{state === 'submitting' ? 'Envoi en cours…' : 'Envoyer ma demande'}</button>
    </form>
  )
}
