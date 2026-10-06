export type DemoGuideView =
  | 'home'
  | 'lodging'
  | 'arrival'
  | 'departure'
  | 'rules'
  | 'help'
  | 'transport'
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
  /** Spec 057 : temps MapBox figés depuis l'adresse vitrine. */
  travel?: { walkingSeconds: number | null; drivingSeconds: number | null }
  durationLabel?: string
  recommended?: boolean
  familyFriendly?: boolean
  nearby?: boolean
  isOpenNow?: boolean
  website?: string
  phone?: string
  directionsUrl: string
  walkingRoute?: readonly (readonly [number, number])[]
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
  /** Libellés des photos non encore fournies, affichées en cadre avec icône. */
  photoPlaceholders?: string[]
  /** Libellé d'un cadre vidéo avec icône, sans vidéo réelle. */
  videoPlaceholder?: string
}

export type DemoPhoneNumber = {
  label: string
  number: string
  hint?: string
}

export type DemoArrivalInstruction = {
  title?: string | null
  text: string
  videoUrl: string | null
  photos: string[]
  /** Spec 054 — étape typée, comme dans le guide privé. */
  // Module autonome (045 AC-02-02) : miroir structurel de guide-app/lib/arrival-steps.
  kind: 'address' | 'access' | 'garage' | 'ski' | 'custom'
  tip: string | null
  substeps: { title: string; detail: string }[]
  facts: { label: string; value: string }[]
  /** Libellés des photos non encore fournies, affichées en cadre avec icône. */
  photoPlaceholders?: string[]
  /** Libellé d'un cadre vidéo avec icône, sans vidéo réelle. */
  videoPlaceholder?: string
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
  bedroomCount: number
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
  usefulNumbers: DemoPhoneNumber[]
  emergencyNumbers: DemoPhoneNumber[]
  trashLocation: string | null
  /** Spec 054 BR-03 : jamais de code de boîte à clés dans la démo. */
  keyBoxCode: null
  stats: { guests: number; bedrooms: number; surfaceM2: number }
  /** Spec 055 AC-05-01 : jamais localisé, donc aucun appel réseau à l'ouverture. */
  locationPrecise: false
  facilibus: boolean
  transportCards: { id: `demo-${string}`; title: string; tag: string | null; body: string }[]
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
  bedroomCount: number | null
  bathroomCount: number | null
  surfaceM2: number | null
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
  publishedAt: string
}

export type DemoContact = {
  lodgingName: string
  cityName: string
  hostName: string
  responseLabel: string
}

export type DemoPublishedContent = {
  lodgingCards: readonly DemoLodgingCard[]
  blogPosts: readonly DemoBlogPost[]
}

export type DemoGuideData = {
  lodging: DemoLodging
  favoritePois: readonly DemoPoi[]
  lodgingCards: readonly DemoLodgingCard[]
  blogPosts: readonly DemoBlogPost[]
  contact: DemoContact
}
