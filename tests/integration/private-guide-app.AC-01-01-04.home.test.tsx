/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'

const mockGetActiveLodgingContext = jest.fn()
const mockGetPrivateGuideData = jest.fn()
const mockRedirect = jest.fn((destination: string) => {
  throw new Error(`REDIRECT:${destination}`)
})
const mockRecordQrScanIfPresent = jest.fn()

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
  recordQrScanIfPresent: (lodgingId: string | null) =>
    mockRecordQrScanIfPresent(lodgingId),
}))

jest.mock('@/features/guide-app/components/GuideApp', () => ({
  GuideApp: ({ mode, lodging, pois, routes, initialView, citySlug }: {
    mode: string
    lodging: { name: string; city: string }
    pois: unknown[]
    routes: Record<string, string>
    initialView?: string
    citySlug?: string
  }) => (
    <div
      data-testid="shared-guide-app"
      data-mode={mode}
      data-lodging={lodging.name}
      data-city={lodging.city}
      data-poi-count={pois.length}
      data-favorites-route={routes.favorites}
      data-lodging-route={routes.lodging}
      data-map-route={routes.map}
      data-initial-view={initialView ?? 'home'}
      data-city-slug={citySlug}
    />
  ),
}))

import SejourPage from '@/app/(public)/sejour/page'

const privateData = {
  lodging: {
    id: 'lodging-1',
    name: 'Le Chalet Hygge',
    city: 'Saint-Gervais-les-Bains',
  },
  pois: [{ id: 'poi-1' }, { id: 'poi-2' }],
}

describe('034-private-guide-app /sejour home', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetActiveLodgingContext.mockResolvedValue({
      lodgingId: 'lodging-1',
      citySlug: 'saint-gervais-les-bains',
    })
    mockGetPrivateGuideData.mockResolvedValue(privateData)
  })

  it('renders the shared private GuideApp with real stay data and canonical favorites route', async () => {
    render(
      await SejourPage({
        searchParams: Promise.resolve({ lodging: 'lodging-1' }),
      }),
    )

    const shell = screen.getByTestId('private-guide-shell')
    expect(shell).toHaveClass(
      'w-[min(430px,calc(100vw-24px))]',
      'h-[min(820px,calc(100dvh-24px))]',
    )

    const guide = screen.getByTestId('shared-guide-app')
    expect(guide).toHaveAttribute('data-mode', 'private')
    expect(guide).toHaveAttribute('data-lodging', 'Le Chalet Hygge')
    expect(guide).toHaveAttribute('data-city', 'Saint-Gervais-les-Bains')
    expect(guide).toHaveAttribute(
      'data-city-slug',
      'saint-gervais-les-bains',
    )
    expect(guide).toHaveAttribute('data-poi-count', '2')
    expect(guide).toHaveAttribute(
      'data-favorites-route',
      '/sejour/coups-de-coeur',
    )
    expect(guide).toHaveAttribute('data-initial-view', 'home')
    expect(guide).toHaveAttribute('data-lodging-route', '/sejour/logement')
    expect(guide).toHaveAttribute('data-map-route', '/map')
    expect(mockRecordQrScanIfPresent).toHaveBeenCalledWith('lodging-1')
  })

  it('does not load private guide data without an active stay', async () => {
    mockGetActiveLodgingContext.mockResolvedValue(null)

    await expect(
      SejourPage({ searchParams: Promise.resolve({}) }),
    ).rejects.toThrow('REDIRECT:/acces-reserve')
    expect(mockGetPrivateGuideData).not.toHaveBeenCalled()
  })
})
