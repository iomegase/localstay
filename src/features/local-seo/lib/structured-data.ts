import { organizationId, siteBaseUrl } from '@/features/seo/lib/site'
import type { JsonLdObject } from '@/features/seo/lib/structured-data'

export function localServiceSchema(input: {
  name: string
  description: string
  cityName: string
  path: string
}): JsonLdObject {
  return {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: input.name,
    description: input.description,
    url: `${siteBaseUrl()}${input.path}`,
    provider: { '@id': organizationId() },
    areaServed: { '@type': 'Place', name: input.cityName },
  }
}
