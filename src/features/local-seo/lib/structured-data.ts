import { organizationId, siteBaseUrl } from '@/features/seo/lib/site'
import type { JsonLdObject } from '@/features/seo/lib/structured-data'
import type { PublicLocalLandingDto } from '../types/landing-pages'
import { localSeoPath } from './paths'

export function localServiceSchema(
  landing: PublicLocalLandingDto,
  intent: 'concierge' | 'seminar',
): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: landing.page.h1,
    description: landing.page.meta_description,
    url: `${siteBaseUrl()}${localSeoPath(intent, landing.city.slug)}`,
    provider: { '@id': organizationId() },
    areaServed: { '@type': 'Place', name: landing.city.name },
  }
}
