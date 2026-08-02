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
      addressLabel: string
      latitude: number
      longitude: number
      arrivalInstructions: string[]
    }
    initialView?: string
    routes: Record<string, string>
  }) => (
    <div
      data-testid="shared-guide-app"
      data-mode={mode}
      data-lodging={lodging.name}
      data-initial-view={initialView}
      data-arrival-route={routes.arrival}
      data-parent-route={routes.lodging}
      data-address={lodging.addressLabel}
      data-latitude={lodging.latitude}
      data-longitude={lodging.longitude}
      data-instruction-count={lodging.arrivalInstructions.length}
    />
  ),
}))

import PrivateArrivalPage from '@/app/(public)/sejour/logement/arrivee/page'

const privateData = {
  lodging: {
    id: 'lodging-1',
    name: 'Le Chalet Hygge',
    city: 'Saint-Gervais-les-Bains',
    addressLabel: '123 route du Mont-Blanc',
    latitude: 45.89,
    longitude: 6.71,
    arrivalInstructions: [
      'Garez-vous devant le chalet.',
      'Entrez par la porte principale.',
    ],
  },
  pois: [],
}

describe('037-private-guide-arrival page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetActiveLodgingContext.mockResolvedValue({
      lodgingId: 'lodging-1',
      citySlug: 'saint-gervais-les-bains',
    })
    mockGetPrivateGuideData.mockResolvedValue(privateData)
  })

  it('renders the shared arrival view with private lodging data', async () => {
    render(await PrivateArrivalPage())

    const guide = screen.getByTestId('shared-guide-app')
    expect(guide).toHaveAttribute('data-mode', 'private')
    expect(guide).toHaveAttribute('data-lodging', 'Le Chalet Hygge')
    expect(guide).toHaveAttribute('data-initial-view', 'arrival')
    expect(guide).toHaveAttribute(
      'data-arrival-route',
      '/sejour/logement/arrivee',
    )
    expect(guide).toHaveAttribute('data-parent-route', '/sejour/logement')
    expect(guide).toHaveAttribute('data-address', '123 route du Mont-Blanc')
    expect(guide).toHaveAttribute('data-latitude', '45.89')
    expect(guide).toHaveAttribute('data-longitude', '6.71')
    expect(guide).toHaveAttribute('data-instruction-count', '2')
  })

  it('does not load arrival data without an active stay', async () => {
    mockGetActiveLodgingContext.mockResolvedValue(null)

    await expect(PrivateArrivalPage()).rejects.toThrow(
      'REDIRECT:/acces-reserve',
    )
    expect(mockGetPrivateGuideData).not.toHaveBeenCalled()
  })
})
