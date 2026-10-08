import { geocodeAddress } from '@/features/geocoding/services/mapbox-client'
import { validateGeocode } from '@/features/geocoding/services/geo-validator'
import type { AcquisitionGeocode } from '../types'

const ACQUISITION_RANGE_KM = 30
/** Résultats Mapbox assez précis pour placer un lieu (pas un centre de commune). */
const PRECISE_PLACE_TYPES = new Set(['address', 'poi', 'poi.landmark'])

export async function geocodeForAcquisition(
  address: string,
  cityCenter: { latitude: number; longitude: number },
): Promise<AcquisitionGeocode> {
  try {
    const center = { latitude: cityCenter.latitude, longitude: cityCenter.longitude }
    // 2026-10-08 : une rue inconnue de Mapbox renvoyait un homonyme lointain (ex. « Chemin de Font
    // Froide » en Isère pour Saint-Gervais) : on préfère un résultat dans la zone, sinon on recherche
    // à nouveau dans un carré de 30 km autour de la ville.
    let result = await geocodeAddress(address, center, { preferWithinKm: ACQUISITION_RANGE_KM })
    if (!result) return { status: 'failed', reason: 'No results from Mapbox' }
    if (validateGeocode(result, cityCenter).outOfRange) {
      result = (await geocodeAddress(address, center, { bboxKm: ACQUISITION_RANGE_KM })) ?? result
    }

    const validation = validateGeocode(result, cityCenter)
    if (!validation.valid) {
      // Règle globale (AGENTS §10) : au-delà de 30 km, toujours rejeté — jamais « à vérifier ».
      if (validation.outOfRange) return { status: 'rejected', reason: validation.reason ?? 'Hors zone (> 30 km)' }
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

    // Seulement le code postal ou la commune : position approximative, à vérifier par l'admin.
    if (result.place_type && !PRECISE_PLACE_TYPES.has(result.place_type)) {
      return {
        status: 'pending_review',
        latitude: result.latitude,
        longitude: result.longitude,
        confidence: result.relevance,
        reason: `Position approximative : Mapbox ne situe que « ${result.place_name} »`,
      }
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
