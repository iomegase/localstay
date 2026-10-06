/**
 * @jest-environment jsdom
 */
import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { LodgingsTable } from '@/features/dashboard-owner/components/LodgingsTable'
import type { LodgingItem } from '@/features/dashboard-owner/queries/lodgings'

jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: jest.fn(), refresh: jest.fn() }),
}))

// Le dialog de création/édition tire des composants UI lourds : on l'isole.
jest.mock('@/features/dashboard-owner/components/LodgingDialog', () => ({
  LodgingDialog: () => null,
}))

function makeLodging(overrides: Partial<LodgingItem> = {}): LodgingItem {
  return {
    id: 'lodg-1',
    name: 'Chalet Mont Blanc',
    city_id: 'city-1',
    city_name: 'Saint-Gervais-les-Bains',
    is_active: true,
    qr_code_status: 'missing',
    qr_scan_count: 0,
    cover_photo_url: null,
    created_at: new Date('2026-05-01T10:00:00.000Z'),
    ...overrides,
  }
}

// Spec 077 US-01 — liste des logements en cartes.
describe('077 — LodgingsTable', () => {
  it('AC-01-01 : actions Guide, Logement et QR code (plus de « Personnaliser » ni « Vitrine »)', () => {
    render(<LodgingsTable lodgings={[makeLodging()]} cities={[]} />)
    const card = within(screen.getByRole('listitem', { name: 'Chalet Mont Blanc' }))

    expect(card.getByRole('link', { name: 'Guide' })).toHaveAttribute('href', '/dashboard/lodgings/lodg-1/customize')
    expect(card.getByRole('link', { name: 'Logement' })).toHaveAttribute('href', '/dashboard/lodgings/lodg-1/showcase')
    expect(card.getByRole('link', { name: 'QR code' })).toHaveAttribute('href', '/dashboard/lodgings/lodg-1/qr-code')
    expect(card.getByRole('button', { name: 'Modifier Chalet Mont Blanc' })).toBeEnabled()
    expect(card.getByRole('button', { name: 'Désactiver Chalet Mont Blanc' })).toBeEnabled()
    expect(screen.queryByText('Personnaliser')).not.toBeInTheDocument()
    expect(screen.queryByText('Vitrine')).not.toBeInTheDocument()
  })

  it('AC-01-01 : statuts, scans et vignette', () => {
    render(<LodgingsTable lodgings={[makeLodging({ qr_code_status: 'generated', qr_scan_count: 12, cover_photo_url: 'https://example.com/c.webp' })]} cities={[]} />)
    const card = within(screen.getByRole('listitem', { name: 'Chalet Mont Blanc' }))

    expect(card.getByText('Actif')).toBeInTheDocument()
    expect(card.getByText('QR généré')).toBeInTheDocument()
    expect(card.getByText('12 scans')).toBeInTheDocument()
    expect(screen.getByRole('listitem', { name: 'Chalet Mont Blanc' }).querySelector('img')).toHaveAttribute('src', 'https://example.com/c.webp')
  })

  it('AC-01-02 : logement désactivé signalé, « Désactiver » indisponible', () => {
    render(<LodgingsTable lodgings={[makeLodging({ is_active: false })]} cities={[]} />)
    const card = within(screen.getByRole('listitem', { name: 'Chalet Mont Blanc' }))

    expect(card.getByText('Désactivé')).toBeInTheDocument()
    expect(card.getByRole('button', { name: 'Désactiver Chalet Mont Blanc' })).toBeDisabled()
  })
})
