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
  it('serves the QR PNG raw (unoptimized) with a cache-busting param so a regenerated QR is not served from cache', () => {
    render(<QrCodeCard lodgingId="lodg-1" qrCode={qr} scanCount7d={0} />)

    const img = screen.getByAltText('QR Code')
    const src = img.getAttribute('src')
    // Sert le PNG brut (pas via /_next/image qui rejette l'hôte Supabase)…
    expect(src).toContain(qr.storage_url)
    // …mais avec un paramètre anti-cache : sinon, après régénération, le navigateur
    // réaffiche l'ancien PNG en cache (ancienne URL localhost) → scan vers le mauvais site.
    expect(src).not.toBe(qr.storage_url)
  })
})
