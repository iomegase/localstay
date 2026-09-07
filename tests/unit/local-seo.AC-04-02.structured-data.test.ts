import { localServiceSchema } from '@/features/local-seo/lib/structured-data'

describe('046 local SEO structured data', () => {
  it('describes only the visible service, provider and city', () => {
    const schema = localServiceSchema({
      name: 'Conciergerie à Saint-Gervais-les-Bains',
      description: 'Accueil voyageurs, ménage, linge, intendance et guide digital.',
      cityName: 'Saint-Gervais-les-Bains',
      path: '/conciergerie/saint-gervais-les-bains',
    })

    expect(schema).toEqual(expect.objectContaining({
      '@context': 'https://schema.org',
      '@type': 'Service',
      name: 'Conciergerie à Saint-Gervais-les-Bains',
      url: 'https://www.mystay.city/conciergerie/saint-gervais-les-bains',
      provider: { '@id': 'https://www.mystay.city/#organization' },
      areaServed: { '@type': 'Place', name: 'Saint-Gervais-les-Bains' },
    }))
    expect(JSON.stringify(schema)).not.toMatch(/prix|tarif|revenu|disponibilit/i)
  })
})
