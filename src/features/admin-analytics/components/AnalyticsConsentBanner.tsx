'use client'

import { useEffect, useState } from 'react'
import {
  ANALYTICS_CONSENT_EVENT,
  ANALYTICS_CONSENT_KEY,
  readAnalyticsConsent,
} from '@/features/admin-analytics/lib/consent'
import type { AnalyticsConsentState } from '@/features/admin-analytics/types'

export function AnalyticsConsentBanner() {
  const [consent, setConsent] = useState<AnalyticsConsentState>('unset')
  const [ready, setReady] = useState(false)

  useEffect(() => {
    setConsent(readAnalyticsConsent(window.localStorage.getItem(ANALYTICS_CONSENT_KEY)))
    setReady(true)
  }, [])

  if (!ready || consent !== 'unset') return null

  function saveConsent(nextConsent: Exclude<AnalyticsConsentState, 'unset'>) {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, nextConsent)
    window.dispatchEvent(
      new CustomEvent(ANALYTICS_CONSENT_EVENT, {
        detail: { consent: nextConsent },
      }),
    )
    setConsent(nextConsent)
  }

  return (
    <section
      aria-label="Consentement analytics"
      className="fixed inset-x-4 bottom-4 z-[90] mx-auto max-w-[400px] overflow-hidden rounded-[26px] border border-slate-200/70 bg-[radial-gradient(circle_at_100%_0,rgba(219,39,119,0.05),transparent_38%)] bg-white p-6 shadow-[0_30px_90px_rgba(15,23,42,0.18)] sm:bottom-6"
    >
      <span className="flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
        <span aria-hidden="true" className="h-0.5 w-4 bg-pink-600" />
        Confidentialité
      </span>
      <h2 className="mt-4 text-lg font-bold tracking-[-0.03em] text-slate-900">
        Mesure analytics
      </h2>
      <p className="mt-2 text-[13px] leading-[1.7] text-slate-500">
        Nous mesurons de façon anonyme la fréquentation de nos pages pour améliorer nos
        contenus et votre navigation. Vous pouvez l&apos;accepter ou la refuser, et changer
        d&apos;avis à tout moment.
      </p>
      <div className="mt-6 flex gap-3">
        <button
          type="button"
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full border border-slate-200 px-4 text-xs font-bold text-slate-700 transition-colors hover:border-slate-300 hover:bg-slate-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-slate-400"
          onClick={() => saveConsent('refused')}
        >
          Refuser
        </button>
        <button
          type="button"
          className="inline-flex min-h-11 flex-1 items-center justify-center rounded-full bg-slate-900 px-4 text-xs font-bold text-white shadow-[0_12px_30px_rgba(15,23,42,0.16)] transition-colors hover:bg-pink-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-pink-600"
          onClick={() => saveConsent('accepted')}
        >
          Accepter
        </button>
      </div>
    </section>
  )
}
