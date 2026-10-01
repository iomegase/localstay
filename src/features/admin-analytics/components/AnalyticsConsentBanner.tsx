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
      className="fixed inset-x-3 bottom-3 z-[90] overflow-hidden rounded-[22px] border border-slate-200/70 bg-white p-4 shadow-[0_24px_70px_rgba(15,23,42,0.18)] sm:bottom-6 sm:left-6 sm:right-auto sm:w-[360px] sm:p-5"
    >
      {/* Texte et placement validés par le Product Owner (spec 030, 2026-10-01). */}
      <span className="flex items-center gap-3 text-[10px] font-extrabold uppercase tracking-[0.22em] text-slate-500">
        <span aria-hidden="true" className="h-0.5 w-4 bg-pink-600" />
        Cookies
      </span>
      <h2 className="mt-2 text-base font-bold tracking-[-0.03em] text-slate-900">
        Mesure d&apos;audience
      </h2>
      <p className="mt-1.5 text-[12.5px] leading-[1.6] text-slate-500">
        Avec votre accord, nous utilisons Google Analytics pour savoir quelles pages sont
        consultées et améliorer le site. Si vous refusez, aucun outil de mesure n&apos;est
        chargé et le site fonctionne normalement.
      </p>
      <div className="mt-4 flex gap-3">
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
