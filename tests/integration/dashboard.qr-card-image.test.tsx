/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { QrCodeCard } from '@/features/dashboard-owner/components/QrCodeCard'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ refresh: jest.fn(), push: jest.fn() }),
}))

const qr = {
  id: 'qr-1',
  url: 'http://localhost:3000/guide/saint-nicolas-de-veroce?lodging=lodg-1',
  storage_url:
    'https://cftqqyqfhlvobtsatxdq.supabase.co/storage/v1/object/public/qr-codes/lodgings/lodg-1.png',
  created_at: '2026-06-03T10:00:00.000Z',
}

describe('QrCodeCard — affichage de l’image QR', () => {
  it('serves the QR PNG directly (unoptimized) instead of via the next/image optimizer', () => {
    render(<QrCodeCard lodgingId="lodg-1" qrCode={qr} scanCount7d={0} />)

    const img = screen.getByAltText('QR Code')
    // unoptimized → src = URL Supabase brute. Sans unoptimized, next/image route vers
    // /_next/image?url=… qui rejette l'hôte (400) → image cassée pour l'utilisateur.
    expect(img.getAttribute('src')).toBe(qr.storage_url)
  })
})
