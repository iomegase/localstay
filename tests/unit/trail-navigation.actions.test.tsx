/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { TrailAccessActions } from '@/features/trail-navigation/components/TrailAccessActions'

describe('021 trail access actions', () => {
  beforeEach(() => {
    jest.restoreAllMocks()
    process.env.NEXT_PUBLIC_MAPBOX_TOKEN = 'test-mapbox-token'
  })

  it('AC-01-02: renders Rejoindre le départ as a Google Maps route to the trail start', () => {
    const getCurrentPosition = jest.fn()
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition },
    })

    render(
      <TrailAccessActions
        citySlug="saint-gervais-les-bains"
        categorySlug="rando"
        trailSlug="mont-joux"
        startLabel="Départ Mont Joux"
        startLatitude={45.8731}
        startLongitude={6.673}
        hasGeometry={true}
      />,
    )

    expect(screen.getByRole('link', { name: /rejoindre le départ/i })).toHaveAttribute(
      'href',
      'https://www.google.com/maps/dir/?api=1&destination=45.8731%2C6.673',
    )
    expect(screen.getByRole('link', { name: /rejoindre le départ/i })).toHaveAttribute('target', '_blank')
    expect(getCurrentPosition).not.toHaveBeenCalled()
    expect(screen.queryByTestId('mapbox-access-map')).not.toBeInTheDocument()
  })

  it('AC-01-03: does not request StayLocal browser geolocation for Rejoindre le départ', () => {
    const getCurrentPosition = jest.fn()
    Object.defineProperty(navigator, 'geolocation', {
      configurable: true,
      value: { getCurrentPosition },
    })

    render(
      <TrailAccessActions
        citySlug="saint-gervais-les-bains"
        categorySlug="rando"
        trailSlug="mont-joux"
        startLabel="Départ Mont Joux"
        startLatitude={45.8731}
        startLongitude={6.673}
        hasGeometry={false}
      />,
    )

    expect(screen.getByRole('link', { name: /rejoindre le départ/i })).toBeInTheDocument()
    expect(getCurrentPosition).not.toHaveBeenCalled()
    expect(screen.queryByText(/GPS indisponible/i)).not.toBeInTheDocument()
  })

  it('points "Commencer la rando" to the category-scoped start route', () => {
    render(
      <TrailAccessActions
        citySlug="saint-gervais-les-bains"
        categorySlug="balades"
        trailSlug="mont-joux"
        startLabel="Départ Mont Joux"
        startLatitude={45.8731}
        startLongitude={6.673}
        hasGeometry={true}
      />,
    )

    expect(screen.getByRole('link', { name: /commencer la rando/i })).toHaveAttribute(
      'href',
      '/guide/saint-gervais-les-bains/balades/mont-joux/start',
    )
  })
})
