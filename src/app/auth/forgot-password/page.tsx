'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function ForgotPasswordPage() {
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const form = new FormData(e.currentTarget)
    const email = form.get('email') as string

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (!response.ok) {
        const result: { error?: { message?: string } } = await response.json()
        setError(result.error?.message ?? 'Impossible d’envoyer le lien. Veuillez réessayer.')
        return
      }
      setSent(true)
    } catch {
      setError('Impossible d’envoyer le lien. Vérifiez votre connexion et réessayez.')
    } finally {
      setLoading(false)
    }
  }

  if (sent) {
    return (
      <div className="mx-auto w-full max-w-sm overflow-hidden">
        <div className="p-8 text-center">
          <h2 className="mb-6 text-2xl italic font-serif tracking-tight text-slate-900">
            Vérifiez votre boîte mail
          </h2>
          <p className="text-sm text-slate-600">
            Si cet email existe, un lien de réinitialisation vous a été envoyé.
          </p>
          <Link
            href="/auth/login"
            className="mt-8 inline-block text-[10px] font-light uppercase tracking-wider text-slate-900 hover:underline"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden">
      <div className="p-8">
        <div className="mb-8 text-center">
          <h2 className="mb-3 text-2xl italic font-serif tracking-tight text-slate-900">
            Mot de passe oublié
          </h2>
          <p className="text-[11px] text-slate-500">
            Entrez votre email pour recevoir un lien de réinitialisation.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Input : Email */}
          <div className="space-y-1">
            <label htmlFor="email" className="block text-[10px] uppercase tracking-wider font-light text-slate-900">
              Adresse email
            </label>
            <div className="group relative">
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="vous@exemple.com"
                className="peer w-full rounded-none border-b-2 bg-slate-50 py-2.5 px-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:outline-none focus:ring-0 [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_30px_rgb(248,250,252)_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:black]"
              />
              {/* Animation de soulignement au survol (group-hover) et au focus (peer-focus) */}
              <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-black transition-all duration-300 ease-out group-hover:w-full peer-focus:w-full" />
            </div>
          </div>

          {/* Bouton de soumission */}
          {error && (
            <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={loading}
            className="group mt-2 flex h-12 w-full items-center justify-center border border-black bg-black px-6 text-sm font-light uppercase text-white shadow-md transition-all hover:bg-white hover:text-black hover:shadow-lg disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin text-black group-hover:text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Envoi…
              </span>
            ) : (
              'Envoyer le lien'
            )}
          </button>
        </form>

        <div className="mt-[30px] text-center text-[10px] text-slate-500">
          Vous vous en souvenez ?{' '}
          <Link href="/auth/login" className="font-light uppercase text-slate-900 pl-2 hover:text-slate-900 hover:underline">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  )
}
