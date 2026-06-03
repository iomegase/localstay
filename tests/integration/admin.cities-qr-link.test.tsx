/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import AdminCitiesPage from '@/app/admin/cities/page'

jest.mock('@/features/merchant/lib/get-page-admin', () => ({
  getPageAdmin: jest.fn(async () => ({ id: 'admin-1', role: 'admin' })),
}))

jest.mock('@/features/admin/queries/dashboard', () => ({
  getAdminCities: jest.fn(async () => [
    {
      id: 'city-1',
      name: 'Saint-Gervais-les-Bains',
      slug: 'saint-gervais-les-bains',
      postal_code: '74170',
      is_active: true,
      active_poi_count: 12,
      active_lodging_count: 3,
      qr_scans_30d: 40,
      status_label: 'active',
    },
  ]),
}))

// AdminCityCreateButton utilise useRouter (app router non monté en test) : on l'isole.
jest.mock('@/features/admin/components/AdminCityCreateButton', () => ({
  AdminCityCreateButton: () => null,
}))

describe('AdminCitiesPage — accès au QR code par ville', () => {
  it('renders a QR code link to the city QR generation page for each city', async () => {
    const page = await AdminCitiesPage()
    render(page)

    const qrLink = screen.getByRole('link', { name: /qr code/i })
    expect(qrLink).toHaveAttribute('href', '/cities/saint-gervais-les-bains/qr-code')
  })
})
