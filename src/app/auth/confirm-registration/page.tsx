'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function ConfirmationForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token_hash') ?? ''
  const code = searchParams.get('code') ?? ''
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const visibleError = error ?? ((!token && !code) ? 'Lien de confirmation invalide ou expiré' : null)

  async function confirmEmail() {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/auth/confirm-registration', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(token ? { token } : { code }),
      })
      const result = await response.json()
      if (!response.ok) {
        setError(result.error?.message ?? 'Lien de confirmation invalide ou expiré')
        return
      }
      router.push(result.redirect_to)
    } catch {
      setError('Impossible de confirmer votre adresse pour le moment. Veuillez réessayer.')
    } finally { setLoading(false) }
  }

  return (
    <div className="mx-auto w-full max-w-sm overflow-hidden p-8 text-center">
      <h1 className="mb-3 text-2xl italic font-serif tracking-tight text-slate-900">Confirmez votre adresse email</h1>
      <p className="text-sm text-slate-500">Validez votre adresse pour accéder à votre compte MyStay.</p>
      {visibleError && <p role="alert" className="mt-6 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-600">{visibleError}</p>}
      <button type="button" onClick={confirmEmail} disabled={loading || (!token && !code)} className="mt-6 flex min-h-12 w-full items-center justify-center border border-black bg-black px-4 text-sm uppercase text-white disabled:opacity-50">
        {loading ? 'Confirmation…' : 'Confirmer mon adresse email'}
      </button>
      <Link href="/auth/login" className="mt-6 inline-flex min-h-11 items-center text-sm underline text-slate-900">Se connecter</Link>
    </div>
  )
}

export default function ConfirmRegistrationPage() {
  return <Suspense fallback={<div className="mx-auto h-64 w-full max-w-sm animate-pulse bg-slate-50" />}><ConfirmationForm /></Suspense>
}
