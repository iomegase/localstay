/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import AdminCitiesPage from '@/app/admin/cities/page'

const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }))

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
  const originalFetch = global.fetch
  afterEach(() => {
    global.fetch = originalFetch
    jest.clearAllMocks()
  })

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

  it('opens the prefilled city editor and saves while preserving the guide link and QR action', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: true })
    render(await AdminCitiesPage())
    expect(screen.getByRole('link', { name: /Voir le guide/i })).toHaveAttribute('href', '/guide/saint-gervais-les-bains')
    fireEvent.click(screen.getByRole('button', { name: 'Modifier' }))
    expect(screen.getByRole('textbox', { name: 'Nom' })).toHaveValue('Saint-Gervais-les-Bains')
    expect(screen.getByRole('textbox', { name: 'Code postal' })).toHaveValue('74170')
    fireEvent.change(screen.getByRole('textbox', { name: 'Nom' }), { target: { value: 'Saint-Gervais' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(1))
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/cities/saint-gervais-les-bains', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'Saint-Gervais', postal_code: '74170' }),
    })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('keeps the editor open with a useful error on save failure', async () => {
    global.fetch = jest.fn().mockResolvedValue({ ok: false, json: async () => ({ error: { message: 'Géocodage indisponible.' } }) })
    render(await AdminCitiesPage())
    fireEvent.click(screen.getByRole('button', { name: 'Modifier' }))
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Géocodage indisponible.')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(mockRefresh).not.toHaveBeenCalled()
  })
})
