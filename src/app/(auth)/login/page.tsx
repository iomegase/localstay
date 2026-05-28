'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Règle métier strictement non modifiée
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const email = form.get('email') as string
    const password = form.get('password') as string

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error?.message ?? 'Email ou mot de passe incorrect')
        return
      }

      window.location.assign(json.redirect_to)
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-100">
      {/* Barre de décoration unie en haut de la carte */}
      <div className="h-1.5 w-full bg-violet-600" />
      
      <div className="p-8">
        <div className="mb-8 text-center">
          <h2 className="text-2xl font-bold tracking-tight text-slate-900">
            Bon retour parmi nous
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Veuillez vous connecter à votre compte
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Input : Email */}
          <div className="space-y-1">
            <label htmlFor="email" className="block text-sm font-semibold text-slate-700">
              Adresse email
            </label>
            <div className="relative">
              <input
                id="email"
                name="email"
                type="email"
                required
                placeholder="vous@exemple.com"
                className="peer w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent py-2.5 px-0 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-0"
              />
              {/* Animation de soulignement au focus */}
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-violet-600 transition-all duration-300 ease-out peer-focus:w-full" />
            </div>
          </div>

          {/* Input : Mot de passe */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
                Mot de passe
              </label>
              <Link 
                href="/auth/forgot-password" 
                className="text-xs font-medium text-violet-600 hover:text-violet-700 hover:underline"
              >
                Oublié ?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="peer w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent py-2.5 px-0 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-0"
              />
              {/* Animation de soulignement au focus */}
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-violet-600 transition-all duration-300 ease-out peer-focus:w-full" />
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="animate-in fade-in rounded-lg border border-red-200 bg-red-50 p-3 text-center text-sm font-medium text-red-600">
              {error}
            </div>
          )}

          {/* Bouton de soumission */}
          <button
            type="submit"
            disabled={loading}
            className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-violet-600 px-6 text-sm font-semibold text-white shadow-md transition-all hover:bg-violet-700 hover:shadow-lg disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Connexion...
              </span>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
          Pas encore de compte ?{' '}
          <Link href="/auth/register" className="font-semibold text-violet-600 hover:text-violet-700 hover:underline">
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  )
}