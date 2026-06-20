import type { AnalyticsConsentState } from '../types'

export const ANALYTICS_CONSENT_KEY = 'mystay_analytics_consent'
export const ANALYTICS_CONSENT_EVENT = 'mystay-analytics-consent-changed'

export function readAnalyticsConsent(rawValue: string | null | undefined): AnalyticsConsentState {
  if (rawValue === 'accepted' || rawValue === 'refused') {
    return rawValue
  }

  return 'unset'
}
