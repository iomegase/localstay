/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import PublicLayout from '@/app/(public)/layout'
import { ANALYTICS_CONSENT_KEY } from '@/features/admin-analytics/lib/consent'

const fetchMock = jest.fn()

jest.mock('next/navigation', () => ({
  usePathname: () => '/',
}))

jest.mock('@/features/public-menu/lib/lodging-mode', () => ({
  getActiveLodgingContext: jest.fn(async () => null),
}))

jest.mock('@/features/city-guide/components/PublicMenu', () => ({
  PublicMenu: () => <div>Menu</div>,
}))

jest.mock('@/features/city-guide/components/PublicBottomNav', () => ({
  PublicBottomNav: () => <div>BottomNav</div>,
}))

jest.mock('@vercel/analytics/react', () => ({
  Analytics: () => <div data-testid="vercel-analytics" />,
}))

jest.mock('@vercel/speed-insights/next', () => ({
  SpeedInsights: () => <div data-testid="vercel-speed-insights" />,
}))

describe('030 public layout analytics wiring', () => {
  beforeEach(() => {
    fetchMock.mockReset()
    window.localStorage.clear()
    Object.defineProperty(window, 'fetch', {
      configurable: true,
      value: fetchMock,
    })
  })

  it('mounts the consent banner and the public tracker in the public layout', async () => {
    render(
      await PublicLayout({
        children: (
          <a
            href="mailto:alice@example.test"
            data-analytics-event="owner_email_click"
            onClick={(event) => event.preventDefault()}
          >
            Contacter
          </a>
        ),
      }),
    )

    expect(await screen.findByRole('heading', { name: /mesure analytics/i })).toBeInTheDocument()
    expect(screen.getByTestId('vercel-analytics')).toBeInTheDocument()
    expect(screen.getByTestId('vercel-speed-insights')).toBeInTheDocument()

    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, 'accepted')
    fetchMock.mockResolvedValue({ ok: true })

    fireEvent.click(screen.getByRole('link', { name: /contacter/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/public/analytics/events',
        expect.objectContaining({
          method: 'POST',
        }),
      )
    })
  })
})
