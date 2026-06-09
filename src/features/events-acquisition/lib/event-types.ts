import type { EventType } from '../types'

const TYPE_MAP: Record<string, EventType> = {
  CulturalEvent: 'cultural',
  ShowEvent: 'cultural',
  Concert: 'cultural',
  Exhibition: 'cultural',
  TheaterEvent: 'cultural',
  ScreeningEvent: 'cultural',
  SportsCompetition: 'sport',
  SportsEvent: 'sport',
  SportsDemonstration: 'sport',
  SaleEvent: 'market',
  Fair: 'market',
  FairOrShow: 'market',
  FestivalEvent: 'festival',
  Festival: 'festival',
  SocialEvent: 'social',
  LocalAnimation: 'social',
  TraditionalCelebration: 'social',
  Carnival: 'social',
}

export function normalizeEventTypes(types: string[]): EventType[] {
  const out = new Set<EventType>()
  for (const t of types) {
    const key = t.includes(':') ? t.split(':').pop()! : t
    const mapped = TYPE_MAP[key]
    if (mapped) out.add(mapped)
  }
  if (out.size === 0) out.add('other')
  return [...out]
}
