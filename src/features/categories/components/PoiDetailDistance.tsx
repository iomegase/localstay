'use client'

import { MapPin } from 'lucide-react'
import { useUserLocation } from '@/features/geolocation/hooks/useUserLocation'
import { haversineKm } from '@/features/geolocation/lib/user-location'
import {
  formatContextualDistance,
  type DistanceSource,
} from '../lib/distance-label'

interface Props {
  distanceKm: number | null
  distanceSource?: DistanceSource | null
  latitude: number
  longitude: number
}

export function PoiDetailDistance({
  distanceKm,
  distanceSource,
  latitude,
  longitude,
}: Props) {
  const { location } = useUserLocation()
  const displayedDistanceKm = location
    ? haversineKm(location.latitude, location.longitude, latitude, longitude)
    : distanceKm

  if (displayedDistanceKm === null) return null

  const source: DistanceSource | null = location ? 'user_location' : distanceSource ?? null
  const label = formatContextualDistance(displayedDistanceKm, source)

  return (
    <div className="px-6">
      <span className="inline-flex items-center gap-1.5 text-sm text-charcoal/60">
        <MapPin className="w-4 h-4" />
        <span data-testid="poi-detail-distance">{label}</span>
      </span>
    </div>
  )
}
