export type EventType = 'cultural' | 'sport' | 'market' | 'festival' | 'social' | 'other'

export interface EventPeriod {
  start: string // ISO date (YYYY-MM-DD)
  end: string
  startTime?: string
  endTime?: string
}

export interface ParsedEvent {
  sourceId: string
  sourceUpdatedAt: string | null
  title: string
  description: string | null
  eventTypes: EventType[]
  startDate: string
  endDate: string
  isRecurring: boolean
  periods: EventPeriod[]
  communeInsee: string
  communeName: string
  venueName: string | null
  address: string | null
  postalCode: string | null
  latitude: number | null
  longitude: number | null
  images: string[]
  website: string | null
  phone: string | null
  email: string | null
  priceInfo: string | null
  raw: unknown
}

export interface RunSummary {
  fetched: number
  matched: number
  upserted: number
  skipped: number
  deleted: number
}
