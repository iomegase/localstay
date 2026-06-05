'use client'

import { useState } from 'react'
import { Send } from 'lucide-react'
import type { ContactMessageDestination } from '../types'

type FormState = 'idle' | 'submitting' | 'sent' | 'error'

type ContactMessageFormProps = {
  lodgingId: string | null
  lodgingName: string | null
  allowOwnerDestination?: boolean
}

const DEFAULT_MESSAGE = {
  sender_name: '',
  sender_email: '',
  sender_phone: '',
  destination: 'owner' as ContactMessageDestination,
  subject: '',
  message: '',
}

export function ContactMessageForm({
  lodgingId,
  lodgingName,
  allowOwnerDestination = true,
}: ContactMessageFormProps) {
  const [form, setForm] = useState({
    ...DEFAULT_MESSAGE,
    destination: allowOwnerDestination ? 'owner' : 'concierge',
  })
  const [state, setState] = useState<FormState>('idle')
  const [error, setError] = useState<string | null>(null)

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setState('submitting')
    setError(null)

    const response = await fetch('/api/public/contact-messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        lodging_id: lodgingId,
        destination: form.destination,
        sender_name: form.sender_name,
        sender_email: form.sender_email,
        sender_phone: form.sender_phone.trim() === '' ? null : form.sender_phone,
        subject: form.subject,
        message: form.message,
      }),
    })

    if (!response.ok) {
      setState('error')
      setError('Le message n’a pas pu être envoyé. Vérifiez les champs et réessayez.')
      return
    }

    setState('sent')
    setForm({
      ...DEFAULT_MESSAGE,
      destination: allowOwnerDestination ? 'owner' : 'concierge',
    })
  }

  const inputClass = 'mt-2 h-11 w-full rounded-xl border border-gray-200 bg-white px-3 text-sm text-charcoal outline-none transition focus:border-charcoal'
  const labelClass = 'text-[11px] font-bold uppercase tracking-widest text-gray-500'

  return (
    <form onSubmit={submit} className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="mb-5">
        <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-gray-400">Message</p>
        <h2 className="mt-1 font-serif italic text-xl text-charcoal">Nous écrire</h2>
        {lodgingName && (
          <p className="mt-1 text-xs text-gray-500">Votre demande sera liée à {lodgingName}.</p>
        )}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-sender-name" className={labelClass}>Nom</label>
          <input
            id="contact-sender-name"
            className={inputClass}
            value={form.sender_name}
            minLength={2}
            maxLength={120}
            required
            onChange={(event) => setForm((current) => ({ ...current, sender_name: event.target.value }))}
          />
        </div>
        <div>
          <label htmlFor="contact-sender-email" className={labelClass}>Email</label>
          <input
            id="contact-sender-email"
            className={inputClass}
            type="email"
            value={form.sender_email}
            maxLength={180}
            required
            onChange={(event) => setForm((current) => ({ ...current, sender_email: event.target.value }))}
          />
        </div>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-sender-phone" className={labelClass}>Téléphone</label>
          <input
            id="contact-sender-phone"
            className={inputClass}
            type="tel"
            value={form.sender_phone}
            maxLength={40}
            onChange={(event) => setForm((current) => ({ ...current, sender_phone: event.target.value }))}
          />
        </div>
        <div>
          <label htmlFor="contact-destination" className={labelClass}>Destination</label>
          <select
            id="contact-destination"
            className={inputClass}
            value={form.destination}
            onChange={(event) => setForm((current) => ({
              ...current,
              destination: event.target.value as ContactMessageDestination,
            }))}
          >
            {allowOwnerDestination && <option value="owner">Propriétaire</option>}
            <option value="concierge">Conciergerie</option>
          </select>
        </div>
      </div>

      <div className="mt-4">
        <label htmlFor="contact-subject" className={labelClass}>Sujet</label>
        <input
          id="contact-subject"
          className={inputClass}
          value={form.subject}
          minLength={2}
          maxLength={160}
          required
          onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
        />
      </div>

      <div className="mt-4">
        <label htmlFor="contact-message" className={labelClass}>Message</label>
        <textarea
          id="contact-message"
          className="mt-2 min-h-32 w-full resize-y rounded-xl border border-gray-200 bg-white px-3 py-3 text-sm leading-relaxed text-charcoal outline-none transition focus:border-charcoal"
          value={form.message}
          minLength={10}
          maxLength={2000}
          required
          onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
        />
      </div>

      {state === 'sent' && (
        <p className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
          Message envoyé. L’équipe MyStay en garde une copie pour le suivi.
        </p>
      )}
      {error && (
        <p className="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={state === 'submitting'}
        className="mt-5 inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-charcoal px-5 text-sm font-bold text-white transition hover:bg-charcoal/90 disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Send className="h-4 w-4" />
        {state === 'submitting' ? 'Envoi...' : 'Envoyer le message'}
      </button>
    </form>
  )
}
