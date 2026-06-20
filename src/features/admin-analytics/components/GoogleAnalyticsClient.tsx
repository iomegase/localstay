'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import {
  ANALYTICS_CONSENT_EVENT,
  ANALYTICS_CONSENT_KEY,
  readAnalyticsConsent,
} from '@/features/admin-analytics/lib/consent'
import type { AnalyticsConsentState } from '@/features/admin-analytics/types'

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

function readStoredConsent(): AnalyticsConsentState {
  return readAnalyticsConsent(window.localStorage.getItem(ANALYTICS_CONSENT_KEY))
}

export function GoogleAnalyticsClient() {
  const [consent, setConsent] = useState<AnalyticsConsentState>('unset')
  const measurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID

  useEffect(() => {
    function syncConsent() {
      setConsent(readStoredConsent())
    }

    syncConsent()
    window.addEventListener(ANALYTICS_CONSENT_EVENT, syncConsent)
    window.addEventListener('storage', syncConsent)

    return () => {
      window.removeEventListener(ANALYTICS_CONSENT_EVENT, syncConsent)
      window.removeEventListener('storage', syncConsent)
    }
  }, [])

  if (consent !== 'accepted' || !measurementId) {
    return null
  }

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
        strategy="afterInteractive"
      />
      <Script
        id="google-analytics-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            window.gtag = window.gtag || function gtag(){window.dataLayer.push(arguments);};
            window.gtag('js', new Date());
            window.gtag('config', '${measurementId}', { anonymize_ip: true });
          `,
        }}
      />
    </>
  )
}
