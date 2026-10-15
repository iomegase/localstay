'use client'

import { Briefcase, ChevronLeft, ChevronRight, Home, Luggage } from 'lucide-react'
import { useState } from 'react'
import { marketingPrimaryButtonClass } from '@/features/marketing/components/marketing-styles'
import { ContactDialogFrame } from './ContactDialogFrame'
import { useContactLodgingOptions } from './ContactLodgingOptions'
import { OwnerLeadForm } from './OwnerLeadForm'
import { SeminarLeadForm } from './SeminarLeadDialog'

type FormState = 'idle' | 'submitting' | 'sent' | 'error'
type Profile = 'traveler' | 'owner' | 'company'

const fieldClass = 'mt-2 min-h-12 w-full rounded-xl border border-slate-200 bg-white px-4 text-sm font-normal normal-case tracking-normal outline-none transition-colors placeholder:text-slate-400 focus:border-pink-600 focus:ring-2 focus:ring-pink-100'
const labelClass = 'text-[11px] font-bold uppercase tracking-[0.08em] text-slate-600'

const PROFILES = [
  { id: 'traveler', label: 'Voyageur', copy: 'Une question sur un logement, des dates ou un séjour.', icon: Luggage },
  { id: 'owner', label: 'Propriétaire', copy: 'Vous souhaitez nous confier votre logement.', icon: Home },
  { id: 'company', label: 'Entreprise', copy: 'Vous préparez un séminaire ou un événement d’équipe.', icon: Briefcase },
] as const

const DESCRIPTIONS: Record<Profile | 'choose', string> = {
  choose: 'Dites-nous qui vous êtes : nous vous proposons le formulaire adapté à votre demande.',
  traveler: 'Une question sur un logement, vos dates ou votre séjour ?\nÉcrivez-nous, nous vous répondons par e-mail.',
  owner: 'Vous possédez un logement dans le Pays du Mont-Blanc ? Parlez-nous de votre projet, nous vous recontactons personnellement.',
  company: 'Votre séminaire dans le Pays du Mont-Blanc : décrivez votre projet, nous vous adressons une estimation sous 48 h.',
}

/**
 * Modale contact (spec 053) : préambule par profil (AC-02), puis formulaire
 * Voyageur (`help_contact`), Propriétaire (`owner_lead`) ou Entreprise (`seminar_lead`).
 * Avec `profile="traveler"`, ouvre directement le formulaire Voyageur (spec 046 AC-03-09/13).
 */
export function HelpContactDialog({
  label = 'Aide & contact',
  className,
  profile,
  lodgingOptions,
}: {
  label?: string
  className?: string
  profile?: 'traveler'
  lodgingOptions?: string[]
}) {
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Profile | null>(profile ?? null)

  function handleOpenChange(next: boolean) {
    setOpen(next)
    if (!next) setSelected(profile ?? null)
  }

  return (
    <ContactDialogFrame
      open={open}
      onOpenChange={handleOpenChange}
      eyebrow="Aide & contact"
      title="Nous écrire"
      description={DESCRIPTIONS[selected ?? 'choose']}
      trigger={<button type="button" className={className}>{label}</button>}
    >
      {selected === null ? (
        <fieldset className="mt-7">
          <legend className={labelClass}>Vous êtes…</legend>
          <div className="mt-3 grid gap-3">
            {PROFILES.map(({ id, label: profileLabel, copy, icon: Icon }) => (
              <button
                key={id}
                type="button"
                onClick={() => setSelected(id)}
                className="group flex min-h-16 items-center gap-4 rounded-2xl border border-slate-200 px-4 py-3 text-left transition-colors hover:border-pink-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600"
              >
                <span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-pink-50 text-pink-600">
                  <Icon aria-hidden="true" className="h-5 w-5" strokeWidth={1.8} />
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-bold text-slate-900">{profileLabel}</span>
                  <span className="mt-0.5 block text-xs leading-5 text-slate-500">{copy}</span>
                </span>
                <ChevronRight aria-hidden="true" className="h-5 w-5 text-slate-400 group-hover:text-pink-600" />
              </button>
            ))}
          </div>
        </fieldset>
      ) : (
        <>
          {!profile && (
            <button
              type="button"
              onClick={() => setSelected(null)}
              className="mt-5 inline-flex min-h-11 items-center gap-1 text-xs font-bold text-slate-500 hover:text-pink-600"
            >
              <ChevronLeft aria-hidden="true" className="h-4 w-4" />
              Changer de profil
            </button>
          )}
          {selected === 'traveler' && <TravelerContactForm lodgingOptions={lodgingOptions} />}
          {selected === 'owner' && <OwnerLeadForm />}
          {selected === 'company' && <SeminarLeadForm />}
        </>
      )}
    </ContactDialogFrame>
  )
}

