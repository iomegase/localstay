/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import AdminPathLayout from '@/app/admin/layout'
import AdminTaxonomyPage from '@/app/admin/taxonomy/page'

jest.mock('@/features/merchant/lib/get-page-admin', () => ({
  getPageAdmin: jest.fn(async () => ({ id: 'admin-1', role: 'admin' })),
}))

jest.mock('@/features/admin-taxonomy/queries/taxonomy', () => ({
  getAdminTaxonomy: jest.fn(async () => [
    {
      id: 'cat-1',
      name: 'Dîner',
      slug: 'diner',
      icon: 'utensils',
      sort_order: 1,
      is_active: true,
      slug_locked: true,
      poi_count: 12,
      subcategory_count: 2,
      subcategories: [
        {
          id: 'sub-1',
          category_id: 'cat-1',
          name: 'Restaurants',
          slug: 'restaurants',
          sort_order: 1,
          is_active: true,
          slug_locked: true,
          poi_count: 10,
        },
      ],
    },
    {
      id: 'cat-2',
      name: 'Mobilité',
      slug: 'mobilite',
      icon: 'car',
      sort_order: 10,
      is_active: false,
      slug_locked: false,
      poi_count: 0,
      subcategory_count: 0,
      subcategories: [],
    },
  ]),
}))

describe('017 admin taxonomy page', () => {
  it('AC-01-01/01-02/01-03: renders categories, statuses and sorted subcategories', async () => {
    render(await AdminTaxonomyPage())

    expect(screen.getByText('Taxonomie globale')).toBeInTheDocument()
    expect(screen.getByText('Dîner')).toBeInTheDocument()
    expect(screen.getByText('diner')).toBeInTheDocument()
    expect(screen.getByText('12')).toBeInTheDocument()
    expect(screen.getAllByText('slug locked')).toHaveLength(2)
    expect(screen.getByText('Restaurants')).toBeInTheDocument()
    expect(screen.getByText('Mobilité')).toBeInTheDocument()
    expect(screen.getByText('inactive')).toBeInTheDocument()
  })

  it('UI behaviour: exposes taxonomy navigation and creation CTAs without delete buttons', () => {
    render(<AdminPathLayout><div>Contenu</div></AdminPathLayout>)

    expect(screen.getAllByRole('link', { name: /Taxonomie/i })[0]).toHaveAttribute('href', '/admin/taxonomy')
    expect(screen.queryByRole('button', { name: /supprimer/i })).not.toBeInTheDocument()
  })
})
