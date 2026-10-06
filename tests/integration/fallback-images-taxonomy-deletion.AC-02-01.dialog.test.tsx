/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AdminTaxonomyClient } from '@/features/admin-taxonomy/components/AdminTaxonomyClient'
import type { AdminCategory } from '@/features/admin-taxonomy/types'

jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: jest.fn(), refresh: jest.fn(), push: jest.fn() }) }))

// Spec 074 AC-02-01 — la confirmation de suppression annonce le devenir des images.
const category: AdminCategory = {
  id: 'cat-cafes', name: 'Cafés', slug: 'cafes', icon: 'coffee', sort_order: 2, is_active: true,
  slug_locked: false, poi_count: 0, subcategory_count: 1, google_types: [], fallback_image_count: 5,
  subcategories: [{
    id: 'sub-the', category_id: 'cat-cafes', name: 'Salon de thé', slug: 'salon-de-the', sort_order: 1,
    is_active: true, slug_locked: false, poi_count: 0, google_types: [], fallback_image_count: 2,
  }],
}

describe('074 AC-02-01 — confirmation de suppression', () => {
  it('sous-catégorie : images remontées dans la catégorie', async () => {
    render(<AdminTaxonomyClient initialCategories={[category]} />)

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer Salon de thé' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('2 images de remplacement remonteront dans « Cafés ».')).toBeInTheDocument()
  })

  it('catégorie : images repassées dans « Non classées »', async () => {
    render(<AdminTaxonomyClient initialCategories={[category]} />)

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer Cafés' }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).getByText('5 images de remplacement repasseront dans « Non classées ».')).toBeInTheDocument()
  })
})
