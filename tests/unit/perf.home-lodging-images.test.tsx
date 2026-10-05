/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import { MarketingHome } from '@/features/marketing/components/MarketingHome'
import { MarketingPropertyCard } from '@/features/marketing/components/MarketingPropertyCard'
import type { MarketingLodgingCard } from '@/features/lodging-showcase/queries/public-lodgings'

const lodging = (id: string): MarketingLodgingCard => ({
  id, slug: id, city_slug: 'saint-gervais-les-bains', title: `Chalet ${id}`,
  short_description: 'Court', property_type: 'chalet', max_guests: 6, bedroom_count: 3,
  public_area_label: null, cover_photo_url: `https://abcdefgh.supabase.co/storage/v1/object/public/guide-photos/${id}.webp`,
  amenities: [], href: `/logements/${id}`, city_name: 'Saint-Gervais-les-Bains', bathroom_count: 2,
  surface_m2: 120, external_booking_url: null, external_booking_platform: null,
}) as unknown as MarketingLodgingCard

// PageSpeed mobile (2026-10-05) : photos des logements de l'accueil chargées tout de suite
// et ~2,5× trop grandes (carte de 280 px annoncée en 100vw) → elles retardaient le LCP.
describe('accueil — photos des logements', () => {
  it('sont chargées en différé et dimensionnées pour une carte de 280 px sur mobile', () => {
    render(<MarketingHome lodgings={[lodging('a'), lodging('b')]} />)
    for (const name of ['Chalet a — Saint-Gervais-les-Bains', 'Chalet b — Saint-Gervais-les-Bains']) {
      const img = screen.getByRole('img', { name })
      expect(img).toHaveAttribute('loading', 'lazy')
      expect(img.getAttribute('sizes')).toMatch(/^\(max-width: 1023px\) 280px/)
    }
  })

  it('garde par défaut des tailles alignées sur la grille de /logements', () => {
    render(<MarketingPropertyCard lodging={lodging('c')} />)
    expect(screen.getByRole('img', { name: 'Chalet c — Saint-Gervais-les-Bains' }))
      .toHaveAttribute('sizes', '(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 360px')
  })
})
