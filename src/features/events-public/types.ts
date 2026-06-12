import type { EventType } from '@/features/events-acquisition/types'

/** Facette de filtre par type sur la page agenda. */
export interface AgendaTypeFacet {
  type: EventType
  label: string
  count: number
}

/** Un événement tel qu'affiché dans la liste agenda. */
export interface AgendaListItem {
  id: string
  slug: string
  title: string
  dateLabel: string
  types: EventType[]
  venueName: string | null
  communeName: string
  imageUrl: string | null
}

/** Détail complet d'un événement pour sa page dédiée. */
export interface AgendaEventDetail {
  id: string
  slug: string
  title: string
  description: string | null
  dateLabel: string
  types: EventType[]
  venueName: string | null
  address: string | null
  communeName: string
  images: string[]
  website: string | null
  phone: string | null
  email: string | null
  priceInfo: string | null
}
