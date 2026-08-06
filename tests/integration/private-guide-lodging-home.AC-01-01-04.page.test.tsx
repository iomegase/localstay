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

jest.mock('@/features/lodging-showcase/queries/public-lodgings', () => ({
  listPublishedLodgings: jest.fn(async () => []),
}))

jest.mock('@/features/blog/queries/public-blog', () => ({
  getPublishedBlogArticles: jest.fn(async () => ({ city: null, items: [] })),
}))

jest.mock('@/features/analytics/lib/record-qr-scan', () => ({
  recordQrScanIfPresent: jest.fn(),
}))

jest.mock('@/features/guide-app/components/GuideApp', () => ({
  GuideApp: ({ mode, lodging, initialView, routes, menuItems }: {
    mode: string
    lodging: {
      name: string
      checkIn: string
      checkOut: string
      houseRules: unknown[]
    }
    initialView?: string
    routes: Record<string, string>
    menuItems?: Array<{ label: string; href?: string; view?: string }>
  }) => (
    <div
      data-testid="shared-guide-app"
      data-mode={mode}
      data-lodging={lodging.name}
      data-initial-view={initialView}
      data-lodging-route={routes.lodging}
      data-arrival-route={routes.arrival}
      data-practical-route={routes.practical}
      data-departure-route={routes.departure}
      data-menu-labels={menuItems?.map(item => item.label).join(',')}
      data-check-in={lodging.checkIn}
      data-check-out={lodging.checkOut}
      data-rules-count={lodging.houseRules.length}
    />
  ),
}))

import PrivateLodgingHomePage from '@/app/(public)/sejour/logement/page'

const privateData = {
  lodging: {
    id: 'lodging-1',
    name: 'Le Chalet Hygge',
    city: 'Saint-Gervais-les-Bains',
    checkIn: '16:00',
    checkOut: '10:00',
    houseRules: ['Non-fumeur', 'Calme après 22 h'],
  },
  pois: [],
}

describe('036-private-guide-lodging-home page', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetActiveLodgingContext.mockResolvedValue({
      lodgingId: 'lodging-1',
      citySlug: 'saint-gervais-les-bains',
    })
    mockGetPrivateGuideData.mockResolvedValue(privateData)
  })

  it('renders the shared lodging view with private stay data', async () => {
    render(await PrivateLodgingHomePage())

    const guide = screen.getByTestId('shared-guide-app')
    expect(guide).toHaveAttribute('data-mode', 'private')
    expect(guide).toHaveAttribute('data-lodging', 'Le Chalet Hygge')
    expect(guide).toHaveAttribute('data-initial-view', 'lodging')
    expect(guide).toHaveAttribute('data-lodging-route', '/sejour/logement')
    expect(guide).toHaveAttribute(
      'data-menu-labels',
      'Tous nos logements,Blog,Nous contacter',
    )
    expect(guide).toHaveAttribute('data-check-in', '16:00')
    expect(guide).toHaveAttribute('data-check-out', '10:00')
    expect(guide).toHaveAttribute('data-rules-count', '2')

    expect(guide).toHaveAttribute(
      'data-arrival-route',
      '/sejour/logement/arrivee',
    )
    expect(guide).toHaveAttribute(
      'data-practical-route',
      '/sejour/logement/informations-pratiques',
    )
    expect(guide).toHaveAttribute(
      'data-departure-route',
      '/sejour/logement/depart',
    )
  })

  it('does not load lodging data without an active stay', async () => {
    mockGetActiveLodgingContext.mockResolvedValue(null)

    await expect(PrivateLodgingHomePage()).rejects.toThrow(
      'REDIRECT:/acces-reserve',
    )
    expect(mockGetPrivateGuideData).not.toHaveBeenCalled()
  })
})
