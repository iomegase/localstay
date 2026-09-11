import type { LocalSeoIntent } from '../types/landing-pages'

const intentSegments: Record<LocalSeoIntent, string> = {
  concierge: 'conciergerie',
  seminar: 'seminaires',
  'vacation-rental': 'locations-vacances',
}

export function localSeoPath(intent: LocalSeoIntent, citySlug: string): string {
  return `/${intentSegments[intent]}/${encodeURIComponent(citySlug)}`
}
