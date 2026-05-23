'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const email = form.get('email') as string

    await fetch('/api/auth/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    })

    // Always show success — AC-04-01
    setSent(true)
    setLoading(false)
  }

  if (sent) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-charcoal/8 p-8 text-center">
        <p className="text-charcoal font-medium">Si cet email existe, un lien vous a été envoyé.</p>
        <Link href="/auth/login" className="block mt-4 text-sm text-forest hover:underline">
          Retour à la connexion
        </Link>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-charcoal/8 p-8">
      <h2 className="font-serif italic text-2xl text-charcoal mb-2">Mot de passe oublié</h2>
      <p className="text-sm text-charcoal/60 mb-6">
        Entrez votre email pour recevoir un lien de réinitialisation.
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-charcoal mb-1">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="w-full px-4 py-3 rounded-xl border border-charcoal/20 bg-ivory text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-forest/40"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-forest text-white rounded-xl font-semibold text-sm disabled:opacity-60 active:scale-[0.98] transition-transform"
        >
          {loading ? 'Envoi…' : 'Envoyer le lien'}
        </button>
      </form>

      <Link href="/auth/login" className="block mt-4 text-center text-sm text-charcoal/60 hover:text-forest">
        Retour à la connexion
      </Link>
    </div>
  )
}
