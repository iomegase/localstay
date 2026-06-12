import type { EventType } from '@/features/events-acquisition/types'
import type { AgendaTypeFacet } from '../types'

const LABELS: Record<EventType, string> = {
  cultural: 'Culturel',
  sport: 'Sport',
  market: 'Marché',
  festival: 'Festival',
  social: 'Animation',
  other: 'Autre',
}

export function typeLabel(type: EventType): string {
  return LABELS[type] ?? 'Autre'
}

/**
 * Construit les facettes de filtre à partir des types de chaque événement.
 * Trié par compteur décroissant puis par libellé, pour un ordre stable.
 */
export function buildTypeFacets(eventTypeLists: EventType[][]): AgendaTypeFacet[] {
  const counts = new Map<EventType, number>()
  for (const list of eventTypeLists) {
    for (const t of list) counts.set(t, (counts.get(t) ?? 0) + 1)
  }
  return [...counts.entries()]
    .map(([type, count]) => ({ type, label: typeLabel(type), count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label))
}
