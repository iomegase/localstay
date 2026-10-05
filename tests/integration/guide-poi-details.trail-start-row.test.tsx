/** @jest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react'
import { GuidePoiDetails } from '@/features/guide-app/components/GuidePoiDetails'
import { buildStayLodging, buildStayPoi } from '../support/guide-stay-lodging'

jest.mock('@/features/geolocation/hooks/useUserLocation', () => ({
  useUserLocation: () => ({ location: null, status: 'idle', requestLocation: jest.fn(), clearLocation: jest.fn() }),
}))

it('spec 021 (PO 2026-10-05): a trackable trail shows Démarrer, Sur le plan and Google Maps on one row', () => {
  const onStartTrail = jest.fn()
  const poi = buildStayPoi({
    name: 'Boucle du Prarion',
    phone: null,
    website: null,
    trail: {
      difficulty: 'medium',
      estimatedDurationMinutes: 367,
      distanceKm: 17.8,
      elevationGainM: 1374,
      startLabel: 'Départ',
      trackingEnabled: true,
    },
  })
  render(
    <GuidePoiDetails
      mode="private"
      poi={poi}
      lodging={buildStayLodging()}
      onBack={jest.fn()}
      onShowOnMap={jest.fn()}
      onStartTrail={onStartTrail}
    />,
  )

  const start = screen.getByTestId('btn-start')
  expect(Array.from((start.parentElement as HTMLElement).children).map(child => child.getAttribute('data-testid')))
    .toEqual(['btn-start', 'btn-map', 'btn-directions'])
  expect(screen.getAllByRole('button', { name: 'Démarrer la randonnée' })).toHaveLength(1)
  fireEvent.click(start)
  expect(onStartTrail).toHaveBeenCalledWith(poi)
})