function TravelerContactForm({ lodgingOptions: pageOptions }: { lodgingOptions?: string[] }) {
  // Logements de la page s'ils sont fournis, sinon tous les logements publiés (AC-02-06).
  const publishedOptions = useContactLodgingOptions()
  const lodgingOptions = pageOptions && pageOptions.length > 0 ? pageOptions : publishedOptions
  const [state, setState] = useState<FormState>('idle')

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const form = event.currentTarget
    const data = new FormData(form)
    const text = (name: string) => String(data.get(name) ?? '').trim()
    const lodging = text('lodging')
    const dates = text('dates')
    const guests = text('guests')
    setState('submitting')

    try {
      const response = await fetch('/api/public/contact-messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          source: 'help_contact',
          destination: 'concierge',
          lodging_id: null,
          sender_name: text('name'),
          sender_email: text('email'),
          sender_phone: text('phone') || null,
          subject: 'Aide & contact — Voyageur',
          message: [
            ...(lodging ? [`Logement : ${lodging}`] : []),
            ...(dates ? [`Dates souhaitées : ${dates}`] : []),
            ...(guests ? [`Voyageurs : ${guests}`] : []),
            text('message'),
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
    <form aria-label="Message voyageur" className="mt-5" onSubmit={submit}>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className={labelClass}>Prénom et nom *<input className={fieldClass} autoComplete="name" name="name" required minLength={2} maxLength={120} /></label>
        <label className={labelClass}>Adresse e-mail *<input className={fieldClass} autoComplete="email" name="email" required type="email" maxLength={180} /></label>
        <label className={labelClass}>Téléphone<input className={fieldClass} autoComplete="tel" name="phone" type="tel" maxLength={40} /></label>
        <label className={labelClass}>Logement concerné
          {lodgingOptions.length > 0 ? (
            <select className={fieldClass} defaultValue="" name="lodging">
              <option value="">Pas encore choisi</option>
              {lodgingOptions.map(option => <option key={option}>{option}</option>)}
            </select>
          ) : (
            <input className={fieldClass} name="lodging" maxLength={120} />
          )}
        </label>
        <label className={labelClass}>Dates souhaitées<input className={fieldClass} name="dates" placeholder="Du … au …" maxLength={120} /></label>
        <label className={labelClass}>Nombre de voyageurs<input className={fieldClass} name="guests" inputMode="numeric" maxLength={20} /></label>
      </div>
      <label className={`${labelClass} mt-5 block`}>Votre message *<textarea className={`${fieldClass} min-h-[140px] py-3`} name="message" required minLength={10} maxLength={1650} /></label>
      <label className="absolute left-[-10000px] top-auto h-px w-px overflow-hidden" aria-hidden="true">Site web<input name="website" tabIndex={-1} autoComplete="off" /></label>
      <label className="mt-5 flex items-start gap-3 text-xs leading-5 text-slate-500"><input className="mt-1 accent-pink-600" required type="checkbox" />J’accepte que MyStay utilise ces informations uniquement pour répondre à ma demande.</label>
      {state === 'sent' && <p className="mt-5 rounded-xl bg-emerald-50 p-4 text-sm text-emerald-800" role="status">Merci. Votre message a bien été envoyé. Nous vous répondons au plus vite.</p>}
      {state === 'error' && <p className="mt-5 rounded-xl bg-red-50 p-4 text-sm text-red-700" role="alert">Le message n’a pas pu être envoyé. Vérifiez les champs et réessayez.</p>}
      <button className={`${marketingPrimaryButtonClass} mt-6 w-full sm:w-auto`} disabled={state === 'submitting'} type="submit">
        {state === 'submitting' ? 'Envoi…' : 'Envoyer mon message'}
      </button>
    </form>
  )
}
