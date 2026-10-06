/**
 * @jest-environment jsdom
 */
import { render } from '@testing-library/react'
import { GoogleAnalyticsClient } from '@/features/admin-analytics/components/GoogleAnalyticsClient'

let mockPathname = '/decouvrir/saint-gervais-les-bains'
jest.mock('next/navigation', () => ({ usePathname: () => mockPathname }))
jest.mock('next/script', () => ({ __esModule: true, default: () => null }))

// Spec 075 AC-02-01 — tag GA4 désactivé sur les chemins privés.
describe('075 — GA4 sur chemins privés', () => {
  const key = 'ga-disable-G-TEST1234' as const

  beforeEach(() => {
    process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID = 'G-TEST1234'
    delete window[key]
  })

  it('actif sur une page publique, coupé sur une page privée', () => {
    const { rerender } = render(<GoogleAnalyticsClient />)
    expect(window[key]).toBe(false)

    mockPathname = '/connexion'
    rerender(<GoogleAnalyticsClient />)
    expect(window[key]).toBe(true)
  })

  it('coupé quand on quitte le site public (démontage)', () => {
    mockPathname = '/decouvrir'
    const { unmount } = render(<GoogleAnalyticsClient />)
    expect(window[key]).toBe(false)

    unmount()
    expect(window[key]).toBe(true)
  })
})
