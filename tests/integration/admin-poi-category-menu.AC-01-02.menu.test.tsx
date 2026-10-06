/**
 * @jest-environment jsdom
 */
import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import AdminPoisPage from '@/app/admin/pois/page'

jest.mock('next/navigation', () => ({
  usePathname: () => '/admin/pois',
  useRouter: () => ({ replace: jest.fn(), refresh: jest.fn(), push: jest.fn(), back: jest.fn() }),
}))

jest.mock('@/features/merchant/lib/get-page-admin', () => ({
  getPageAdmin: jest.fn(async () => ({ id: 'admin-1', role: 'admin' })),
}))

const mockCounts = jest.fn()
jest.mock('@/features/admin-pois/queries/admin-pois', () => ({
  listAdminPois: jest.fn(async () => ({
    data: [],
    pagination: { page: 1, limit: 25, total: 0, total_pages: 0 },
    kpis: { active_count: 0, inactive_count: 0, archived_count: 0, without_photos_count: 0, pending_geocode_count: 0 },
    acquisition_runs: [],
  })),
  getAdminPoiTaxonomyCounts: (...args: unknown[]) => mockCounts(...args),
  getAdminPoiOptions: jest.fn(async () => ({
    cities: [{ id: 'city-sg', name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais-les-bains' }],
    categories: [],
  })),
}))

// Spec 069 — pastilles catégories / sous-catégories.
const counts = {
  total: 22,
  categories: [
    { id: 'cat-diner', name: 'Dîner', count: 9, uncategorized_count: 0, subcategories: [{ id: 'sub-resto', name: 'Restaurants', count: 9 }] },
    {
      id: 'cat-shop', name: 'Shopping', count: 13, uncategorized_count: 2,
      subcategories: [
        { id: 'sub-bout', name: 'Boutiques locales', count: 8 },
        { id: 'sub-ski', name: 'Location de ski', count: 3 },
      ],
    },
  ],
}

function linkTexts(nav: HTMLElement) {
  return within(nav).getAllByRole('link').map(link => [link.textContent, link.getAttribute('href')])
}

describe('069 — menu de catégories', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCounts.mockResolvedValue(counts)
  })

  it('AC-01-01 / AC-01-03 : « Toutes » puis catégories avec nombres, liens qui gardent les filtres', async () => {
    render(await AdminPoisPage({ searchParams: Promise.resolve({ city_id: 'city-sg', status: 'active', page: '2' }) }))

    const nav = screen.getByRole('navigation', { name: 'Filtrer par catégorie' })
    expect(linkTexts(nav)).toEqual([
      ['Toutes22', '/admin/pois?city_id=city-sg&status=active'],
      ['Dîner9', '/admin/pois?city_id=city-sg&category_id=cat-diner&status=active'],
      ['Shopping13', '/admin/pois?city_id=city-sg&category_id=cat-shop&status=active'],
    ])
    expect(within(nav).getByRole('link', { name: /Toutes/ })).toHaveAttribute('aria-current', 'page')
  })

  it('AC-02-04 : pas de rangée sous-catégories sans catégorie choisie', async () => {
    render(await AdminPoisPage({ searchParams: Promise.resolve({ city_id: 'city-sg' }) }))

    expect(screen.queryByRole('navigation', { name: 'Filtrer par sous-catégorie' })).not.toBeInTheDocument()
  })

  it('AC-01-04 / AC-02-01 / AC-02-02 : catégorie active et sous-catégories avec « Sans sous-catégorie »', async () => {
    render(await AdminPoisPage({ searchParams: Promise.resolve({ city_id: 'city-sg', category_id: 'cat-shop', subcategory_id: 'sub-ski' }) }))

    const categories = screen.getByRole('navigation', { name: 'Filtrer par catégorie' })
    expect(within(categories).getByRole('link', { name: /Shopping/ })).toHaveAttribute('aria-current', 'page')

    const subcategories = screen.getByRole('navigation', { name: 'Filtrer par sous-catégorie' })
    expect(linkTexts(subcategories)).toEqual([
      ['Toutes13', '/admin/pois?city_id=city-sg&category_id=cat-shop'],
      ['Boutiques locales8', '/admin/pois?city_id=city-sg&category_id=cat-shop&subcategory_id=sub-bout'],
      ['Location de ski3', '/admin/pois?city_id=city-sg&category_id=cat-shop&subcategory_id=sub-ski'],
      ['Sans sous-catégorie2', '/admin/pois?city_id=city-sg&category_id=cat-shop&subcategory_id=none'],
    ])
    expect(within(subcategories).getByRole('link', { name: /Location de ski/ })).toHaveAttribute('aria-current', 'page')
  })

  it('AC-01-01 : le menu déroulant « Catégorie » est retiré, la sélection reste dans le formulaire', async () => {
    const { container } = render(await AdminPoisPage({ searchParams: Promise.resolve({ city_id: 'city-sg', category_id: 'cat-shop', subcategory_id: 'none' }) }))

    expect(container.querySelector('select#category_id')).toBeNull()
    expect(container.querySelector('input[type="hidden"][name="category_id"]')).toHaveAttribute('value', 'cat-shop')
    expect(container.querySelector('input[type="hidden"][name="subcategory_id"]')).toHaveAttribute('value', 'none')
  })
})
