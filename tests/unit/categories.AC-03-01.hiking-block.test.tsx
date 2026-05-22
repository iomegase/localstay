/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { HikingBlock } from '@/features/categories/components/HikingBlock'
import type { HikingDetailData } from '@/features/categories/types'

const hiking: HikingDetailData = {
  difficulty: 'hard',
  duration_minutes: 270,
  distance_km: 11.0,
  elevation_gain_m: 650,
  starting_point: 'Parking de la Flégère',
  parking_info: 'Payant en saison (env. 8€/jour)',
  kids_friendly: false,
  pets_friendly: true,
  best_season: ['summer'],
  gpx_url: null,
}

describe('HikingBlock — AC-03-01', () => {
  beforeEach(() => {
    render(<HikingBlock hiking={hiking} />)
  })

  it('renders difficulty label', () => {
    expect(screen.getByTestId('hiking-difficulty')).toHaveTextContent('Difficile')
  })

  it('renders duration formatted as 4h30', () => {
    expect(screen.getByTestId('hiking-duration')).toHaveTextContent('4h30')
  })

  it('renders distance', () => {
    expect(screen.getByTestId('hiking-distance')).toHaveTextContent('11.0 km')
  })

  it('renders elevation gain', () => {
    expect(screen.getByTestId('hiking-elevation')).toHaveTextContent('650 m')
  })

  it('renders starting point', () => {
    expect(screen.getByTestId('hiking-starting-point')).toHaveTextContent('Parking de la Flégère')
  })

  it('renders parking info', () => {
    expect(screen.getByTestId('hiking-parking')).toHaveTextContent('Payant en saison')
  })

  it('renders pets_friendly indicator', () => {
    expect(screen.getByTestId('hiking-pets')).toBeInTheDocument()
  })

  it('renders best_season as Été', () => {
    expect(screen.getByTestId('hiking-season')).toHaveTextContent('Été')
  })
})
