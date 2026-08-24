/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'

const mockHeaders = jest.fn()

jest.mock('next/headers', () => ({
  headers: () => mockHeaders(),
}))

jest.mock('@/features/public-menu/lib/lodging-mode', () => ({
  getActiveLodgingContext: jest.fn(),
}))

jest.mock('@vercel/analytics/react', () => ({ Analytics: () => null }))
jest.mock('@vercel/speed-insights/next', () => ({ SpeedInsights: () => null }))
jest.mock('@/features/admin-analytics/components/AnalyticsConsentBanner', () => ({
  AnalyticsConsentBanner: () => null,
}))
jest.mock('@/features/admin-analytics/components/PublicAnalyticsTracker', () => ({
  PublicAnalyticsTracker: () => null,
}))
jest.mock('@/features/admin-analytics/components/GoogleAnalyticsClient', () => ({
  GoogleAnalyticsClient: () => null,
}))
jest.mock('@/features/city-guide/components/PublicBottomNav', () => ({
  PublicBottomNav: () => <nav data-testid="private-bottom-nav" />,
}))
jest.mock('@/features/city-guide/components/PublicMenu', () => ({
  PublicMenu: () => <div data-testid="private-public-menu" />,
}))

import PublicLayout from '@/app/(public)/layout'
import { getActiveLodgingContext } from '@/features/public-menu/lib/lodging-mode'

describe('031-public-marketing-site public layout modes', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockHeaders.mockResolvedValue(new Headers())
  })

  it('does not constrain anonymous marketing pages to the private 430px shell', async () => {
    jest.mocked(getActiveLodgingContext).mockResolvedValue(null)

    render(await PublicLayout({ children: <div>Marketing content</div> }))

    expect(screen.queryByTestId('public-header')).not.toBeInTheDocument()
    expect(screen.queryByTestId('private-bottom-nav')).not.toBeInTheDocument()
    expect(screen.getByText('Marketing content')).toBeInTheDocument()
  })

  it('keeps the existing private guide chrome for an active lodging stay', async () => {
    jest.mocked(getActiveLodgingContext).mockResolvedValue({
      lodgingName: 'Chalet',
      ownerName: 'Alice',
      citySlug: 'saint-gervais-les-bains',
    } as Awaited<ReturnType<typeof getActiveLodgingContext>>)

    render(await PublicLayout({ children: <div>Private stay</div> }))

    expect(screen.getByTestId('public-header')).toBeInTheDocument()
    expect(screen.getByTestId('private-bottom-nav')).toBeInTheDocument()
    expect(screen.getByTestId('public-header').parentElement).toHaveClass(
      'max-w-[430px]',
    )
  })

  it('keeps the /decouvrir marketing marker outside the private shell and lodging reads', async () => {
    mockHeaders.mockResolvedValue(
      new Headers({ 'x-staylocal-marketing-route': '1' }),
    )

    render(await PublicLayout({ children: <div data-testid="discovery-root">Découvrir</div> }))

    expect(screen.queryByTestId('public-header')).not.toBeInTheDocument()
    expect(screen.queryByTestId('private-bottom-nav')).not.toBeInTheDocument()
    expect(screen.getByTestId('discovery-root')).toBeInTheDocument()
    expect(getActiveLodgingContext).not.toHaveBeenCalled()
  })
})
