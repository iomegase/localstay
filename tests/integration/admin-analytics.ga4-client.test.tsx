/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { AnalyticsConsentBanner } from '@/features/admin-analytics/components/AnalyticsConsentBanner'
import { PublicAnalyticsTracker } from '@/features/admin-analytics/components/PublicAnalyticsTracker'
import { GoogleAnalyticsClient } from '@/features/admin-analytics/components/GoogleAnalyticsClient'
import { ANALYTICS_CONSENT_KEY } from '@/features/admin-analytics/lib/consent'

jest.mock('next/script', () => ({
  __esModule: true,
  default: ({
    id,
    src,
    strategy,
    dangerouslySetInnerHTML,
  }: {
    id?: string
    src?: string
    strategy?: string
    dangerouslySetInnerHTML?: { __html: string }
  }) => (
    <template
      data-testid="next-script"
      data-id={id}
      data-src={src}
      data-strategy={strategy}
      data-inline={dangerouslySetInnerHTML ? 'true' : 'false'}
    >
      {dangerouslySetInnerHTML?.__html ?? ''}
    </template>
  ),
}))

type GtagMock = jest.Mock<void, [string, string, Record<string, unknown>?]>

declare global {
  interface Window {
    gtag?: GtagMock
  }
}

describe('030 analytics ga4 client', () => {
  const fetchMock = jest.fn()
  const originalMeasurementId = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID

  beforeEach(() => {
    fetchMock.mockReset()
    window.localStorage.clear()
    delete window.gtag
    Object.defineProperty(window, 'fetch', {
      configurable: true,
      value: fetchMock,
    })
    process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID = 'G-TEST1234'
  })

  afterAll(() => {
    process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID = originalMeasurementId
  })

  it('AC-04-02 and AC-04-03: loads GA4 only after accepted consent', async () => {
    render(
      <>
        <GoogleAnalyticsClient />
        <AnalyticsConsentBanner />
      </>,
    )

    expect(screen.queryAllByTestId('next-script')).toHaveLength(0)

    fireEvent.click(screen.getByRole('button', { name: /accepter/i }))

    await waitFor(() => {
      expect(window.localStorage.getItem(ANALYTICS_CONSENT_KEY)).toBe('accepted')
    })

    await waitFor(() => {
      const scripts = screen.getAllByTestId('next-script')
      expect(scripts).toHaveLength(2)
      expect(scripts[0]).toHaveAttribute(
        'data-src',
        'https://www.googletagmanager.com/gtag/js?id=G-TEST1234',
      )
      expect(scripts[0]).toHaveAttribute('data-strategy', 'afterInteractive')
      expect(scripts[1]).toHaveAttribute('data-id', 'google-analytics-init')
      expect(scripts[1]).toHaveAttribute('data-inline', 'true')
    })
  })

  it('AC-04-04: forwards consented interactions to GA4 when available', async () => {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, 'accepted')
    window.gtag = jest.fn()
    fetchMock.mockResolvedValue({ ok: true })

    render(
      <>
        <GoogleAnalyticsClient />
        <PublicAnalyticsTracker />
        <a
          href="https://example.test"
          data-analytics-event="lodging_external_booking_click"
          data-analytics-city-slug="annecy"
          data-analytics-lodging-id="lodging-1"
          onClick={(event) => event.preventDefault()}
        >
          Reserver
        </a>
      </>,
    )

    fireEvent.click(screen.getByRole('link', { name: /reserver/i }))

    await waitFor(() => {
      expect(window.gtag).toHaveBeenCalledWith(
        'event',
        'lodging_external_booking_click',
        expect.objectContaining({
          city_slug: 'annecy',
          lodging_id: 'lodging-1',
          page_path: '/',
        }),
      )
    })
  })
})
