'use client'

import { useEffect, useState } from 'react'
import Script from 'next/script'
import { usePathname } from 'next/navigation'
import { isPrivateAnalyticsPath } from '@/features/admin-analytics/lib/private-paths'
import {
  ANALYTICS_CONSENT_EVENT,
  ANALYTICS_CONSENT_KEY,
  readAnalyticsConsent,
} from '@/features/admin-analytics/lib/consent'
import type { AnalyticsConsentState } from '@/features/admin-analytics/types'

declare global {
  interface Window {
    [gaDisableKey: `ga-disable-${string}`]: boolean | undefined
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
  const pathname = usePathname()

  // Spec 075 AC-02-01 : aucun page_view GA4 sur les chemins privés, ni après avoir quitté
  // le site public (démontage du layout public lors d'une navigation vers l'admin).
  useEffect(() => {
    if (!measurementId) return
    const key = `ga-disable-${measurementId}` as const
    window[key] = isPrivateAnalyticsPath(pathname ?? window.location.pathname)
    return () => {
      window[key] = true
    }
  }, [measurementId, pathname])

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
