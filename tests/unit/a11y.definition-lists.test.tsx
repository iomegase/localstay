/** @jest-environment jsdom */

import { render } from '@testing-library/react'
import { MarketingPropertyCard } from '@/features/marketing/components/MarketingPropertyCard'
import { CompactLodgingCard } from '@/features/lodging-showcase/components/CompactLodgingCard'
import { LocalRentalCard } from '@/features/local-seo/components/LocalRentalCard'
import { LodgingEssentials } from '@/features/lodging-showcase/components/LodgingEssentials'
import type { MarketingLodgingCard } from '@/features/lodging-showcase/queries/public-lodgings'

// PageSpeed « Agentic Browsing » / axe definition-list + dlitem : une <dl> ne contient que
// des <dt>/<dd>, éventuellement regroupés dans des <div> qui ne contiennent eux-mêmes que <dt>/<dd>.
function expectWellFormedDefinitionLists(container: HTMLElement) {
  const lists = Array.from(container.querySelectorAll('dl'))
  expect(lists.length).toBeGreaterThan(0)
  for (const list of lists) {
    for (const child of Array.from(list.children)) {
      const tag = child.tagName.toLowerCase()
      if (tag === 'dt' || tag === 'dd') continue
      expect(tag).toBe('div')
      for (const grandChild of Array.from(child.children)) {
        expect(['dt', 'dd']).toContain(grandChild.tagName.toLowerCase())
      }
    }
  }
}

const lodging = {
  id: 'p1', slug: 'chalet', city_slug: 'saint-gervais-les-bains', title: 'Chalet Hygge',
  short_description: 'Court', property_type: 'chalet', max_guests: 6, bedroom_count: 3,
  public_area_label: null, cover_photo_url: null, amenities: [], href: '/logements/chalet',
  city_name: 'Saint-Gervais-les-Bains', bathroom_count: 2, surface_m2: 120,
  external_booking_url: null, external_booking_platform: null,
} as unknown as MarketingLodgingCard

describe('a11y — listes de définitions bien formées', () => {
  // La variante compacte n'affiche pas de caractéristiques (pas de <dl>).
  it('MarketingPropertyCard', () => {
    const { container } = render(<MarketingPropertyCard lodging={lodging} />)
    expectWellFormedDefinitionLists(container)
  })

  it('LocalRentalCard', () => {
    const { container } = render(<LocalRentalCard lodging={lodging} />)
    expectWellFormedDefinitionLists(container)
  })

  it('CompactLodgingCard', () => {
    const { container } = render(<CompactLodgingCard lodging={{ title: 'Chalet', href: '/logements/chalet', cityName: 'Saint-Gervais-les-Bains', surfaceM2: 120, maxGuests: 6, photo: null }} />)
    expectWellFormedDefinitionLists(container)
  })

  it.each([false, true])('LodgingEssentials (compact=%s)', compact => {
    const { container } = render(<LodgingEssentials title="Chalet" maxGuests={6} bedroomCount={3} bathroomCount={2} surfaceM2={120} compact={compact} />)
    expectWellFormedDefinitionLists(container)
  })

  it('garde l’icône décorative masquée aux technologies d’assistance', () => {
    const { container } = render(<MarketingPropertyCard lodging={lodging} />)
    for (const svg of Array.from(container.querySelectorAll('dl svg'))) {
      expect(svg).toHaveAttribute('aria-hidden', 'true')
    }
  })
})
