/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { LodgingsTable } from '@/features/dashboard-owner/components/LodgingsTable'
import type { LodgingItem } from '@/features/dashboard-owner/queries/lodgings'

const push = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push, refresh: jest.fn() }),
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
    created_at: new Date('2026-05-01T10:00:00.000Z'),
    ...overrides,
  }
}

describe('LodgingsTable — accès au QR code', () => {
  beforeEach(() => push.mockClear())

  it('exposes a QR code action that navigates to the lodging QR page (missing QR)', () => {
    render(<LodgingsTable lodgings={[makeLodging()]} cities={[]} />)

    const qrAction = screen.getByRole('button', { name: /qr code/i })
    fireEvent.click(qrAction)

    expect(push).toHaveBeenCalledWith('/dashboard/lodgings/lodg-1/qr-code')
  })

  it('exposes the QR code action even when a QR already exists (to view/regenerate)', () => {
    render(<LodgingsTable lodgings={[makeLodging({ qr_code_status: 'generated' })]} cities={[]} />)

    fireEvent.click(screen.getByRole('button', { name: /qr code/i }))

    expect(push).toHaveBeenCalledWith('/dashboard/lodgings/lodg-1/qr-code')
  })
})
