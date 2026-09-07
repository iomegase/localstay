/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'

jest.mock('@/features/lodging-showcase/queries/public-lodgings', () => ({
  listPublishedLodgings: jest.fn(async () => []),
}))

import LodgingsPage from '@/app/(public)/logements/page'
import SeminarsPage from '@/app/(public)/seminaires/page'
import OwnerContactPage from '@/app/(public)/confier-mon-logement/page'

describe('046 local SEO hub links', () => {
  it('links the lodging hub to all prepared rental destinations', async () => {
    render(await LodgingsPage())

    expect(screen.getByRole('link', { name: 'Locations à Saint-Gervais-les-Bains' })).toHaveAttribute(
      'href',
      '/locations-vacances/saint-gervais-les-bains',
    )
    expect(screen.getByRole('link', { name: 'Locations à Saint-Nicolas-de-Véroce' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Locations à Megève' })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'Locations à Combloux' })).toBeInTheDocument()
  })

  it('links the seminar hub only to active seminar destinations', () => {
    const { unmount } = render(<SeminarsPage />)

    expect(screen.getByRole('link', { name: 'Séminaire à Saint-Gervais-les-Bains' })).toHaveAttribute(
      'href',
      '/seminaires/saint-gervais-les-bains',
    )
    expect(screen.getByRole('link', { name: 'Séminaire à Saint-Nicolas-de-Véroce' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Séminaire à Megève' })).not.toBeInTheDocument()
    unmount()
  })

  it('links the owner hub only to active concierge destinations', () => {
    render(<OwnerContactPage />)

    expect(screen.getByRole('link', { name: 'Conciergerie à Saint-Gervais-les-Bains' })).toHaveAttribute(
      'href',
      '/conciergerie/saint-gervais-les-bains',
    )
    expect(screen.getByRole('link', { name: 'Conciergerie à Saint-Nicolas-de-Véroce' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Conciergerie à Combloux' })).not.toBeInTheDocument()
  })
})
