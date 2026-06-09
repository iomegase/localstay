/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AdminEventsLauncher } from '@/features/events-acquisition/components/AdminEventsLauncher'

describe('AdminEventsLauncher', () => {
  afterEach(() => jest.restoreAllMocks())

  it('poste la commune et affiche le résumé', async () => {
    const fetchMock = jest.fn(async () => ({
      ok: true,
      json: async () => ({ data: { fetched: 5, matched: 3, upserted: 3, skipped: 2, deleted: 1 } }),
    }))
    global.fetch = fetchMock as unknown as typeof fetch

    render(<AdminEventsLauncher />)
    fireEvent.change(screen.getByPlaceholderText(/commune/i), { target: { value: 'chamonix' } })
    fireEvent.click(screen.getByRole('button', { name: /fetcher/i }))

    await waitFor(() => expect(screen.getByText(/3 événement/i)).toBeInTheDocument())
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/events/fetch', expect.objectContaining({ method: 'POST' }))
  })

  it("affiche l'erreur renvoyée par l'API", async () => {
    global.fetch = jest.fn(async () => ({
      ok: false,
      json: async () => ({ error: { message: 'Boom' } }),
    })) as unknown as typeof fetch

    render(<AdminEventsLauncher />)
    fireEvent.change(screen.getByPlaceholderText(/commune/i), { target: { value: 'x' } })
    fireEvent.click(screen.getByRole('button', { name: /fetcher/i }))

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Boom'))
  })
})
