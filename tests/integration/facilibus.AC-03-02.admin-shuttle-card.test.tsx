/** @jest-environment jsdom */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AdminCityTransportButton } from '@/features/transport/components/AdminCityTransportButton'

describe('055 AC-03-02 — native shuttle in transport admin', () => {
  beforeAll(() => {
    globalThis.ResizeObserver = class {
      observe() {}
      unobserve() {}
      disconnect() {}
    } as typeof ResizeObserver
  })

  it('offers the native shuttle for editing even before it has been saved', async () => {
    const fetchMock = jest.fn(async (_input: RequestInfo | URL, init?: RequestInit) => ({
      ok: true,
      json: async () => init?.method === 'PUT' ? { data: [] } : { data: [], poiOptions: [] },
    }))
    globalThis.fetch = fetchMock as unknown as typeof fetch

    render(<AdminCityTransportButton city={{ slug: 'saint-gervais-les-bains', name: 'Saint-Gervais-les-Bains' }} />)
    fireEvent.click(screen.getByRole('button', { name: 'Transports' }))
    await screen.findByRole('dialog')
    expect(await screen.findByDisplayValue('Navette gratuite')).toBeInTheDocument()
    expect(screen.getByRole('switch', { name: 'Gratuit' })).toHaveAttribute('data-state', 'checked')

    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      '/api/admin/cities/saint-gervais-les-bains/transport-cards',
      expect.objectContaining({ method: 'PUT' }),
    ))
    const request = fetchMock.mock.calls.find(([, init]) => init?.method === 'PUT')
    expect(JSON.parse(String(request?.[1]?.body)).cards[0]).toEqual(expect.objectContaining({
      title: 'Navette gratuite', service_key: 'facilibus', is_free: true,
    }))
  })
})
