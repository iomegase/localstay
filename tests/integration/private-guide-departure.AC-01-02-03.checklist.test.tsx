/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { DepartureChecklist } from '@/features/guide-app/components/DepartureChecklist'
import { GuideLodgingViews } from '@/features/guide-app/components/GuideLodgingViews'

describe('039-private-guide-departure checklist', () => {
  it('updates checkbox state and progress locally', () => {
    render(
      <DepartureChecklist
        items={['Vider le réfrigérateur', 'Fermer les fenêtres']}
      />,
    )

    expect(screen.getByText('0 / 2')).toBeInTheDocument()
    const first = screen.getByRole('checkbox', {
      name: 'Vider le réfrigérateur',
    })
    fireEvent.click(first)

    expect(first).toBeChecked()
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
    expect(
      screen.getByRole('progressbar', {
        name: 'Progression des consignes de départ',
      }),
    ).toHaveAttribute('aria-valuenow', '1')
  })

  it('shows a softer departure title for the checklist view', () => {
    render(
      <GuideLodgingViews
        view="departure"
        lodging={{
          id: 'lodging-1',
          name: 'Le Chalet Hygge',
          city: 'Saint-Gervais',
          tagline: 'Séjour cosy',
          coverImage: '',
          gallery: [],
          latitude: 45.9,
          longitude: 6.8,
          addressLabel: 'Rue des Alpes, 74170',
          checkIn: '15:00',
          checkOut: '10:00',
          wifiName: 'WiFi',
          wifiPassword: 'secret',
          arrivalInstructions: [],
          departureInstructions: ['Vider le réfrigérateur'],
          houseRules: [],
          practicalCards: [],
          usefulNumbers: [],
          trashBins: [],
          trashLocation: null,
        }}
        onNavigate={jest.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Checklist du départ' })).toBeInTheDocument()
  })

  it('uses the equipment title on the rules page', () => {
    render(
      <GuideLodgingViews
        view="rules"
        lodging={{
          id: 'lodging-1',
          name: 'Le Chalet Hygge',
          city: 'Saint-Gervais',
          tagline: 'Séjour cosy',
          coverImage: '',
          gallery: [],
          latitude: 45.9,
          longitude: 6.8,
          addressLabel: 'Rue des Alpes, 74170',
          checkIn: '15:00',
          checkOut: '10:00',
          wifiName: 'WiFi',
          wifiPassword: 'secret',
          arrivalInstructions: [],
          departureInstructions: [],
          houseRules: ['Merci de respecter le logement'],
          practicalCards: [],
          usefulNumbers: [],
          trashBins: [],
          trashLocation: null,
        }}
        onNavigate={jest.fn()}
      />,
    )

    expect(screen.getByRole('heading', { name: 'Les Équipements' })).toBeInTheDocument()
  })
})
