/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import ContextualFavoritesPage from '@/app/(public)/guide/[city-slug]/mes-favoris/page'

const mockNotFound = jest.fn()

jest.mock('next/navigation', () => ({
  notFound: () => mockNotFound(),
}))

jest.mock('@/features/seo/queries/page-data', () => ({
  getCityForSeo: jest.fn(async () => ({ name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains', region: 'Auvergne-Rhone-Alpes' })),
}))

jest.mock('@/features/public-menu/components/FavoritesList', () => ({
  FavoritesList: () => <div>FavoritesList mock</div>,
}))

describe('001 contextual favorites page', () => {
  it('renders favorites content on /guide/[city-slug]/mes-favoris', async () => {
    render(await ContextualFavoritesPage({ params: Promise.resolve({ 'city-slug': 'saint-gervais-les-bains' }) }))

    expect(screen.getByText('Vos favoris')).toBeInTheDocument()
    expect(screen.getByText('FavoritesList mock')).toBeInTheDocument()
    expect(mockNotFound).not.toHaveBeenCalled()
  })
})
