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

  useEffect(() => {
    if (!token) setError('Lien invalide ou expiré')
  }, [token])

  function validatePassword(value: string) {
    setPasswordError(value.length > 0 && value.length < 8 ? 'Minimum 8 caractères' : null)
  }

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
    <div className="bg-white rounded-2xl shadow-sm border border-charcoal/8 p-8">
      <h2 className="font-serif italic text-2xl text-charcoal mb-6">Nouveau mot de passe</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-charcoal mb-1">
            Nouveau mot de passe
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            onChange={e => validatePassword(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-charcoal/20 bg-ivory text-charcoal text-sm focus:outline-none focus:ring-2 focus:ring-forest/40"
          />
          {passwordError && <p className="text-xs text-red-500 mt-1">{passwordError}</p>}
        </div>

        <div>
          <label htmlFor="confirm" className="block text-sm font-medium text-charcoal mb-1">
            Confirmer le mot de passe
          </label>
          <input
            id="confirm"
            name="confirm"
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
          disabled={loading || !token || !!passwordError}
          className="w-full py-3 bg-forest text-white rounded-xl font-semibold text-sm disabled:opacity-60 active:scale-[0.98] transition-transform"
        >
          {loading ? 'Mise à jour…' : 'Définir le mot de passe'}
        </button>
      </form>

      <Link href="/auth/login" className="block mt-4 text-center text-sm text-charcoal/60 hover:text-forest">
        Retour à la connexion
      </Link>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div className="bg-white rounded-2xl shadow-sm border border-charcoal/8 p-8 animate-pulse h-64" />}>
      <ResetPasswordForm />
    </Suspense>
  )
}
