'use client'

import { Suspense, useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const token = searchParams.get('token_hash') ?? ''

  // Règle métier strictement non modifiée
  useEffect(() => {
    if (!token) setError('Lien invalide ou expiré')
  }, [token])

  // Règle métier strictement non modifiée
  function validatePassword(value: string) {
    setPasswordError(value.length > 0 && value.length < 8 ? 'Minimum 8 caractères' : null)
  }

  // Règle métier strictement non modifiée
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError(null)
    setLoading(true)

    const form = new FormData(e.currentTarget)
    const password = form.get('password') as string
    const confirm = form.get('confirm') as string

    if (password !== confirm) {
      setError('Les mots de passe ne correspondent pas')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error?.message ?? 'Lien invalide ou expiré')
        return
      }

      router.push('/auth/login?reset=success')
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
        
        {/* En-tête avec Logo */}
        <div className="mb-8 text-center">
          {/* <div className="mb-3 flex justify-center">
         
            <img 
              src="/logo.png" 
              alt="Logo de l'application" 
              className="h-12 w-auto object-contain" 
            />
          </div> */}
          
          {/* Titre conservé pour l'accessibilité mais caché visuellement */}
          <h1 className="sr-only">Nouveau mot de passe</h1>
          
          <p className="mt-2 text-sm text-slate-500">
            Définissez votre nouveau mot de passe
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Input : Nouveau mot de passe */}
          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
              Nouveau mot de passe
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                onChange={e => validatePassword(e.target.value)}
                className="peer w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-0 py-2.5 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-0"
              />
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-violet-600 transition-all duration-300 ease-out peer-focus:w-full" />
            </div>
            {passwordError && (
              <p className="animate-in fade-in pt-1 text-xs font-medium text-red-500">
                {passwordError}
              </p>
            )}
          </div>

          {/* Input : Confirmer mot de passe */}
          <div className="space-y-1">
            <label htmlFor="confirm" className="block text-sm font-semibold text-slate-700">
              Confirmer le mot de passe
            </label>
            <div className="relative">
              <input
                id="confirm"
                name="confirm"
                type="password"
                required
                placeholder="••••••••"
                className="peer w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-0 py-2.5 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-0"
              />
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
            disabled={loading || !token || !!passwordError}
            className="mt-2 flex h-12 w-full items-center justify-center rounded-xl bg-violet-600 px-6 text-sm font-semibold text-white shadow-md transition-all hover:bg-violet-700 hover:shadow-lg disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Mise à jour...
              </span>
            ) : (
              'Définir le mot de passe'
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <Link 
            href="/auth/login" 
            className="text-sm font-medium text-slate-500 hover:text-violet-600 hover:underline"
          >
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense 
      fallback={
        <div className="mx-auto w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-100">
          <div className="h-1.5 w-full bg-violet-600" />
          <div className="h-[400px] animate-pulse bg-slate-50/50 p-8" />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}