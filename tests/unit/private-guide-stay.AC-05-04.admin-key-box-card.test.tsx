/** @jest-environment jsdom */

import { act, fireEvent, render, screen } from '@testing-library/react'
import { AdminKeyBoxCodeCard } from '@/features/guide-customization/components/AdminKeyBoxCodeCard'

describe('054 AC-05-04 — admin key box card', () => {
  const originalFetch = globalThis.fetch
  afterEach(() => { globalThis.fetch = originalFetch })

  it('masks the code, reveals it and saves changes', async () => {
    const fetchMock = jest.fn(async () => ({ ok: true, json: async () => ({ data: { key_box_code: '2255' } }) }))
    globalThis.fetch = fetchMock as unknown as typeof fetch
    render(<AdminKeyBoxCodeCard lodgingId="l1" initialCode="4810" />)

    const input = screen.getByLabelText('Code de la boîte à clés')
    expect(input).toHaveAttribute('type', 'password')
    fireEvent.click(screen.getByRole('button', { name: 'Afficher le code' }))
    expect(input).toHaveAttribute('type', 'text')
    expect(input).toHaveValue('4810')

    fireEvent.change(input, { target: { value: '2255' } })
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Enregistrer le code' }))
    })
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/lodgings/l1/key-box-code', expect.objectContaining({
      method: 'PUT', body: JSON.stringify({ key_box_code: '2255' }),
    }))
    expect(screen.getByRole('status')).toHaveTextContent('Code enregistré.')
    expect(screen.getByText(/étape de type « Accès »/)).toBeInTheDocument()
  })
})
