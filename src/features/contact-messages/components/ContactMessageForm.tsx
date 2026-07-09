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

  // --- NOUVELLES CLASSES CSS (Border bottom uniquement) ---
  const inputClass = 'mt-1 h-11 w-full border-0 border-b border-gray-200 bg-transparent px-0 text-[12px] text-charcoal outline-none transition-all placeholder:text-gray-400 focus:border-charcoal focus:ring-0'
  const labelClass = 'text-[10px] font-bold uppercase tracking-widest text-gray-800'

  return (
    <form onSubmit={submit} className="p-1">
      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-sender-name" className={labelClass}>Nom</label>
          <input
            id="contact-sender-name"
            className={inputClass}
            placeholder="John Doe"
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
            placeholder="john@exemple.com"
            value={form.sender_email}
            maxLength={180}
            required
            onChange={(event) => setForm((current) => ({ ...current, sender_email: event.target.value }))}
          />
        </div>
      </div>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-sender-phone" className={labelClass}>Téléphone</label>
          <input
            id="contact-sender-phone"
            className={inputClass}
            type="tel"
            placeholder="+33 6 12 34 56 78"
            value={form.sender_phone}
            maxLength={40}
            onChange={(event) => setForm((current) => ({ ...current, sender_phone: event.target.value }))}
          />
        </div>
        <div>
          <label htmlFor="contact-destination" className={labelClass}>Destination</label>
          <select
            id="contact-destination"
            className={`${inputClass} cursor-pointer appearance-none`}
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

      <div className="mt-6">
        <label htmlFor="contact-subject" className={labelClass}>Sujet</label>
        <input
          id="contact-subject"
          className={inputClass}
          placeholder="Raison de votre message..."
          value={form.subject}
          minLength={2}
          maxLength={160}
          required
          onChange={(event) => setForm((current) => ({ ...current, subject: event.target.value }))}
        />
      </div>

      <div className="mt-6">
        <label htmlFor="contact-message" className={labelClass}>Message</label>
        <textarea
          id="contact-message"
          // Classes Textarea spécifiques pour le border-bottom
          className="mt-1 min-h-[120px] w-full resize-y border-0 border-b text-[12px] border-gray-200 bg-transparent px-0 py-3 leading-relaxed text-charcoal outline-none transition-all placeholder:text-gray-400 focus:border-charcoal focus:ring-0"
          placeholder="Écrivez votre message ici..."
          value={form.message}
          minLength={10}
          maxLength={2000}
          required
          onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))}
        />
      </div>

      {state === 'sent' && (
        <p className="mt-6 rounded-xl bg-emerald-50 px-5 py-4 text-[14px] font-medium text-emerald-800 border border-emerald-100">
          Message envoyé. L’équipe MyStay en garde une copie pour le suivi.
        </p>
      )}
      {error && (
        <p className="mt-6 rounded-xl bg-red-50 px-5 py-4 text-[14px] font-medium text-red-700 border border-red-100">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={state === 'submitting'}
        className="mt-8 inline-flex h-12 w-full items-center tracking-wider  uppercase justify-center gap-2 rounded-md bg-charcoal px-5 text-[14px] font-light text-white transition-all hover:bg-charcoal/90 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60 active:scale-[0.98]"
      >
       
        {state === 'submitting' ? 'Envoi...' : 'Envoyer le message'}
      </button>
    </form>
  )
}