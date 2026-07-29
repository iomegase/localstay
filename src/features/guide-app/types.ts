export type GuideMode = 'private' | 'demo'

export type GuideView =
  | 'home'
  | 'lodging'
  | 'arrival'
  | 'departure'
  | 'practical'
  | 'favorites'
  | 'map'
  | 'poi'

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
}

export type GuidePoi = {
  id: string
  name: string
  slug: string
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
  website?: string
  phone?: string
  directionsUrl: string
  rating?: number
  trail?: GuideTrailSummary
}

export type GuidePracticalCard = {
  id: string
  title: string
  description: string
  icon: string
}

export type GuideUsefulNumber = {
  label: string
  number: string
}

export type GuideLodging = {
  id: string
  name: string
  city: string
  tagline: string
  coverImage: string
  latitude: number
  longitude: number
  addressLabel: string
  checkIn: string
  checkOut: string
  wifiName: string
  wifiPassword: string
  arrivalInstructions: string[]
  departureInstructions: string[]
  equipment: string[]
  houseRules: string[]
  practicalCards: GuidePracticalCard[]
  usefulNumbers: GuideUsefulNumber[]
}
