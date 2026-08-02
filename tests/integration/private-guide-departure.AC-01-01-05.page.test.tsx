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
      checkOut: string
      departureInstructions: string[]
    }
    initialView?: string
    routes: Record<string, string>
  }) => (
    <div
      data-testid="shared-guide-app"
      data-mode={mode}
      data-lodging={lodging.name}
      data-initial-view={initialView}
      data-departure-route={routes.departure}
      data-parent-route={routes.lodging}
      data-check-out={lodging.checkOut}
      data-instruction-count={lodging.departureInstructions.length}
    />
  ),
}))

import PrivateDeparturePage from '@/app/(public)/sejour/logement/depart/page'

const privateData = {
  lodging: {
    id: 'lodging-1',
    name: 'Le Chalet Hygge',
    city: 'Saint-Gervais-les-Bains',
    checkOut: '10:00',
    departureInstructions: [
      'Vider le réfrigérateur',
      'Fermer les fenêtres',
      'Déposer les clés',
    ],
  },
  pois: [],
}

describe('039-private-guide-departure page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetActiveLodgingContext.mockResolvedValue({
      lodgingId: 'lodging-1',
      citySlug: 'saint-gervais-les-bains',
    })
    mockGetPrivateGuideData.mockResolvedValue(privateData)
  })

  it('renders the shared departure view with private instructions', async () => {
    render(await PrivateDeparturePage())

    const guide = screen.getByTestId('shared-guide-app')
    expect(guide).toHaveAttribute('data-mode', 'private')
    expect(guide).toHaveAttribute('data-lodging', 'Le Chalet Hygge')
    expect(guide).toHaveAttribute('data-initial-view', 'departure')
    expect(guide).toHaveAttribute(
      'data-departure-route',
      '/sejour/logement/depart',
    )
    expect(guide).toHaveAttribute('data-parent-route', '/sejour/logement')
    expect(guide).toHaveAttribute('data-check-out', '10:00')
    expect(guide).toHaveAttribute('data-instruction-count', '3')
  })

  it('does not load departure data without an active stay', async () => {
    mockGetActiveLodgingContext.mockResolvedValue(null)

    await expect(PrivateDeparturePage()).rejects.toThrow(
      'REDIRECT:/acces-reserve',
    )
    expect(mockGetPrivateGuideData).not.toHaveBeenCalled()
  })
})
