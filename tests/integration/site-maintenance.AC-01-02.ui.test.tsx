/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AdminMaintenanceCard } from '@/features/maintenance/components/AdminMaintenanceCard'
import MaintenancePage from '@/app/maintenance/page'
import { getMaintenanceState } from '@/features/maintenance/queries/maintenance'
import { DEFAULT_MAINTENANCE_MESSAGE } from '@/features/maintenance/lib/maintenance'

jest.mock('@/shared/components/brand/MyStayLogo', () => ({ MyStayLogo: () => <img alt="MyStay" /> }))

// Spec 087 — carte admin et page de maintenance.
describe('087 AC-01-01 — carte du cockpit admin', () => {
  it('active la maintenance avec un message et l’enregistre', async () => {
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ data: { enabled: true, message: 'Retour à 18 h.' } }) })) as unknown as typeof fetch
    render(<AdminMaintenanceCard initial={{ enabled: false, message: DEFAULT_MAINTENANCE_MESSAGE }} />)

    expect(screen.getByTestId('maintenance-status')).toHaveTextContent('Site ouvert')
    expect(screen.getByRole('button', { name: 'Enregistrer' })).toBeDisabled()

    fireEvent.click(screen.getByRole('switch', { name: 'Mettre le site public en maintenance' }))
    fireEvent.change(screen.getByLabelText('Message affiché aux visiteurs'), { target: { value: 'Retour à 18 h.' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    await waitFor(() => expect(screen.getByTestId('maintenance-status')).toHaveTextContent('Maintenance active'))
    expect(JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)).toEqual({ enabled: true, message: 'Retour à 18 h.' })
    expect(screen.getByRole('status')).toHaveTextContent('Site public en maintenance')
    expect(screen.getByRole('link', { name: /Voir la page de maintenance/ })).toHaveAttribute('href', '/maintenance')
  })
})

describe('087 AC-02-03 — page de maintenance', () => {
  it('logo MyStay puis message, centrés', async () => {
    jest.mocked(getMaintenanceState).mockResolvedValue({ enabled: true, message: 'Retour à 18 h.' })
    const { container } = render(await MaintenancePage())

    const main = container.querySelector('main')!
    expect(main).toHaveClass('items-center', 'justify-center', 'text-center', 'min-h-screen')
    expect(screen.getByAltText('MyStay').compareDocumentPosition(screen.getByTestId('maintenance-message')) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByTestId('maintenance-message')).toHaveTextContent('Retour à 18 h.')
  })
})
