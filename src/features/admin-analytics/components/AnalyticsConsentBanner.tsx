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
      className="fixed inset-x-4 bottom-24 z-[90] rounded-3xl border border-gray-200 bg-white p-5 shadow-2xl shadow-black/10"
    >
      <h2 className="text-sm font-semibold text-gray-900">Mesure analytics</h2>
      <p className="mt-2 text-sm leading-relaxed text-gray-600">
        Acceptez-vous l&apos;activation de la mesure analytics pour nous aider a ameliorer le SEO, le GEO et les parcours publics ?
      </p>
      <div className="mt-4 flex gap-3">
        <button
          type="button"
          className="flex-1 rounded-xl border border-gray-300 px-4 py-3 text-sm font-medium text-gray-800"
          onClick={() => saveConsent('refused')}
        >
          Refuser
        </button>
        <button
          type="button"
          className="flex-1 rounded-xl bg-charcoal px-4 py-3 text-sm font-medium text-white"
          onClick={() => saveConsent('accepted')}
        >
          Accepter
        </button>
      </div>
    </section>
  )
}
