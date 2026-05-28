'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

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
    const body = {
      email: form.get('email') as string,
      password: form.get('password') as string,
      role: form.get('role') as string,
      first_name: form.get('first_name') as string,
      last_name: form.get('last_name') as string,
    }

    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = await res.json()

      if (!res.ok) {
        setError(json.error?.message ?? 'Une erreur est survenue')
        return
      }

      router.push(json.redirect_to)
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto w-full max-w-lg overflow-hidden rounded-2xl bg-white shadow-xl ring-1 ring-slate-100">
      {/* Barre de décoration unie en haut de la carte */}
      <div className="h-1.5 w-full bg-violet-600" />

      <div className="p-8">
      
        <div className="mb-8 text-center">
          {/* <div className="flex justify-center mb-3">
   
            <img 
              src="/logo.svg" 
              alt="Logo de l'application" 
              className="h-12 w-auto object-contain" 
            />
          </div> 
          
          {/* Titre conservé pour l'accessibilité mais caché visuellement */}
          <h1 className="sr-only">Créer un compte</h1>
          
          <p className="mt-2 text-sm text-slate-500">
            Rejoignez-nous en quelques instants
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          
          {/* Ligne : Prénom / Nom */}
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1">
              <label htmlFor="first_name" className="block text-sm font-semibold text-slate-700">
                Prénom
              </label>
              <div className="relative">
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  required
                  placeholder="Jean"
                  className="peer w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-0 py-2.5 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-0"
                />
                <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-violet-600 transition-all duration-300 ease-out peer-focus:w-full" />
              </div>
            </div>
            
            <div className="space-y-1">
              <label htmlFor="last_name" className="block text-sm font-semibold text-slate-700">
                Nom
              </label>
              <div className="relative">
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  required
                  placeholder="Dupont"
                  className="peer w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-0 py-2.5 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-0"
                />
                <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-violet-600 transition-all duration-300 ease-out peer-focus:w-full" />
              </div>
            </div>
          </div>

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
                className="peer w-full rounded-none border-0 border-b-2 border-slate-200 bg-transparent px-0 py-2.5 text-sm text-slate-900 placeholder-slate-300 focus:outline-none focus:ring-0"
              />
              <div className="absolute bottom-0 left-0 h-0.5 w-0 bg-violet-600 transition-all duration-300 ease-out peer-focus:w-full" />
            </div>
          </div>

          {/* Input : Mot de passe */}
          <div className="space-y-1">
            <label htmlFor="password" className="block text-sm font-semibold text-slate-700">
              Mot de passe
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

          {/* Choix de rôle */}
          <div className="space-y-3 pt-2">
            <label className="block text-sm font-semibold text-slate-700">
              Je suis...
            </label>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'owner', label: 'Hébergeur', desc: 'Hôtel, gîte, conciergerie' },
                { value: 'merchant', label: 'Prestataire', desc: 'Restaurant, activité, spa' },
              ].map(({ value, label, desc }) => (
                <label
                  key={value}
                  className="flex cursor-pointer flex-col gap-1 rounded-xl border-2 border-slate-100 bg-white p-3 transition-all hover:bg-slate-50 has-[:checked]:border-violet-600 has-[:checked]:bg-violet-50/50"
                >
                  <input 
                    type="radio" 
                    name="role" 
                    value={value} 
                    defaultChecked={value === 'owner'} 
                    className="sr-only" 
                  />
                  <span className="text-sm font-bold text-slate-900">{label}</span>
                  <span className="text-xs text-slate-500">{desc}</span>
                </label>
              ))}
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
            disabled={loading || !!passwordError}
            className="mt-4 flex h-12 w-full items-center justify-center rounded-xl bg-violet-600 px-6 text-sm font-semibold text-white shadow-md transition-all hover:bg-violet-700 hover:shadow-lg disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Création...
              </span>
            ) : (
              'Créer mon compte'
            )}
          </button>
        </form>

        <div className="mt-8 text-center text-sm text-slate-500">
          Déjà un compte ?{' '}
          <Link href="/auth/login" className="font-semibold text-violet-600 hover:text-violet-700 hover:underline">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  )
}