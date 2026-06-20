/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AnalyticsConsentBanner } from '@/features/admin-analytics/components/AnalyticsConsentBanner'
import { PublicAnalyticsTracker } from '@/features/admin-analytics/components/PublicAnalyticsTracker'
import { ANALYTICS_CONSENT_KEY } from '@/features/admin-analytics/lib/consent'

describe('030 analytics consent banner', () => {
  const fetchMock = jest.fn()

  beforeEach(() => {
    fetchMock.mockReset()
    window.localStorage.clear()
    Object.defineProperty(window, 'fetch', {
      configurable: true,
      value: fetchMock,
    })
  })

  it('shows the banner when consent is unset and persists refusal', async () => {
    render(<AnalyticsConsentBanner />)

    expect(screen.getByRole('heading', { name: /mesure analytics/i })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /refuser/i }))

    await waitFor(() => {
      expect(window.localStorage.getItem(ANALYTICS_CONSENT_KEY)).toBe('refused')
    })

    expect(screen.queryByText(/mesure analytics/i)).not.toBeInTheDocument()
  })

  it('persists acceptance and records consented public interactions only after accept', async () => {
    render(
      <>
        <AnalyticsConsentBanner />
        <PublicAnalyticsTracker />
        <a
          href="mailto:alice@example.test"
          data-analytics-event="owner_email_click"
          data-analytics-city-slug="annecy"
          onClick={(event) => event.preventDefault()}
        >
          Contacter l'hôte
        </a>
      </>,
    )

    fireEvent.click(screen.getByRole('link', { name: /contacter l'hôte/i }))
    expect(fetchMock).not.toHaveBeenCalled()

    fireEvent.click(screen.getByRole('button', { name: /accepter/i }))

    await waitFor(() => {
      expect(window.localStorage.getItem(ANALYTICS_CONSENT_KEY)).toBe('accepted')
    })

    fetchMock.mockResolvedValue({ ok: true })
    fireEvent.click(screen.getByRole('link', { name: /contacter l'hôte/i }))

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        '/api/public/analytics/events',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
        }),
      )
    })
  })
})
