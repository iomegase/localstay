'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { LogOut } from 'lucide-react'

type Variant = 'sidebar' | 'header' | 'compact'

type Props = {
  variant?: Variant
  redirectTo?: string
  className?: string
  showLabel?: boolean
}

const STYLES: Record<Variant, string> = {
  sidebar:
    'flex h-[44px] w-full items-center gap-3 rounded-xl px-3 text-[13px] font-medium text-slate-500 transition-colors hover:bg-rose-50 hover:text-rose-700 disabled:opacity-60',
  header:
    'inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium text-charcoal/60 transition-colors hover:bg-charcoal/5 hover:text-charcoal disabled:opacity-60',
  compact:
    'inline-flex items-center gap-1.5 text-sm text-slate-500 transition-colors hover:text-rose-600 disabled:opacity-60',
}

export function LogoutButton({
  variant = 'header',
  redirectTo = '/auth/login',
  className = '',
  showLabel = true,
}: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [pending, startTransition] = useTransition()

  async function handleClick() {
    setSubmitting(true)
    try {
      await fetch('/api/auth/logout', { method: 'POST' }).catch(() => null)
      startTransition(() => {
        router.replace(redirectTo)
        router.refresh()
      })
    } finally {
      setSubmitting(false)
    }
  }

  const isBusy = submitting || pending

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isBusy}
      className={`${STYLES[variant]} ${className}`.trim()}
    >
      <LogOut className="h-4 w-4" />
      {showLabel && <span>{isBusy ? 'Déconnexion…' : 'Se déconnecter'}</span>}
    </button>
  )
}
