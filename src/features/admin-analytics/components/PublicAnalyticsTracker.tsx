'use client'

import { useEffect } from 'react'
import { ANALYTICS_CONSENT_KEY, readAnalyticsConsent } from '@/features/admin-analytics/lib/consent'

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

type TrackableElement = HTMLElement & {
  dataset: DOMStringMap & {
    analyticsEvent?: string
    analyticsCitySlug?: string
    analyticsLodgingId?: string
  }
}

export function PublicAnalyticsTracker() {
  useEffect(() => {
    async function handleClick(event: MouseEvent) {
      const target = event.target
      if (!(target instanceof HTMLElement)) return

      const clickable = target.closest('[data-analytics-event]') as TrackableElement | null
      if (!clickable?.dataset.analyticsEvent) return

      const consent = readAnalyticsConsent(window.localStorage.getItem(ANALYTICS_CONSENT_KEY))
      if (consent !== 'accepted') return

      const payload = {
        event_type: clickable.dataset.analyticsEvent,
        consent_state: 'accepted',
        page_path: window.location.pathname,
        city_slug: clickable.dataset.analyticsCitySlug ?? null,
        lodging_id: clickable.dataset.analyticsLodgingId ?? null,
      }

      if (typeof window.gtag === 'function') {
        window.gtag('event', clickable.dataset.analyticsEvent, {
          page_path: payload.page_path,
          city_slug: payload.city_slug,
          lodging_id: payload.lodging_id,
        })
      }

      try {
        // Best-effort beacon: keepalive lets it survive the navigation that the
        // same click often triggers; failures (offline, aborted request) must
        // never surface as an unhandled rejection.
        await window.fetch('/api/public/analytics/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
          keepalive: true,
        })
      } catch {
        // Analytics is non-critical; swallow network/abort errors silently.
      }
    }

    document.addEventListener('click', handleClick)
    return () => document.removeEventListener('click', handleClick)
  }, [])

  return null
}
