/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import AdminPathLayout from '@/app/admin/layout'
import AdminLodgingsPage from '@/app/admin/lodgings/page'

jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
  usePathname: () => '/admin/lodgings',
  useSearchParams: () => new URLSearchParams(),
}))

jest.mock('@/features/merchant/lib/get-page-admin', () => ({
  getPageAdmin: jest.fn(async () => ({ id: 'admin-1', role: 'admin' })),
}))

jest.mock('@/features/lodging-showcase/queries/admin-public-profiles', () => ({
  listAdminLodgingProfiles: jest.fn(async () => [
    {
      id: 'profile-1',
      publication_status: 'review',
      title: 'Chalet Hygge',
      short_description: 'Un chalet lumineux pour sejourner a Annecy dans l univers MyStay.',
      lodging: {
        id: 'lodging-1',
        name: 'Chalet Hygge',
        owner: { id: 'owner-1', email: 'owner@example.test' },
      },
      city: { id: 'city-1', name: 'Annecy', slug: 'annecy' },
      photos_count: 4,
      seo_warnings: ['seo_photo_count'],
      updated_at: '2026-06-12T10:00:00.000Z',
    },
  ]),
}))

describe('028 lodging showcase admin pages', () => {
  it('adds a Logements entry in the admin navigation', () => {
    render(<AdminPathLayout><div>Contenu</div></AdminPathLayout>)

    expect(screen.getAllByRole('link', { name: /Logements/i })[0]).toHaveAttribute('href', '/admin/lodgings')
  })

  it('AC-06-01: renders the admin lodging moderation page', async () => {
    render(await AdminLodgingsPage({ searchParams: Promise.resolve({ publication_status: 'review' }) }))

    expect(screen.getByText('Moderation logements')).toBeInTheDocument()
    expect(screen.getAllByText('Chalet Hygge').length).toBeGreaterThan(0)
    expect(screen.getByText('owner@example.test')).toBeInTheDocument()
    expect(screen.getByText('review')).toBeInTheDocument()
  })
})
