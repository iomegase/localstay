import type { AcquisitionGeocode } from '../types'

/** Fournisseur à enregistrer : OSM ou Mapbox quand une position existe, sinon null. */
export function geocodeProvider(geocode: AcquisitionGeocode): 'mapbox' | 'openstreetmap' | null {
  if (geocode.status === 'success') return geocode.provider ?? 'mapbox'
  return geocode.status === 'pending_review' ? 'mapbox' : null
}
