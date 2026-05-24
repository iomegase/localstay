'use client'
import { useState } from 'react'
import Link from 'next/link'

export default function LoginPage() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    <div className="bg-white rounded-2xl shadow-sm border border-charcoal/8 p-8">
      <h2 className="font-serif italic text-2xl text-charcoal mb-6">Se connecter</h2>

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

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-charcoal mb-1">
            Mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="w-full px-4 py-3 rounded-xl border border-charcoal/20 bg-ivory text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-forest/40"
          />
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg">{error}</p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-forest text-white rounded-xl font-semibold text-sm disabled:opacity-60 active:scale-[0.98] transition-transform"
        >
          {loading ? 'Connexion…' : 'Se connecter'}
        </button>
      </form>

      <div className="mt-6 flex flex-col gap-2 text-center text-sm text-charcoal/60">
        <Link href="/auth/forgot-password" className="hover:text-forest transition-colors">
          Mot de passe oublié ?
        </Link>
        <span>
          Pas encore de compte ?{' '}
          <Link href="/auth/register" className="text-forest font-medium hover:underline">
            Créer un compte
          </Link>
        </span>
      </div>
    </div>
  )
}
