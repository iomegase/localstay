/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'

jest.mock('mapbox-gl', () => ({
  __esModule: true,
  default: {
    accessToken: '',
    Map: class {
      on() {}
      remove() {}
      addControl() {}
    },
    Marker: class {
      setLngLat() { return this }
      addTo() { return this }
    },
    NavigationControl: class {},
  },
}))

import { LodgingLocationMap } from '@/features/lodging-showcase/components/LodgingLocationMap'

describe('LodgingLocationMap', () => {
  it('renders the address and a directions link', () => {
    render(<LodgingLocationMap latitude={45.9} longitude={6.86} areaLabel="St Gervais" />)
    expect(screen.getByText('St Gervais')).toBeInTheDocument()
    const link = screen.getByRole('link', { name: /itinéraire/i })
    expect(link).toHaveAttribute('href', 'https://www.google.com/maps/dir/?api=1&destination=45.9,6.86')
  })
})
