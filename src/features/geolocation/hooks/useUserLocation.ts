'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  readStoredLocation,
  storeLocation,
  clearStoredLocation,
  storeDismissed,
  USER_LOCATION_EVENT,
  type UserLocation,
} from '../lib/user-location'

export type GeoStatus = 'idle' | 'loading' | 'ready' | 'denied' | 'unavailable'

type UseUserLocation = {
  location: UserLocation | null
  status: GeoStatus
  requestLocation: () => void
  clearLocation: () => void
  dismiss: () => void
}

/**
 * Expose la position utilisateur stockée et permet de la (re)demander au
 * navigateur. Plusieurs composants montés en même temps restent synchronisés
 * via `USER_LOCATION_EVENT` (et l'event natif `storage` entre onglets).
 */
export function useUserLocation(): UseUserLocation {
  const [location, setLocation] = useState<UserLocation | null>(null)
  const [status, setStatus] = useState<GeoStatus>('idle')

  // Lecture initiale + abonnement aux changements (autres composants / onglets).
  useEffect(() => {
    const sync = () => {
      const stored = readStoredLocation()
      setLocation(stored)
      setStatus(stored ? 'ready' : 'idle')
    }
    sync()
    window.addEventListener(USER_LOCATION_EVENT, sync)
    window.addEventListener('storage', sync)
    return () => {
      window.removeEventListener(USER_LOCATION_EVENT, sync)
      window.removeEventListener('storage', sync)
    }
  }, [])

  const requestLocation = useCallback(() => {
    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setStatus('unavailable')
      return
    }
    setStatus('loading')
    navigator.geolocation.getCurrentPosition(
      position => {
        const next: UserLocation = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }
        storeLocation(next) // déclenche USER_LOCATION_EVENT → sync
        setStatus('ready')
      },
      () => {
        setStatus('denied')
        storeDismissed()
      },
      { enableHighAccuracy: true, timeout: 8000, maximumAge: 300000 },
    )
  }, [])

  const clearLocation = useCallback(() => {
    clearStoredLocation() // déclenche USER_LOCATION_EVENT → sync (location null + status idle)
  }, [])

  const dismiss = useCallback(() => {
    storeDismissed()
  }, [])

  return { location, status, requestLocation, clearLocation, dismiss }
}
