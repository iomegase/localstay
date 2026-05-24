import { geocodeAddress } from '@/features/geocoding/services/mapbox-client'
import { validateGeocode } from '@/features/geocoding/services/geo-validator'
import type { AcquisitionGeocode } from '../types'

export async function geocodeForAcquisition(
  address: string,
  cityCenter: { latitude: number; longitude: number },
): Promise<AcquisitionGeocode> {
  try {
    const result = await geocodeAddress(address, {
      latitude: cityCenter.latitude,
      longitude: cityCenter.longitude,
    })

    if (!result) return { status: 'failed', reason: 'No results from Mapbox' }

    const validation = validateGeocode(result, cityCenter)
    if (!validation.valid) {
      if (result.relevance >= 0.4) {
        return {
          status: 'pending_review',
          latitude: result.latitude,
          longitude: result.longitude,
          confidence: result.relevance,
          reason: validation.reason ?? 'Mapbox result requires review',
        }
      }
      return { status: 'rejected', reason: validation.reason ?? 'Mapbox result rejected' }
    }

    return {
      status: 'success',
      latitude: result.latitude,
      longitude: result.longitude,
      confidence: result.relevance,
    }
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    return { status: 'failed', reason }
  }
}
