'use client'

import { useEffect, useState, type ReactNode } from 'react'
import { clearInstallRecord, ensureInstallRecord, isInstallExpired } from '../lib/install-expiry'
import { isStandaloneDisplay, startInstallPromptCapture } from '../hooks/useGuideInstall'
import { GuideExpiredScreen } from './GuideExpiredScreen'

// Doit rester égal à PAGE_CACHE dans public/sw.js.
const GUIDE_PAGE_CACHE = 'mystay-guide-v1'

type GateStatus = 'pending' | 'ok' | 'expired'

async function postToServiceWorker(message: { type: string; lodgingId?: string }) {
  if (!('serviceWorker' in navigator)) return
  const registration = await navigator.serviceWorker.ready
  registration.active?.postMessage(message)
}

/**
 * Spec 059 : enregistre le service worker, capte l'invite d'installation et
 * applique la désactivation 7 jours du guide installé (US-03).
 */
export function GuidePwaRuntime({ lodgingId, children }: { lodgingId: string; children: ReactNode }) {
  const [status, setStatus] = useState<GateStatus>('pending')

  useEffect(() => {
    startInstallPromptCapture()
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js', { scope: '/' }).catch(() => undefined)
    }

    const params = new URLSearchParams(window.location.search)
    if (!isStandaloneDisplay()) {
      // AC-03-04 : un nouveau scan QR dans le navigateur relance une période de 7 jours.
      if (params.get('lodging') === lodgingId && params.get('source') !== 'pwa') {
        clearInstallRecord(lodgingId)
      }
      setStatus('ok')
      return
    }

    const record = ensureInstallRecord(lodgingId)
    if (isInstallExpired(record)) {
      setStatus('expired')
      void window.caches?.delete(GUIDE_PAGE_CACHE)
      void postToServiceWorker({ type: 'CLEAR_GUIDE' })
      return
    }
    setStatus('ok')
    void postToServiceWorker({ type: 'PRECACHE_GUIDE', lodgingId })
  }, [lodgingId])

  if (status === 'expired') return <GuideExpiredScreen />

  return (
    <div
      data-pwa-gate={status}
      // AC-03-03 : en mode installé, rien n'est visible avant la vérification.
      className={status === 'pending' ? '[@media(display-mode:standalone)]:invisible' : undefined}
    >
      {children}
    </div>
  )
}
