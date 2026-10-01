/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import { MarketingHome } from '@/features/marketing/components/MarketingHome'

function jsonLd(container: HTMLElement) {
  return [...container.querySelectorAll('script[type="application/ld+json"]')]
    .map(script => JSON.parse(script.textContent ?? '{}') as Record<string, unknown>)
}

describe('042 AC-05-06 — homepage structured data', () => {
  const territory = [
    { slug: 'saint-gervais-les-bains', name: 'Saint-Gervais-les-Bains' },
    { slug: 'saint-nicolas-de-veroce', name: 'Saint-Nicolas-de-Véroce' },
  ]

  it('emits a FAQPage matching the visible FAQ exactly', () => {
    const { container } = render(<MarketingHome lodgings={[]} territoryCities={territory} />)

    const faq = jsonLd(container).find(item => item['@type'] === 'FAQPage')!
    const visibleQuestions = screen.getAllByRole('group').map(group => group.querySelector('summary')!.textContent)
    const entities = faq.mainEntity as Array<{ '@type': string; name: string; acceptedAnswer: { '@type': string; text: string } }>
    expect(entities.map(entity => entity.name)).toEqual(visibleQuestions)
    for (const entity of entities) {
      expect(entity['@type']).toBe('Question')
      expect(entity.acceptedAnswer['@type']).toBe('Answer')
      expect(container.textContent).toContain(entity.acceptedAnswer.text)
    }
  })

  it('emits a concierge Service with the visible services and served area, and no invented facts', () => {
    const { container } = render(<MarketingHome lodgings={[]} territoryCities={territory} />)

    const service = jsonLd(container).find(item => item['@type'] === 'Service')!
    expect(service).toMatchObject({
      '@context': 'https://schema.org',
      name: 'Conciergerie de location saisonnière',
      serviceType: 'Conciergerie',
      provider: { '@id': 'https://www.mystay.city/#organization' },
      areaServed: [
        { '@type': 'AdministrativeArea', name: 'Pays du Mont-Blanc' },
        { '@type': 'City', name: 'Saint-Gervais-les-Bains' },
        { '@type': 'City', name: 'Saint-Nicolas-de-Véroce' },
      ],
    })
    const offers = (service.hasOfferCatalog as { itemListElement: Array<{ itemOffered: { name: string; description: string } }> }).itemListElement
    expect(offers.map(offer => offer.itemOffered.name)).toEqual([
      'Coordination des séjours', 'Accueil des voyageurs', 'Ménage & linge', 'Intendance', 'Guide digital MyStay',
    ])
    offers.forEach(offer => expect(container.textContent).toContain(offer.itemOffered.description))
    const raw = JSON.stringify(service)
    for (const forbidden of ['price', 'aggregateRating', 'review', 'telephone', 'address']) {
      expect(raw).not.toContain(`"${forbidden}"`)
    }
  })
})
