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

it('2026-10-17 : la fiche affiche la durée de la randonnée, au format de l’écran Démarrer', () => {
  const trail = { difficulty: 'medium' as const, distanceKm: 19.8, elevationGainM: 1154, startLabel: 'Notre-Dame de la Gorge', trackingEnabled: true }
  const { rerender } = render(
    <GuidePoiDetails mode="private" poi={buildStayPoi({ name: 'Col du Bonhomme', trail: { ...trail, estimatedDurationMinutes: 353 } })}
      lodging={buildStayLodging()} onBack={jest.fn()} onShowOnMap={jest.fn()} />,
  )
  expect(screen.getByText('5 h 53')).toBeInTheDocument()
  expect(screen.getByText('19,8 km')).toBeInTheDocument()
  expect(screen.getByText('1154 m')).toBeInTheDocument()

  rerender(
    <GuidePoiDetails mode="private" poi={buildStayPoi({ name: 'Col du Bonhomme', trail: { ...trail, estimatedDurationMinutes: null } })}
      lodging={buildStayLodging()} onBack={jest.fn()} onShowOnMap={jest.fn()} />,
  )
  expect(screen.queryByText('5 h 53')).not.toBeInTheDocument()
})

it('2026-10-18 : « Google Maps » d’une randonnée mène au point de départ (coordonnées), pas à la ville', () => {
  render(
    <GuidePoiDetails
      mode="private"
      poi={buildStayPoi({
        name: 'Tête Noire : Sentiers des Gardes',
        address: 'Les Contamines-Montjoie',
        latitude: 45.911236,
        longitude: 6.723461,
        trail: { difficulty: 'medium', estimatedDurationMinutes: 267, distanceKm: 12.7, elevationGainM: 1150, startLabel: null, trackingEnabled: true },
      })}
      lodging={buildStayLodging()}
      onBack={jest.fn()}
      onShowOnMap={jest.fn()}
    />,
  )
  expect(screen.getByTestId('btn-directions')).toHaveAttribute('href', 'https://www.google.com/maps/dir/?api=1&destination=45.911236%2C6.723461')
})

it('un lieu qui n’est pas une randonnée garde son adresse pour Google Maps', () => {
  render(
    <GuidePoiDetails mode="private" poi={buildStayPoi({ name: 'La Vieille Auberge', address: '140 Rte de Notre Dame de la Gorge, Les Contamines', trail: undefined })}
      lodging={buildStayLodging()} onBack={jest.fn()} onShowOnMap={jest.fn()} />,
  )
  expect(screen.getByTestId('btn-directions').getAttribute('href')).toContain('140%20Rte%20de%20Notre%20Dame')
})
