/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TrailAccessActions } from '@/features/trail-navigation/components/TrailAccessActions'

describe('021 trail access actions', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
  })

  it('AC-01-02/AC-04-01: requests browser geolocation only after Rejoindre le départ click', async () => {
    const getCurrentPosition = jest.fn((success: PositionCallback) => {
      success({
        coords: {
          latitude: 45.9,
          longitude: 6.7,
          accuracy: 12,
          altitude: null,
          altitudeAccuracy: null,
          heading: null,
          speed: null,
        },
        timestamp: 1,
      } satisfies GeolocationPosition)
    })
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition },
    })

    render(
      <TrailAccessActions
        citySlug="saint-gervais-les-bains"
        trailSlug="mont-joux"
        startLabel="Départ Mont Joux"
        startLatitude={45.8731}
        startLongitude={6.673}
        hasGeometry={true}
      />,
    )

    expect(getCurrentPosition).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole('button', { name: /rejoindre le départ/i }))

    await waitFor(() => expect(getCurrentPosition).toHaveBeenCalledTimes(1))
    expect(screen.getByTestId('trail-access-route')).toHaveTextContent(/route mapbox/i)
  })

  it('AC-01-03: shows start marker state when GPS is denied', async () => {
    const getCurrentPosition = jest.fn((_success: PositionCallback, error: PositionErrorCallback) => {
      error({ code: 1, message: 'denied', PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3 })
    })
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition },
    })

    render(
      <TrailAccessActions
        citySlug="saint-gervais-les-bains"
        trailSlug="mont-joux"
        startLabel="Départ Mont Joux"
        startLatitude={45.8731}
        startLongitude={6.673}
        hasGeometry={false}
      />,
    )

    await userEvent.click(screen.getByRole('button', { name: /rejoindre le départ/i }))

    expect(await screen.findByTestId('trail-access-start-marker')).toHaveTextContent('Départ Mont Joux')
    expect(screen.getByText(/45\.87310, 6\.67300/)).toBeInTheDocument()
  })
})
