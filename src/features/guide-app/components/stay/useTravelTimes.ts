'use client'

import { useEffect, useState } from 'react'
import type { TravelTimeValues } from './poi-search'

type TravelResponse = { status: 'available' | 'outside_coverage' | 'unavailable'; data: Record<string, TravelTimeValues> }

/** Temps de trajet depuis le logement de la session (spec 057), chargés une fois. */
export function useTravelTimes(enabled: boolean): Record<string, TravelTimeValues> | null {
  const [times, setTimes] = useState<Record<string, TravelTimeValues> | null>(null)

  useEffect(() => {
    if (!enabled) return
    const controller = new AbortController()
    fetch('/api/guide/travel-times', { signal: controller.signal })
      .then(response => (response.ok ? response.json() as Promise<TravelResponse> : null))
      .then(payload => {
        if (payload?.status === 'available') setTimes(payload.data)
      })
      .catch(() => {
        /* repli : distance à vol d'oiseau (AC-01-03) */
      })
    return () => controller.abort()
  }, [enabled])

  return enabled ? times : null
}
