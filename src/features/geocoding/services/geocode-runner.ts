import { prisma } from '@/shared/lib/prisma'
import { geocodeAddress } from './mapbox-client'
import { validateGeocode } from './geo-validator'
import type { BatchResult, GeocodeResult } from '../types'
import { runPoiMutationWithDiscoveryReconciliation } from '@/features/public-discovery/queries/mutation-reconciliation'
import { safelyRevalidateDiscoveryPaths } from '@/features/public-discovery/lib/revalidation'

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
  const discoveryRevalidationPaths = new Set<string>()

  const collectDiscoveryPaths = (paths: string[]) => {
    for (const path of paths) discoveryRevalidationPaths.add(path)
  }

  try {
    for (const poi of pois) {
      try {
        const geocoded = await geocodeAddress(poi.address, {
          longitude: poi.city.longitude,
          latitude: poi.city.latitude,
        })

        if (!geocoded) {
          collectDiscoveryPaths(await markFailed(poi.id, 'No results from Mapbox'))
          result.failed++
          continue
        }

        const validation = validateGeocode(geocoded, {
          latitude: poi.city.latitude,
          longitude: poi.city.longitude,
        })

        if (!validation.valid) {
          collectDiscoveryPaths(await markRejected(poi.id, validation.reason ?? 'Validation failed'))
          result.rejected++
          console.log(`[Geocoding] Rejected POI ${poi.id}: ${validation.reason}`)
          continue
        }

        collectDiscoveryPaths(await markSuccess(poi.id, geocoded))
        result.geocoded++
      } catch (err) {
        if (isRecordNotFound(err)) {
          console.warn(`[Geocoding] POI ${poi.id} supprimé pendant le lot, ignoré`)
          result.skipped++
          continue
        }
        const message = err instanceof Error ? err.message : String(err)
        console.error(`[Geocoding] Error for POI ${poi.id}:`, message)
        try {
          collectDiscoveryPaths(await markFailed(poi.id, message))
        } catch (markError) {
          if (!isRecordNotFound(markError)) throw markError
          result.skipped++
          continue
        }
        result.failed++
      }
    }
    return result
  } finally {
    if (discoveryRevalidationPaths.size > 0) {
      safelyRevalidateDiscoveryPaths([...discoveryRevalidationPaths])
    }
  }
}

/** Prisma P2025 : la fiche a disparu entre la sélection du lot et sa mise à jour. */
function isRecordNotFound(error: unknown): boolean {
  return typeof error === 'object' && error !== null && (error as { code?: unknown }).code === 'P2025'
}

async function markSuccess(id: string, result: GeocodeResult): Promise<string[]> {
  const mutation = await runPoiMutationWithDiscoveryReconciliation({
    poiWhere: { id },
    auditActor: { type: 'SYSTEM' },
    cause: { source: 'geocoder', reason: 'geocode_succeeded' },
    mutate: tx => tx.pointOfInterest.update({
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
    }),
  })
  return mutation.discoveryRevalidationPaths
}

async function markFailed(id: string, error: string): Promise<string[]> {
  const mutation = await runPoiMutationWithDiscoveryReconciliation({
    poiWhere: { id },
    auditActor: { type: 'SYSTEM' },
    cause: { source: 'geocoder', reason: 'geocode_failed' },
    mutate: tx => tx.pointOfInterest.update({
      where: { id },
      data: {
        geocode_status: 'failed',
        geocode_error: error,
        geocode_attempts: { increment: 1 },
      },
    }),
  })
  return mutation.discoveryRevalidationPaths
}

async function markRejected(id: string, reason: string): Promise<string[]> {
  const mutation = await runPoiMutationWithDiscoveryReconciliation({
    poiWhere: { id },
    auditActor: { type: 'SYSTEM' },
    cause: { source: 'geocoder', reason: 'geocode_rejected' },
    mutate: tx => tx.pointOfInterest.update({
      where: { id },
      data: {
        geocode_status: 'rejected',
        geocode_error: reason,
        geocode_attempts: { increment: 1 },
      },
    }),
  })
  return mutation.discoveryRevalidationPaths
}
