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

describe('AdminCitiesPage — génération du QR ville en modal', () => {
  it('exposes a QR code modal trigger (a button), not a link to a separate page', async () => {
    const page = await AdminCitiesPage()
    render(page)

    // Déclencheur de modal = bouton
    expect(screen.getByRole('button', { name: /qr code/i })).toBeInTheDocument()

    // Plus de navigation vers une page dédiée
    expect(screen.queryByRole('link', { name: /qr code/i })).not.toBeInTheDocument()
    expect(
      document.querySelector('a[href="/cities/saint-gervais-les-bains/qr-code"]'),
    ).toBeNull()
  })
})
