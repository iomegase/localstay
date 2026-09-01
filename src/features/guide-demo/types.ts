export type DemoGuideView =
  | 'home'
  | 'lodging'
  | 'favorites'
  | 'map'
  | 'poi'
  | 'lodgings'
  | 'lodging-detail'
  | 'blog'
  | 'blog-detail'
  | 'contact'

export type DemoPoiCategory = {
  slug: string
  name: string
  icon: string
  color: string
}

export type DemoTrailGeometry = {
  type: 'MultiLineString'
  coordinates: readonly (readonly (readonly [number, number])[])[]
}

export type DemoTrail = {
  difficulty: 'easy' | 'medium' | 'hard' | 'expert' | 'unknown'
  estimatedDurationMinutes: number | null
  distanceKm: number | null
  elevationGainM: number | null
  startLabel: string | null
  trackingEnabled: false
  geometry?: DemoTrailGeometry
  startLatitude?: number | null
  startLongitude?: number | null
  reliability?: 'reliable' | 'indicative'
}

type DemoPoiDay = '0' | '1' | '2' | '3' | '4' | '5' | '6'

type DemoPoiHoursSlot = {
  readonly open: string
  readonly close: string
} | null

export type DemoPoiHours = Readonly<
  Partial<Record<DemoPoiDay, DemoPoiHoursSlot>>
>

export type DemoPoi = {
  id: `demo-${string}`
  name: string
  slug: string
  citySlug?: string
  category: DemoPoiCategory
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
  isOpenNow?: boolean
  website?: string
  phone?: string
  directionsUrl: string
  rating?: number
  reviewCount?: number
  hours?: DemoPoiHours
  ownerNote?: string
  trail?: DemoTrail
}

export type DemoPracticalCard = {
  id: `demo-${string}`
  title: string
  description: string
  icon: string
  phone?: string
  photoUrl?: string
  videoUrl?: string
}

export type DemoArrivalInstruction = {
  title?: string | null
  text: string
  videoUrl: string | null
  photos: string[]
}

export type DemoLodging = {
  id: `demo-${string}`
  name: string
  displayName: string
  city: string
  tagline: string
  coverImage: string
  gallery: string[]
  latitude: number
  longitude: number
  addressLabel: string
  maxGuests: number
  bedrooms: number
  surfaceM2: number
  checkIn: string
  checkOut: string
  presentationVideoUrl?: string
  wifiName: string
  wifiPassword: string
  arrivalInstructions: DemoArrivalInstruction[]
  departureInstructions: string[]
  houseRules: string[]
  practicalCards: DemoPracticalCard[]
  usefulNumbers: {
    label: string
    number: string
  }[]
  trashBins: {
    type: string
  }[]
  trashLocation: string | null
}

export type DemoLodgingCard = {
  id: `demo-${string}`
  slug: `demo-${string}`
  citySlug: string
  title: string
  cityName: string
  propertyType: string
  coverPhotoUrl: string
  shortDescription: string
  description: string
  maxGuests: number
  bedroomCount: number
  bathroomCount: number
  surfaceM2: number
  publicAreaLabel: string
  photos: readonly {
    url: string
    alt: string
    roomType?: string | null
    roomLabel?: string | null
  }[]
  amenitiesIncluded: readonly string[]
  amenitiesOnRequest: readonly string[]
}

export type DemoBlogPost = {
  id: `demo-${string}`
  slug: `demo-${string}`
  title: string
  excerpt: string
  categoryLabel: string
  coverUrl: string
  cityName: string
  contentMarkdown: string
}

export type DemoContact = {
  lodgingName: string
  cityName: string
  hostName: string
  responseLabel: string
}

export type DemoGuideData = {
  lodging: DemoLodging
  favoritePois: readonly DemoPoi[]
  lodgingCards: readonly DemoLodgingCard[]
  blogPosts: readonly DemoBlogPost[]
  contact: DemoContact
}
