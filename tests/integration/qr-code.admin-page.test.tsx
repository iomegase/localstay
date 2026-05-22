/**
 * @jest-environment jsdom
 */
jest.mock('@/features/qr-code/queries/qr-code', () => ({
  getQrCode: jest.fn(),
}))

import { render, screen } from '@testing-library/react'
import { getQrCode } from '@/features/qr-code/queries/qr-code'
import QrCodeAdminPage from '@/app/(admin)/cities/[slug]/qr-code/page'

const mockResult = {
  id: 'qr-1',
  city_slug: 'saint-gervais-les-bains',
  url: 'https://example.com/guide/saint-gervais-les-bains',
  storage_url: 'https://storage.supabase.co/qr-codes/saint-gervais-les-bains.png',
  created_at: '2026-05-22T10:00:00.000Z',
}

describe('QrCodeAdminPage', () => {
  it('renders QR code preview image when QR exists', async () => {
    ;(getQrCode as jest.Mock).mockResolvedValue(mockResult)
    const page = await QrCodeAdminPage({ params: { slug: 'saint-gervais-les-bains' } })
    render(page)
    const img = screen.getByTestId('qr-preview')
    expect(img).toBeInTheDocument()
    expect(img).toHaveAttribute('src', mockResult.storage_url)
  })

  it('renders the encoded URL', async () => {
    ;(getQrCode as jest.Mock).mockResolvedValue(mockResult)
    const page = await QrCodeAdminPage({ params: { slug: 'saint-gervais-les-bains' } })
    render(page)
    expect(screen.getByTestId('qr-encoded-url')).toHaveTextContent(
      'https://example.com/guide/saint-gervais-les-bains',
    )
  })

  it('renders generate prompt when no QR code exists yet', async () => {
    ;(getQrCode as jest.Mock).mockResolvedValue(null)
    const page = await QrCodeAdminPage({ params: { slug: 'saint-gervais-les-bains' } })
    render(page)
    expect(screen.getByTestId('qr-empty-state')).toBeInTheDocument()
  })
})
