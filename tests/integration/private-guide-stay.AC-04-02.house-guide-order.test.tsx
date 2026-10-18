/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import { GuideHouseGuide } from '@/features/guide-app/components/stay/GuideHouseGuide'
import { buildStayLodging } from '../support/guide-stay-lodging'

// Spec 054 amendement 2026-10-18 — Règlement et Point de tri avant Équipements.
describe('054 AC-04-02 — ordre du guide logement', () => {
  it('affiche Règlement, puis Point de tri, puis Équipements', () => {
    render(<GuideHouseGuide lodging={buildStayLodging({ thingsToKnow: [] })} onBack={jest.fn()} />)

    const headings = screen.getAllByRole('heading', { level: 2 }).map(heading => heading.textContent)
    expect(headings).toEqual(['Règlement', 'Point de tri', 'Équipements'])
  })
})
