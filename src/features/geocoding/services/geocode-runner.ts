import { prisma } from '@/shared/lib/prisma'
import { geocodeAddress } from './mapbox-client'
import { validateGeocode } from './geo-validator'
import type { BatchResult, GeocodeResult } from '../types'

export async function runGeocodeBatch(params: {
  cityId?: string
  limit?: number
}): Promise<BatchResult> {
  const { cityId, limit = 10 } = params

  const pois = await prisma.pointOfInterest.findMany({
    where: {
      geocode_status: 'pending',
      is_active: true,
      deleted_at: null,
      ...(cityId ? { city_id: cityId } : {}),
    },
    take: limit,
    select: {
      id: true,
      address: true,
      city: { select: { latitude: true, longitude: true } },
    },
  })

  const result: BatchResult = { geocoded: 0, failed: 0, rejected: 0, skipped: 0 }

  for (const poi of pois) {
    try {
      const geocoded = await geocodeAddress(poi.address, {
        longitude: poi.city.longitude,
        latitude: poi.city.latitude,
      })

      if (!geocoded) {
        await markFailed(poi.id, 'No results from Mapbox')
        result.failed++
        continue
      }

      const validation = validateGeocode(geocoded, {
        latitude: poi.city.latitude,
        longitude: poi.city.longitude,
      })

      if (!validation.valid) {
        await markRejected(poi.id, validation.reason ?? 'Validation failed')
        result.rejected++
        console.log(`[Geocoding] Rejected POI ${poi.id}: ${validation.reason}`)
        continue
      }

      await markSuccess(poi.id, geocoded)
      result.geocoded++
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      console.error(`[Geocoding] Error for POI ${poi.id}:`, message)
      await markFailed(poi.id, message)
      result.failed++
    }
  }

  return result
}

async function markSuccess(id: string, result: GeocodeResult): Promise<void> {
  await prisma.pointOfInterest.update({
    where: { id },
    data: {
      latitude: result.latitude,
      longitude: result.longitude,
      geocode_status: 'success',
      geocoded_at: new Date(),
      geocode_provider: 'mapbox',
      geocode_error: null,
      geocode_attempts: { increment: 1 },
    },
  })
}

async function markFailed(id: string, error: string): Promise<void> {
  await prisma.pointOfInterest.update({
    where: { id },
    data: {
      geocode_status: 'failed',
      geocode_error: error,
      geocode_attempts: { increment: 1 },
    },
  })
}

async function markRejected(id: string, reason: string): Promise<void> {
  await prisma.pointOfInterest.update({
    where: { id },
    data: {
      geocode_status: 'rejected',
      geocode_error: reason,
      geocode_attempts: { increment: 1 },
    },
  })
}
