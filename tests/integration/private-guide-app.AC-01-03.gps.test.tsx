/** @jest-environment jsdom */

import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { GuideGpsCard } from '@/features/guide-app/components/GuideGpsCard'
import { readStoredLocation } from '@/features/geolocation/lib/user-location'

describe('034-private-guide-app voluntary GPS activation', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('stores the granted browser position for the private guide consumers', async () => {
    const user = userEvent.setup()
    let grantPosition: PositionCallback | null = null

    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: {
        getCurrentPosition: jest.fn((success: PositionCallback) => {
          grantPosition = success
        }),
      },
    })

    render(<GuideGpsCard />)
    await user.click(screen.getByRole('button', { name: 'Activer mon GPS' }))

    const position = {
      coords: {
        latitude: 45.891,
        longitude: 6.713,
        accuracy: 12,
        altitude: null,
        altitudeAccuracy: null,
        heading: null,
        speed: null,
      },
      timestamp: Date.now(),
    } satisfies GeolocationPosition

    act(() => grantPosition?.(position))

    expect(readStoredLocation()).toEqual({
      latitude: 45.891,
      longitude: 6.713,
    })
    expect(screen.getByText(/GPS activé/i)).toBeInTheDocument()
  })
})
