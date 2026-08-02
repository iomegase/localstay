/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'

const mockGetActiveLodgingContext = jest.fn()
const mockGetPrivateGuideData = jest.fn()
const mockRedirect = jest.fn((destination: string) => {
  throw new Error(`REDIRECT:${destination}`)
})

jest.mock('next/navigation', () => ({
  redirect: (destination: string) => mockRedirect(destination),
}))

jest.mock('@/features/public-menu/lib/lodging-mode', () => ({
  getActiveLodgingContext: () => mockGetActiveLodgingContext(),
}))

jest.mock('@/features/guide-app/queries/private-guide-data', () => ({
  getPrivateGuideData: (lodgingId: string) =>
    mockGetPrivateGuideData(lodgingId),
}))

jest.mock('@/features/analytics/lib/record-qr-scan', () => ({
  recordQrScanIfPresent: jest.fn(),
}))

jest.mock('@/features/guide-app/components/GuideApp', () => ({
  GuideApp: ({ mode, lodging, initialView, routes }: {
    mode: string
    lodging: {
      name: string
      wifiName: string
      wifiPassword: string
      practicalCards: unknown[]
      usefulNumbers: unknown[]
    }
    initialView?: string
    routes: Record<string, string>
  }) => (
    <div
      data-testid="shared-guide-app"
      data-mode={mode}
      data-lodging={lodging.name}
      data-initial-view={initialView}
      data-practical-route={routes.practical}
      data-parent-route={routes.lodging}
      data-wifi-name={lodging.wifiName}
      data-wifi-password={lodging.wifiPassword}
      data-practical-count={lodging.practicalCards.length}
      data-useful-number-count={lodging.usefulNumbers.length}
    />
  ),
}))

import PrivatePracticalInfoPage from '@/app/(public)/sejour/logement/informations-pratiques/page'

const privateData = {
  lodging: {
    id: 'lodging-1',
    name: 'Le Chalet Hygge',
    city: 'Saint-Gervais-les-Bains',
    wifiName: 'Chalet-Hygge',
    wifiPassword: 'secret-prive',
    practicalCards: [
      { id: 'parking', title: 'Parking' },
      { id: 'waste', title: 'Déchets' },
    ],
    usefulNumbers: [
      { label: 'Urgences', number: '112' },
      { label: 'SAMU', number: '15' },
    ],
  },
  pois: [],
}

describe('038-private-guide-practical-info page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetActiveLodgingContext.mockResolvedValue({
      lodgingId: 'lodging-1',
      citySlug: 'saint-gervais-les-bains',
    })
    mockGetPrivateGuideData.mockResolvedValue(privateData)
  })

  it('renders the shared practical view with private lodging data', async () => {
    render(await PrivatePracticalInfoPage())

    const guide = screen.getByTestId('shared-guide-app')
    expect(guide).toHaveAttribute('data-mode', 'private')
    expect(guide).toHaveAttribute('data-lodging', 'Le Chalet Hygge')
    expect(guide).toHaveAttribute('data-initial-view', 'practical')
    expect(guide).toHaveAttribute(
      'data-practical-route',
      '/sejour/logement/informations-pratiques',
    )
    expect(guide).toHaveAttribute('data-parent-route', '/sejour/logement')
    expect(guide).toHaveAttribute('data-wifi-name', 'Chalet-Hygge')
    expect(guide).toHaveAttribute('data-wifi-password', 'secret-prive')
    expect(guide).toHaveAttribute('data-practical-count', '2')
    expect(guide).toHaveAttribute('data-useful-number-count', '2')
  })

  it('does not load practical data without an active stay', async () => {
    mockGetActiveLodgingContext.mockResolvedValue(null)

    await expect(PrivatePracticalInfoPage()).rejects.toThrow(
      'REDIRECT:/acces-reserve',
    )
    expect(mockGetPrivateGuideData).not.toHaveBeenCalled()
  })
})
