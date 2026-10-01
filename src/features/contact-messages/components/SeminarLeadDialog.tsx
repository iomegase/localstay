'use client'

import * as Dialog from '@radix-ui/react-dialog'
import { X } from 'lucide-react'
import { useState } from 'react'
import { marketingPrimaryButtonClass } from '@/features/marketing/components/marketing-styles'

type FormState = 'idle' | 'submitting' | 'sent' | 'error'

const fieldClass = 'mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-normal normal-case tracking-normal outline-none transition-colors placeholder:text-slate-400 focus:border-pink-600 focus:ring-2 focus:ring-pink-100'
const labelClass = 'text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600'

const PARTICIPANTS = ['Moins de 10', '10 à 15', '16 à 26', 'Plus de 26'] as const

/**
 * Bouton + modal de demande séminaire (spec 052) : alimente le circuit
 * ContactMessage existant avec la source `seminar_lead`.
 */
export function SeminarLeadDialog({ label, cityName }: { label: string; cityName: string }) {
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
    const company = text('company')
    const dates = text('dates')
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
          subject: `Demande séminaire — ${company} — ${cityName}`,
          message: [
            `Entreprise : ${company}`,
            `Participants : ${text('participants')}`,
            ...(dates ? [`Dates souhaitées : ${dates}`] : []),
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
    <Dialog.Root open={open} onOpenChange={handleOpenChange}>
      <Dialog.Trigger asChild>
        <button type="button" className={marketingPrimaryButtonClass}>
          {label}
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[140] bg-slate-950/30 backdrop-blur-lg" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-[141] max-h-[calc(100dvh-24px)] w-[min(640px,calc(100vw-24px))] -translate-x-1/2 -translate-y-1/2 overflow-y-auto rounded-[28px] bg-white p-6 shadow-[0_35px_120px_rgba(15,23,42,0.35)] outline-none sm:p-9"
        >
          <Dialog.Close
            aria-label="Fermer"
            className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-full text-slate-500 transition-colors hover:bg-slate-100 hover:text-slate-900"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </Dialog.Close>
          <span className="text-[10px] font-extrabold uppercase tracking-[0.22em] text-pink-600">
            Séminaire d’entreprise
          </span>
          <Dialog.Title className="mt-3 text-2xl font-bold tracking-[-0.04em] text-slate-900 sm:text-[30px]">
            Recevoir une proposition
          </Dialog.Title>
          <Dialog.Description className="mt-2 text-sm leading-6 text-slate-500">
            Votre séminaire à {cityName} : décrivez votre projet, nous revenons vers vous sous 48 h avec une proposition sur mesure.
          </Dialog.Description>

          <form aria-label="Demande séminaire" className="mt-7" onSubmit={submit}>
            <div className="grid gap-5 sm:grid-cols-2">
              <label className={labelClass}>Prénom et nom *<input className={fieldClass} autoComplete="name" name="name" required minLength={2} maxLength={120} /></label>
              <label className={labelClass}>Entreprise *<input className={fieldClass} autoComplete="organization" name="company" required minLength={2} maxLength={80} /></label>
              <label className={labelClass}>Adresse e-mail *<input className={fieldClass} autoComplete="email" name="email" required type="email" maxLength={180} /></label>
              <label className={labelClass}>Téléphone<input className={fieldClass} autoComplete="tel" name="phone" type="tel" maxLength={40} /></label>
              <label className={labelClass}>Nombre de participants *
                <select className={fieldClass} defaultValue="" name="participants" required>
                  <option disabled value="">Sélectionner</option>
                  {PARTICIPANTS.map(option => <option key={option}>{option}</option>)}
                </select>
              </label>
              <label className={labelClass}>Dates souhaitées<input className={fieldClass} name="dates" placeholder="Ex. : 12-14 mars 2027" maxLength={120} /></label>
            </div>
            <label className={`${labelClass} mt-5 block`}>Votre projet *<textarea className={`${fieldClass} min-h-[120px] py-3`} name="project" required minLength={10} maxLength={1800} placeholder="Objectifs, format, besoins de travail, activités souhaitées…" /></label>
            <label className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">Site web<input name="website" tabIndex={-1} autoComplete="off" /></label>
            <label className="mt-5 flex items-start gap-3 text-xs leading-5 text-slate-500"><input className="mt-1 accent-pink-600" required type="checkbox" />J’accepte que MyStay utilise ces informations uniquement pour répondre à ma demande.</label>
            {state === 'sent' && <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800" role="status">Merci. Votre demande a bien été envoyée. Nous revenons vers vous sous 48 h.</p>}
            {state === 'error' && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700" role="alert">La demande n’a pas pu être envoyée. Vérifiez les champs et réessayez.</p>}
            <button className={`${marketingPrimaryButtonClass} mt-6 w-full sm:w-auto`} disabled={state === 'submitting'} type="submit">
              {state === 'submitting' ? 'Envoi…' : 'Envoyer ma demande'}
            </button>
          </form>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
