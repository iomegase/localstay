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
  GuideApp: ({ mode, lodging, pois, routes, initialView, menuItems }: {
    mode: string
    lodging: { name: string; city: string }
    pois: unknown[]
    routes: Record<string, string>
    initialView?: string
    menuItems?: Array<{ label: string; href: string }>
  }) => (
    <div
      data-testid="shared-guide-app"
      data-mode={mode}
      data-lodging={lodging.name}
      data-city={lodging.city}
      data-poi-count={pois.length}
      data-initial-view={initialView}
      data-favorites-route={routes.favorites}
      data-menu-favorites-route={
        menuItems?.find(item => item.label === 'Coups de cœur')?.href
      }
    />
  ),
}))

import PrivateFavoritesPage from '@/app/(public)/sejour/coups-de-coeur/page'

const privateData = {
  lodging: {
    id: 'lodging-1',
    name: 'Le Chalet Hygge',
    city: 'Saint-Gervais-les-Bains',
  },
  pois: [{ id: 'poi-1' }, { id: 'poi-2' }, { id: 'poi-3' }],
}

describe('035-private-guide-favorites page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetActiveLodgingContext.mockResolvedValue({
      lodgingId: 'lodging-1',
      citySlug: 'saint-gervais-les-bains',
    })
    mockGetPrivateGuideData.mockResolvedValue(privateData)
  })

  it('renders the shared demo favorites view with private stay data', async () => {
    render(await PrivateFavoritesPage())

    expect(screen.getByTestId('private-guide-shell')).toHaveClass(
      'max-w-[430px]',
      'h-[100dvh]',
    )
    const guide = screen.getByTestId('shared-guide-app')
    expect(guide).toHaveAttribute('data-mode', 'private')
    expect(guide).toHaveAttribute('data-lodging', 'Le Chalet Hygge')
    expect(guide).toHaveAttribute('data-city', 'Saint-Gervais-les-Bains')
    expect(guide).toHaveAttribute('data-poi-count', '3')
    expect(guide).toHaveAttribute('data-initial-view', 'favorites')
    expect(guide).toHaveAttribute(
      'data-favorites-route',
      '/sejour/coups-de-coeur',
    )
    expect(guide).toHaveAttribute(
      'data-menu-favorites-route',
      '/sejour/coups-de-coeur',
    )
  })

  it('does not load private POIs without an active stay', async () => {
    mockGetActiveLodgingContext.mockResolvedValue(null)

    await expect(PrivateFavoritesPage()).rejects.toThrow(
      'REDIRECT:/acces-reserve',
    )
    expect(mockGetPrivateGuideData).not.toHaveBeenCalled()
  })
})
