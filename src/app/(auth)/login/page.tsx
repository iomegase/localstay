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
    <div className="mx-auto w-full max-w-sm overflow-hidden ">
      <div className="p-8">
        <div className="mb-8 text-center">
          <h2 className="mb-14 text-2xl italic font-serif tracking-tight text-slate-900">
            Bon retour parmi nous
          </h2>
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

          {/* Input : Mot de passe */}
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              <label htmlFor="password" className="block text-[10px] uppercase tracking-wider font-light text-slate-900">
                Mot de passe
              </label>
              <Link 
                href="/auth/forgot-password" 
                className="font-light uppercase text-[10px] text-slate-900 pl-2 hover:text-slate-900 hover:underline"
              >
                Mot de passe oublié ?
              </Link>
            </div>
            <div className="group relative">
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                className="peer w-full rounded-none border-0 border-b-2 bg-slate-50 py-2.5 px-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:outline-none focus:ring-0 [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_30px_rgb(248,250,252)_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:black]"
              />
              {/* Animation de soulignement au survol (group-hover) et au focus (peer-focus) */}
              <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-black transition-all duration-300 ease-out group-hover:w-full peer-focus:w-full" />
            </div>
          </div>

          {/* Message d'erreur */}
          {error && (
            <div className="animate-in fade-in rounded-lg border border-red-200 bg-red-50 p-3 text-center text-xs font-medium text-red-600">
              {error}
            </div>
          )}

          {/* Bouton de soumission */}
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
                Connexion...
              </span>
            ) : (
              'Se connecter'
            )}
          </button>
        </form>

        <div className="mt-[30px] text-center text-[10px] text-slate-500">
          Pas encore de compte ?{' '}
          <Link href="/auth/register" className="font-light uppercase  text-slate-900 pl-2 hover:text-slate-900 hover:underline">
            Créer un compte
          </Link>
        </div>
      </div>
    </div>
  )
}