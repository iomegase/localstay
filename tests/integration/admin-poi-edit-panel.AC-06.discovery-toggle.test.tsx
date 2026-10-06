/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AdminPoiDiscoveryToggle } from '@/features/admin-pois/components/AdminPoiDiscoveryToggle'

const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: mockRefresh, back: jest.fn(), replace: jest.fn(), push: jest.fn() }),
}))

// Spec 068 US-06 — publier depuis la liste.
function jsonResponse(body: unknown, status = 200) {
  return { ok: status >= 200 && status < 300, status, json: async () => body }
}

describe('068 US-06 — interrupteur « Publié sur Découvrir »', () => {
  beforeEach(() => jest.clearAllMocks())

  it('AC-06-01 : reflète le statut de publication', () => {
    render(<AdminPoiDiscoveryToggle poiId="poi-1" name="Blanc Sport" status="PUBLISHED" />)

    expect(screen.getByRole('switch', { name: 'Blanc Sport — Publié sur Découvrir' })).toBeChecked()
  })

  it('AC-06-02 : bascule via la route de publication et rafraîchit la liste', async () => {
    global.fetch = jest.fn(async () => jsonResponse({ data: { id: 'poi-1', discovery_status: 'PUBLISHED' } })) as jest.Mock
    render(<AdminPoiDiscoveryToggle poiId="poi-1" name="Blanc Sport" status="DRAFT" />)

    fireEvent.click(screen.getByRole('switch'))

    await waitFor(() => expect(mockRefresh).toHaveBeenCalled())
    expect(global.fetch).toHaveBeenCalledWith('/api/admin/pois/poi-1/discovery-publication', expect.objectContaining({
      method: 'PATCH',
      body: JSON.stringify({ status: 'PUBLISHED' }),
    }))
    expect(screen.getByRole('switch')).toBeChecked()
  })

  it('AC-06-03 : refus 409 → retour à l’état initial et motif affiché', async () => {
    global.fetch = jest.fn(async () => jsonResponse({
      error: {
        code: 'DISCOVERY_PUBLICATION_INCOMPLETE',
        message: 'Publication Découvrir impossible : fiche incomplète',
        details: { missing: ['description', 'photo'] },
      },
    }, 409)) as jest.Mock
    render(<AdminPoiDiscoveryToggle poiId="poi-1" name="Blanc Sport" status="DRAFT" />)

    fireEvent.click(screen.getByRole('switch'))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Fiche incomplète : Description, Photo exploitable, ou description d’au moins 150 caractères',
    )
    expect(screen.getByRole('switch')).not.toBeChecked()
    expect(mockRefresh).not.toHaveBeenCalled()
  })
})
