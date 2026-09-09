import { localServiceSchema } from '@/features/local-seo/lib/structured-data'
import { publicLocalLanding } from '../fixtures/public-local-landing'
import { siteBaseUrl } from '@/features/seo/lib/site'

describe('046 local SEO structured data', () => {
  it('describes only the visible service, provider and city', () => {
    const landing = publicLocalLanding('CONCIERGE', {
      id: 'city-1', name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains',
    })
    const schema = localServiceSchema(landing, 'concierge')

    expect(schema).toEqual(expect.objectContaining({
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Conciergerie à Saint-Gervais-les-Bains',
      url: `${siteBaseUrl()}/conciergerie/saint-gervais-les-bains`,
      provider: { '@id': 'https://www.mystay.city/#organization' },
      areaServed: { '@type': 'Place', name: 'Saint-Gervais-les-Bains' },
    }))
    expect(JSON.stringify(schema)).not.toMatch(/prix|tarif|revenu|disponibilit/i)
  })
})
