'use client'

import { useState } from 'react'
import { marketingPrimaryButtonClass } from '@/features/marketing/components/marketing-styles'
import { ContactDialogFrame } from './ContactDialogFrame'

type FormState = 'idle' | 'submitting' | 'sent' | 'error'

const fieldClass = 'mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-normal normal-case tracking-normal outline-none transition-colors placeholder:text-slate-400 focus:border-pink-600 focus:ring-2 focus:ring-pink-100'
const labelClass = 'text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600'

/**
 * Formulaire voyageur d'une fiche logement publique (amendement 028 du
 * 2026-10-05) : message à la conciergerie, logement désigné par son slug public.
 * Aucun identifiant de base ni lien vers le guide privé n'est exposé.
 */
export function LodgingInquiryDialog({
  lodgingSlug,
  lodgingTitle,
  className,
  analyticsCitySlug,
  analyticsLodgingId,
}: {
  lodgingSlug: string
  lodgingTitle: string
  className?: string
  analyticsCitySlug: string
  analyticsLodgingId: string
}) {
  const [open, setOpen] = useState(false)
  const [state, setState] = useState<FormState>('idle')

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setState('idle')
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const text = (name: string) => String(data.get(name) ?? '').trim()
    const dates = text('dates')
    const guests = text('guests')
    setState('submitting')

    try {
      const response = await fetch('/api/public/contact-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'lodging_inquiry',
          destination: 'concierge',
          lodging_slug: lodgingSlug,
          sender_name: text('name'),
          sender_email: text('email'),
          sender_phone: text('phone') || null,
          subject: `Demande logement — ${lodgingTitle}`,
          message: `${dates ? `Dates souhaitées : ${dates}\n` : ''}${guests ? `Voyageurs : ${guests}\n` : ''}${text('message')}`,
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
    <ContactDialogFrame
      open={open}
      onOpenChange={handleOpenChange}
      eyebrow="Votre séjour"
      title={lodgingTitle}
      description="Une question sur ce logement ou vos dates ? Écrivez à l’équipe MyStay, nous vous répondons par e-mail."
      trigger={(
        <button
          type="button"
          data-analytics-event="lodging_contact_click"
          data-analytics-city-slug={analyticsCitySlug}
          data-analytics-lodging-id={analyticsLodgingId}
          className={className}
        >
          Contacter
        </button>
      )}
    >
      <form aria-label={`Demande sur ${lodgingTitle}`} className="mt-7" onSubmit={submit}>
        <div className="grid gap-5 sm:grid-cols-2">
          <label className={labelClass}>Prénom et nom *<input className={fieldClass} autoComplete="name" name="name" required minLength={2} maxLength={120} /></label>
          <label className={labelClass}>Adresse e-mail *<input className={fieldClass} autoComplete="email" name="email" required type="email" maxLength={180} /></label>
          <label className={labelClass}>Téléphone<input className={fieldClass} autoComplete="tel" name="phone" type="tel" maxLength={40} /></label>
          <label className={labelClass}>Nombre de voyageurs<input className={fieldClass} name="guests" inputMode="numeric" maxLength={20} /></label>
        </div>
        <label className={`${labelClass} mt-5 block`}>Dates souhaitées<input className={fieldClass} name="dates" placeholder="Du … au …" maxLength={120} /></label>
        <label className={`${labelClass} mt-5 block`}>Votre message *<textarea className={`${fieldClass} min-h-[140px] py-3`} name="message" required minLength={10} maxLength={1700} /></label>
        <label className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">Site web<input name="website" tabIndex={-1} autoComplete="off" /></label>
        <label className="mt-5 flex items-start gap-3 text-xs leading-5 text-slate-500"><input className="mt-1 accent-pink-600" required type="checkbox" />J’accepte que MyStay utilise ces informations uniquement pour répondre à ma demande.</label>
        {state === 'sent' && <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800" role="status">Merci. Votre demande a bien été envoyée. Nous vous répondons au plus vite.</p>}
        {state === 'error' && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700" role="alert">La demande n’a pas pu être envoyée. Vérifiez les champs et réessayez.</p>}
        <button className={`${marketingPrimaryButtonClass} mt-6 w-full sm:w-auto`} disabled={state === 'submitting'} type="submit">
          {state === 'submitting' ? 'Envoi…' : 'Envoyer ma demande'}
        </button>
      </form>
    </ContactDialogFrame>
  )
}
