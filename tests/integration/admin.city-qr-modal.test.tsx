/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { CityQrCodeModalButton } from '@/features/admin/components/CityQrCodeModalButton'

const fetchMock = jest.fn()
beforeEach(() => {
  fetchMock.mockReset()
  global.fetch = fetchMock as unknown as typeof fetch
})

const QR = {
  url: 'http://localhost:3000/guide/saint-gervais-les-bains',
  storage_url:
    'https://cftqqyqfhlvobtsatxdq.supabase.co/storage/v1/object/public/qr-codes/cities/saint-gervais-les-bains.png',
  created_at: '2026-06-03T10:00:00.000Z',
}

function ok(body: unknown, status = 200) {
  return { ok: true, status, json: async () => body }
}
function notFound() {
  return { ok: false, status: 404, json: async () => ({ error: { code: 'NOT_FOUND' } }) }
}

describe('CityQrCodeModalButton', () => {
  it('opens a modal (not a navigation) and shows a generate action when no QR exists yet', async () => {
    fetchMock.mockResolvedValueOnce(notFound()) // GET à l'ouverture
    render(<CityQrCodeModalButton citySlug="saint-gervais-les-bains" cityName="Saint-Gervais" />)

    // Le déclencheur est un bouton, pas un lien vers une autre page
    const trigger = screen.getByRole('button', { name: /qr code/i })
    expect(screen.queryByRole('link', { name: /qr code/i })).not.toBeInTheDocument()

    fireEvent.click(trigger)

    expect(await screen.findByRole('dialog')).toBeInTheDocument()
    expect(
      await screen.findByRole('button', { name: /générer le qr code/i }),
    ).toBeInTheDocument()
    expect(fetchMock).toHaveBeenCalledWith('/api/admin/cities/saint-gervais-les-bains/qr-code')
  })

  it('generates the QR via POST and displays the resulting image (served raw, not via the optimizer)', async () => {
    fetchMock.mockResolvedValueOnce(notFound()) // GET à l'ouverture
    render(<CityQrCodeModalButton citySlug="saint-gervais-les-bains" cityName="Saint-Gervais" />)
    fireEvent.click(screen.getByRole('button', { name: /qr code/i }))

    const generate = await screen.findByRole('button', { name: /générer le qr code/i })
    fetchMock.mockResolvedValueOnce(ok({ data: QR })) // POST
    fireEvent.click(generate)

    await waitFor(() =>
      expect(fetchMock).toHaveBeenCalledWith('/api/admin/cities/saint-gervais-les-bains/qr-code', {
        method: 'POST',
      }),
    )

    const img = await screen.findByAltText('QR Code')
    expect(img).toHaveAttribute('src', QR.storage_url)
  })
})
