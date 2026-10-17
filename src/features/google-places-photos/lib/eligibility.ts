/** Spec 103 AC-02-01 : désactivé par défaut — aucune requête Google sans `GOOGLE_PLACES_PHOTOS_ENABLED=true`. */
export function googlePlacesPhotosEnabled(): boolean {
  return process.env.GOOGLE_PLACES_PHOTOS_ENABLED === 'true' && Boolean(process.env.GOOGLE_PLACES_API_KEY)
}

/** Spec 103 AC-01-01 / BR-03 : seul un POI sans aucune photo MyStay, rattaché à Google, est éligible. */
export function isEligibleForGooglePhotos(poi: { photos: string[]; google_place_id: string | null }): boolean {
  return googlePlacesPhotosEnabled() && Boolean(poi.google_place_id) && poi.photos.length === 0
}
