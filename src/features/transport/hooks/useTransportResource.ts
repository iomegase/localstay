'use client'

import { useEffect, useState } from 'react'
import type { TransportEnvelope } from '../types'

type ResourceState<T> = { envelope: TransportEnvelope<T> | null; failed: boolean; loading: boolean }
type StoredState<T> = ResourceState<T> & { url: string | null }

const MAX_BACKOFF_STEPS = 3

/**
 * Lecture d'une route transport, avec actualisation optionnelle : suspendue
 * onglet masqué, requête précédente annulée, jamais deux appels simultanés,
 * recul exponentiel après erreur, reprise au retour sur la page.
 */
export function useTransportResource<T>(url: string | null, refreshMs = 0): ResourceState<T> {
  const [state, setState] = useState<StoredState<T>>({ url: null, envelope: null, failed: false, loading: false })

  useEffect(() => {
    if (!url) return
    let stopped = false
    let inFlight = false
    let failures = 0
    let timer: ReturnType<typeof setTimeout> | undefined
    let controller: AbortController | undefined

    const schedule = () => {
      if (stopped || refreshMs <= 0 || document.hidden) return
      clearTimeout(timer)
      timer = setTimeout(load, refreshMs * 2 ** Math.min(failures, MAX_BACKOFF_STEPS))
    }

    async function load() {
      if (stopped || inFlight) return
      inFlight = true
      controller = new AbortController()
      try {
        const response = await fetch(url as string, { signal: controller.signal, cache: 'no-store' })
        if (!response.ok) throw new Error('transport_request_failed')
        const envelope = await response.json() as TransportEnvelope<T>
        failures = 0
        if (!stopped) setState({ url, envelope, failed: false, loading: false })
      } catch (error) {
        if (stopped || (error instanceof DOMException && error.name === 'AbortError')) return
        failures++
        setState(previous => ({ ...(previous.url === url ? previous : { envelope: null }), url, failed: true, loading: false }))
      } finally {
        inFlight = false
        schedule()
      }
    }

    const onVisibilityChange = () => {
      clearTimeout(timer)
      if (document.hidden) controller?.abort()
      else void load()
    }

    void load()
    if (refreshMs > 0) document.addEventListener('visibilitychange', onVisibilityChange)
    return () => {
      stopped = true
      clearTimeout(timer)
      controller?.abort()
      document.removeEventListener('visibilitychange', onVisibilityChange)
    }
  }, [url, refreshMs])

  // Un résultat d'une autre URL n'est jamais présenté pour la nouvelle.
  if (state.url !== url) return { envelope: null, failed: false, loading: Boolean(url) }
  return { envelope: state.envelope, failed: state.failed, loading: state.loading }
}
