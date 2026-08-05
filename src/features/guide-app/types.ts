import type { PoiHours } from '@/features/categories/types'

export type GuideMode = 'private' | 'demo'

export type GuideView =
  | 'home'
  | 'lodging'
  | 'arrival'
  | 'departure'
  | 'practical'
  | 'rules'
  | 'favorites'
  | 'map'
  | 'poi'

export type GuideRouteMap = Partial<
  Record<Exclude<GuideView, 'poi'>, string>
>

export type GuidePoiCategory = {
  slug: string
  name: string
  icon: string
  color: string
}

export type GuideTrailSummary = {
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'unknown'
  estimatedDurationMinutes: number | null
  distanceKm: number | null
  elevationGainM: number | null
  startLabel: string | null
  trackingEnabled: boolean
  geometry?: unknown
  startLatitude?: number | null
  startLongitude?: number | null
  reliability?: 'reliable' | 'indicative'
}

export type GuidePoi = {
  id: string
  name: string
  slug: string
  citySlug?: string
  category: GuidePoiCategory
  description: string
  shortDescription: string
  photos: string[]
  latitude: number
  longitude: number
  address: string
  distanceLabel?: string
  durationLabel?: string
  recommended?: boolean
  familyFriendly?: boolean
  nearby?: boolean
  /** Statut d'ouverture instantané, quand le lieu a des horaires (sinon absent). */
  isOpenNow?: boolean
  website?: string
  phone?: string
  directionsUrl: string
  rating?: number
  /** Nombre d'avis affiché à côté de la note. */
  reviewCount?: number
  /** Horaires d'ouverture par jour (0 = dimanche). */
  hours?: PoiHours
  /** Mot de l'hôte pour ce POI (recommandation éditoriale). */
  ownerNote?: string
  trail?: GuideTrailSummary
}

export type GuidePracticalCard = {
  id: string
  title: string
  description: string
  icon: string
  /** Numéro de téléphone à appeler (bouton d'appel sur la card). */
  phone?: string
  /** Photo (URL) présentée en vignette → modal. */
  photoUrl?: string
  /** Vidéo YouTube présentée en vignette → modal. */
  videoUrl?: string
}

export type GuideUsefulNumber = {
  label: string
  number: string
}

export type GuideArrivalInstruction = {
  text: string
  videoUrl: string | null
  photos: string[]
}

export type GuideLodging = {
  id: string
  name: string
  city: string
  tagline: string
  coverImage: string
  /** Galerie photo du logement (carrousel). */
  gallery: string[]
  latitude: number
  longitude: number
  addressLabel: string
  checkIn: string
  checkOut: string
  wifiName: string
  wifiPassword: string
  arrivalInstructions: GuideArrivalInstruction[]
  departureInstructions: string[]
  equipment: string[]
  houseRules: string[]
  practicalCards: GuidePracticalCard[]
  usefulNumbers: GuideUsefulNumber[]
  /** Infos parking affichées sur la page d'arrivée. */
  parkingInfo: string
  parkingPhotoUrl: string | null
  parkingVideoUrl: string | null
  /** Bacs de tri actifs (recyclage) + localisation du point de tri. */
  trashBins: { type: string }[]
  trashLocation: string | null
}

export type PrivateGuideData = {
  lodging: GuideLodging
  pois: GuidePoi[]
}
