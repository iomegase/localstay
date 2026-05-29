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
    <div className="mx-auto w-full max-w-sm overflow-hidden">
      <div className="p-8">
        <div className="mb-8 text-center">
          <h1 className="sr-only">Créer un compte</h1>
          <h2 className="mb-3 text-2xl italic font-serif tracking-tight text-slate-900">
            Bienvenue chez vous
          </h2>
          <p className="text-[11px] text-slate-500">
            Rejoignez-nous en quelques instants.
          </p>

           {/* <p className="mt-6 text-[11px] leading-6 text-slate-500">
            Lorem ipsum dolor sit amet, consectetur adipiscing elit. Quisque et scelerisque elit. Mauris vestibulum, nulla at vestibulum sodales, ligula velit pellentesque diam, vitae hendrerit ipsum sem vitae libero. Donec condimentum sed nisl sit amet posuere. Donec facilisis ex quis purus accumsan.
            </p> */}
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* Ligne : Prénom / Nom */}
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-1">
              <label htmlFor="first_name" className="block text-[10px] uppercase tracking-wider font-light text-slate-900">
                Prénom
              </label>
              <div className="group relative">
                <input
                  id="first_name"
                  name="first_name"
                  type="text"
                  required
                  placeholder="Jean"
                  className="peer w-full rounded-none border-b-2 bg-slate-50 py-2.5 px-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:outline-none focus:ring-0 [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_30px_rgb(248,250,252)_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:black]"
                />
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-black transition-all duration-300 ease-out group-hover:w-full peer-focus:w-full" />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="last_name" className="block text-[10px] uppercase tracking-wider font-light text-slate-900">
                Nom
              </label>
              <div className="group relative">
                <input
                  id="last_name"
                  name="last_name"
                  type="text"
                  required
                  placeholder="Dupont"
                  className="peer w-full rounded-none border-b-2 bg-slate-50 py-2.5 px-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:outline-none focus:ring-0 [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_30px_rgb(248,250,252)_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:black]"
                />
                <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-black transition-all duration-300 ease-out group-hover:w-full peer-focus:w-full" />
              </div>
            </div>
          </div>

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
              <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-black transition-all duration-300 ease-out group-hover:w-full peer-focus:w-full" />
            </div>
          </div>

          {/* Input : Mot de passe */}
          <div className="space-y-1">
            <label htmlFor="password" className="block text-[10px] uppercase tracking-wider font-light text-slate-900">
              Mot de passe
            </label>
            <div className="group relative">
              <input
                id="password"
                name="password"
                type="password"
                required
                placeholder="••••••••"
                onChange={e => validatePassword(e.target.value)}
                className="peer w-full rounded-none border-b-2 bg-slate-50 py-2.5 px-3 text-sm text-slate-900 placeholder-slate-400 transition-colors focus:outline-none focus:ring-0 [&:-webkit-autofill]:[-webkit-box-shadow:0_0_0_30px_rgb(248,250,252)_inset] [&:-webkit-autofill]:[-webkit-text-fill-color:black]"
              />
              <div className="absolute bottom-0 left-0 h-[2px] w-0 bg-black transition-all duration-300 ease-out group-hover:w-full peer-focus:w-full" />
            </div>
            {passwordError && (
              <p className="animate-in fade-in pt-1 text-xs font-medium text-red-500">
                {passwordError}
              </p>
            )}
          </div>

          {/* Choix de rôle */}
          <div className="space-y-3 pt-2">
            <p className="block text-[10px] uppercase tracking-wider font-light text-slate-900">
              Je suis…
            </p>
            <div className="grid grid-cols-2 gap-3">
              {[
                { value: 'owner', label: 'Hébergeur', desc: 'Hôtel, gîte, conciergerie' },
                { value: 'merchant', label: 'Prestataire', desc: 'Restaurant, activité, spa' },
              ].map(({ value, label, desc }) => (
                <label
                  key={value}
                  className="flex cursor-pointer flex-col gap-1 border-2 border-slate-100 bg-slate-50 p-3 transition-all hover:bg-white has-[:checked]:border-black has-[:checked]:bg-white"
                >
                  <input
                    type="radio"
                    name="role"
                    value={value}
                    defaultChecked={value === 'owner'}
                    className="sr-only"
                  />
                  <span className="text-sm font-medium text-slate-900">{label}</span>
                  <span className="text-[11px] text-slate-500">{desc}</span>
                </label>
              ))}
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
            disabled={loading || !!passwordError}
            className="group mt-2 flex h-12 w-full items-center justify-center border border-black bg-black px-6 text-sm font-light uppercase text-white shadow-md transition-all hover:bg-white hover:text-black hover:shadow-lg disabled:opacity-50 disabled:shadow-none"
          >
            {loading ? (
              <span className="flex items-center gap-2">
                <svg className="h-4 w-4 animate-spin text-black group-hover:text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Création…
              </span>
            ) : (
              'Créer mon compte'
            )}
          </button>
        </form>

        <div className="mt-[30px] text-center text-[10px] text-slate-500">
          Déjà un compte ?{' '}
          <Link href="/auth/login" className="font-light uppercase text-slate-900 pl-2 hover:text-slate-900 hover:underline">
            Se connecter
          </Link>
        </div>
      </div>
    </div>
  )
}
