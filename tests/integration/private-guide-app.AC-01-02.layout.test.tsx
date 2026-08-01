/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import PublicLayout from '@/app/(public)/layout'

jest.mock('next/headers', () => ({
  headers: jest.fn(async () =>
    new Headers({ 'x-staylocal-guide-app-route': '1' }),
  ),
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

jest.mock('@/features/public-menu/lib/lodging-mode', () => ({
  getActiveLodgingContext: jest.fn(async () => ({
    lodgingId: 'lodging-1',
    lodgingName: 'Le Chalet Hygge',
    citySlug: 'saint-gervais-les-bains',
    cityName: 'Saint-Gervais-les-Bains',
    ownerName: 'Alice',
  })),
}))

describe('034-private-guide-app public layout boundary', () => {
  it('does not wrap /sejour in the historical private header and navigation', async () => {
    render(
      await PublicLayout({
        children: <div data-testid="sejour-content">Séjour</div>,
      }),
    )

    expect(screen.getByTestId('sejour-content')).toBeInTheDocument()
    expect(screen.queryByTestId('public-header')).not.toBeInTheDocument()
    expect(
      screen.queryByRole('navigation', { name: 'Navigation principale' }),
    ).not.toBeInTheDocument()
  })
})
