/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AdminTaxonomyClient } from '@/features/admin-taxonomy/components/AdminTaxonomyClient'
import type { AdminCategory } from '@/features/admin-taxonomy/types'

jest.mock('next/navigation', () => ({ useRouter: () => ({ replace: jest.fn(), refresh: jest.fn(), push: jest.fn() }) }))

// Spec 073 AC-01-01 — champ « Types Google » dans Admin › Taxonomie.
const category: AdminCategory = {
  id: 'cat-cafes', name: 'Cafés', slug: 'cafes', icon: 'coffee', sort_order: 2, is_active: true,
  slug_locked: true, poi_count: 0, subcategory_count: 1, google_types: ['cafe', 'coffee_shop'],
  subcategories: [{
    id: 'sub-the', category_id: 'cat-cafes', name: 'Salon de thé', slug: 'salon-de-the', sort_order: 1,
    is_active: true, slug_locked: false, poi_count: 0, google_types: ['tea_house'],
  }],
}

beforeEach(() => {
  global.fetch = jest.fn(async () => ({ ok: true, status: 200, json: async () => ({ data: [category] }) })) as jest.Mock
})

function patchBody(): Record<string, unknown> {
  const call = (global.fetch as jest.Mock).mock.calls.find(([, init]) => init?.method === 'PATCH')!
  return JSON.parse(call[1].body)
}

describe('073 AC-01-01 — Types Google', () => {
  it('catégorie : pré-rempli puis envoyé en liste', async () => {
    render(<AdminTaxonomyClient initialCategories={[category]} />)

    fireEvent.click(screen.getAllByRole('button', { name: /Modifier/ })[0]!)
    const dialog = await screen.findByRole('dialog')
    const field = within(dialog).getByLabelText('Types Google')
    expect(field).toHaveValue('cafe, coffee_shop')

    fireEvent.change(field, { target: { value: 'cafe, coffee_shop, *_cafe' } })
    fireEvent.submit(field.closest('form')!)

    await waitFor(() => expect(patchBody()).toMatchObject({ google_types: ['cafe', 'coffee_shop', '*_cafe'] }))
  })

  it('création : pas de champ (types saisis après création)', async () => {
    render(<AdminTaxonomyClient initialCategories={[category]} />)

    fireEvent.click(screen.getByRole('button', { name: /Nouvelle catégorie/ }))
    const dialog = await screen.findByRole('dialog')
    expect(within(dialog).queryByLabelText('Types Google')).toBeNull()
  })
})
