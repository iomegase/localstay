/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AdminPoiStatusActions } from '@/features/admin-pois/components/AdminPoiStatusActions'

const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh, back: jest.fn(), replace: jest.fn(), push: jest.fn() }),
}))

// Spec 068 amendement PO — actions sobres (AC-07).
function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

describe('068 AC-07 — actions de POI', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    window.confirm = jest.fn(() => true)
    global.fetch = jest.fn(async () => jsonResponse({ data: {} })) as jest.Mock
  })

  it('AC-07-01 : icônes seules, sans texte visible, mais nommées pour l’accessibilité', () => {
    const { container } = render(<AdminPoiStatusActions poiId="poi-1" status="active" merchantAttached={false} />)

    expect(screen.getByRole('button', { name: 'Enrichir photos' })).toHaveAttribute('title', 'Enrichir photos')
    expect(screen.getByRole('button', { name: 'Effacer' })).toHaveAttribute('title', 'Effacer')
    expect(container.textContent?.trim()).toBe('')
  })

  it('AC-07-02 : interrupteur « POI actif » coché pour un POI actif', () => {
    render(<AdminPoiStatusActions poiId="poi-1" status="active" merchantAttached={false} />)

    expect(screen.getByRole('switch', { name: 'POI actif' })).toBeChecked()
  })

  it('AC-07-02 : décocher désactive après confirmation (route disable)', async () => {
    render(<AdminPoiStatusActions poiId="poi-1" status="active" merchantAttached />)

    fireEvent.click(screen.getByRole('switch', { name: 'POI actif' }))

    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Désactiver ce POI ?'))
    expect(window.confirm).toHaveBeenCalledWith(expect.stringContaining('Un Merchant est lié à cette fiche.'))
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled())
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/pois/poi-1/disable', { method: 'POST' })
  })

  it('AC-07-02 : annuler la confirmation ne change rien', () => {
    window.confirm = jest.fn(() => false)
    render(<AdminPoiStatusActions poiId="poi-1" status="active" merchantAttached={false} />)

    fireEvent.click(screen.getByRole('switch', { name: 'POI actif' }))

    expect(global.fetch).not.toHaveBeenCalled()
    expect(screen.getByRole('switch', { name: 'POI actif' })).toBeChecked()
  })

  it('AC-07-02 : cocher réactive un POI inactif', async () => {
    render(<AdminPoiStatusActions poiId="poi-1" status="inactive" merchantAttached={false} />)

    const toggle = screen.getByRole('switch', { name: 'POI actif' })
    expect(toggle).not.toBeChecked()
    fireEvent.click(toggle)

    await waitFor(() => expect(mockRefresh).toHaveBeenCalled())
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/pois/poi-1', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ is_active: true }),
    }))
  })

  it('AC-07-02 : en cas d’échec, l’interrupteur revient et l’erreur s’affiche', async () => {
    global.fetch = jest.fn(async () => jsonResponse({ error: { message: 'Action impossible' } }, 409)) as jest.Mock
    render(<AdminPoiStatusActions poiId="poi-1" status="active" merchantAttached={false} />)

    fireEvent.click(screen.getByRole('switch', { name: 'POI actif' }))

    expect(await screen.findByRole('alert')).toHaveTextContent('Action impossible')
    expect(screen.getByRole('switch', { name: 'POI actif' })).toBeChecked()
  })

  it('POI effacé : pas d’interrupteur, icône « Restaurer »', () => {
    render(<AdminPoiStatusActions poiId="poi-1" status="archived" merchantAttached={false} />)

    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Restaurer' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Effacer' })).not.toBeInTheDocument()
  })
})
