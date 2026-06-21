/** @jest-environment jsdom */
import { render } from '@testing-library/react'
import { PublicAnalyticsTracker } from '@/features/admin-analytics/components/PublicAnalyticsTracker'
import { ANALYTICS_CONSENT_KEY } from '@/features/admin-analytics/lib/consent'

function flush() {
  return new Promise(resolve => setTimeout(resolve, 0))
}

function clickAnalyticsTarget() {
  const button = document.createElement('button')
  button.setAttribute('data-analytics-event', 'lodging_contact_click')
  document.body.appendChild(button)
  button.click()
}

describe('PublicAnalyticsTracker', () => {
  beforeEach(() => {
    window.localStorage.setItem(ANALYTICS_CONSENT_KEY, 'accepted')
  })

  afterEach(() => {
    jest.restoreAllMocks()
    document.body.innerHTML = ''
    window.localStorage.clear()
  })

  it('sends the analytics beacon with keepalive so it survives navigation', async () => {
    const fetchMock = jest.fn().mockResolvedValue({ ok: true })
    window.fetch = fetchMock as unknown as typeof window.fetch

    render(<PublicAnalyticsTracker />)
    clickAnalyticsTarget()
    await flush()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith(
      '/api/public/analytics/events',
      expect.objectContaining({ keepalive: true }),
    )
  })

  it('does not produce an unhandled rejection when the beacon fetch fails', async () => {
    const fetchMock = jest.fn().mockRejectedValue(new TypeError('Failed to fetch'))
    window.fetch = fetchMock as unknown as typeof window.fetch

    const onUnhandled = jest.fn()
    process.on('unhandledRejection', onUnhandled)

    render(<PublicAnalyticsTracker />)
    clickAnalyticsTarget()
    await flush()
    await flush()

    process.off('unhandledRejection', onUnhandled)

    expect(fetchMock).toHaveBeenCalled()
    expect(onUnhandled).not.toHaveBeenCalled()
  })
})
