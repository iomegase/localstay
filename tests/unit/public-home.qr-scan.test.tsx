/**
 * @jest-environment node
 *
 * QR séjour : après le scan, le proxy redirige vers /?lodging=:id.
 * La home « Bienvenue » doit alors enregistrer l'évènement qr_scan
 * (comme le faisait la page guide), via le param ?lodging=.
 */

jest.mock('@/features/analytics/lib/record-qr-scan', () => ({
  recordQrScanIfPresent: jest.fn(),
}))

jest.mock('@/features/public-menu/lib/lodging-mode', () => ({
  getActiveLodgingContext: jest.fn(),
}))

jest.mock('@/features/city-guide/queries/cities', () => ({
  listActiveCities: jest.fn().mockResolvedValue([]),
  getCityGuide: jest.fn(),
}))

import HomePage from '@/app/(public)/page'
import { recordQrScanIfPresent } from '@/features/analytics/lib/record-qr-scan'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'

const mockRecord = recordQrScanIfPresent as jest.Mock
const mockContext = getActiveLodgingContext as jest.Mock

describe('HomePage — enregistrement du scan QR séjour', () => {
  beforeEach(() => jest.clearAllMocks())

  it('records the qr_scan when ?lodging= is present in the URL', async () => {
    mockContext.mockResolvedValue(null)
    await HomePage({ searchParams: Promise.resolve({ lodging: 'lodge-9' }) })
    expect(mockRecord).toHaveBeenCalledWith('lodge-9')
  })

  it('records nothing (null) when ?lodging= is absent', async () => {
    mockContext.mockResolvedValue(null)
    await HomePage({ searchParams: Promise.resolve({}) })
    expect(mockRecord).toHaveBeenCalledWith(null)
  })
})
