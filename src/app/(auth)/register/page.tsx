'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)

  function validatePassword(value: string) {
    setPasswordError(value.length > 0 && value.length < 8 ? 'Minimum 8 caractères' : null)
  }

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
    <div className="bg-white rounded-2xl shadow-sm border border-charcoal/8 p-8">
      <h2 className="font-serif italic text-2xl text-charcoal mb-6">Créer un compte</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="first_name" className="block text-sm font-medium text-charcoal mb-1">
              Prénom
            </label>
            <input
              id="first_name"
              name="first_name"
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl border border-charcoal/20 bg-ivory text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-forest/40"
            />
          </div>
          <div>
            <label htmlFor="last_name" className="block text-sm font-medium text-charcoal mb-1">
              Nom
            </label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              required
              className="w-full px-4 py-3 rounded-xl border border-charcoal/20 bg-ivory text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-forest/40"
            />
          </div>
        </div>

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

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-charcoal mb-1">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            onChange={e => validatePassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-charcoal/20 bg-ivory text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-forest/40"
          />
          {passwordError && (
            <p className="text-xs text-red-500 mt-1">{passwordError}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-charcoal mb-2">
            Je suis
          </label>
          <div className="grid grid-cols-2 gap-3">
            {[
              { value: 'owner', label: 'Hébergeur', desc: 'Hôtel, gîte, conciergerie' },
              { value: 'merchant', label: 'Prestataire', desc: 'Restaurant, activité, spa' },
            ].map(({ value, label, desc }) => (
              <label
                key={value}
                className="flex flex-col gap-0.5 border border-charcoal/20 rounded-xl px-4 py-3 cursor-pointer has-[:checked]:border-forest has-[:checked]:bg-forest/5 transition-colors"
              >
                <input type="radio" name="role" value={value} defaultChecked={value === 'owner'} className="sr-only" />
                <span className="font-semibold text-sm text-charcoal">{label}</span>
                <span className="text-xs text-charcoal/50">{desc}</span>
              </label>
            ))}
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading || !!passwordError}
          className="w-full py-3 bg-forest text-white rounded-xl font-semibold text-sm disabled:opacity-60 active:scale-[0.98] transition-transform"
        >
          {loading ? 'Création du compte…' : 'Créer mon compte'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-charcoal/60">
        Déjà un compte ?{' '}
        <Link href="/auth/login" className="text-forest font-medium hover:underline">
          Se connecter
        </Link>
      </p>
    </div>
  )
}
