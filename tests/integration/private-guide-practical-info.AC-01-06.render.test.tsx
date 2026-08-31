/** @jest-environment jsdom */

import type { ComponentProps } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import { GuideLodgingViews } from '@/features/guide-app/components/GuideLodgingViews'
import { demoLodging } from '@/features/guide-demo/demo-guide-data'

type View = ComponentProps<typeof GuideLodgingViews>['view']
type Overrides = Partial<ComponentProps<typeof GuideLodgingViews>['lodging']>

function renderView(view: View, overrides: Overrides = {}, onNavigate = jest.fn()) {
  render(
    <GuideLodgingViews
      view={view}
      lodging={{ ...demoLodging, practicalCards: [], ...overrides }}
      onNavigate={onNavigate}
    />,
  )
  return onNavigate
}

describe('038 AC — practical view: emergencies, useful numbers', () => {
  it('always shows the hard-coded French emergency numbers', () => {
    renderView('practical', { usefulNumbers: [] })

    expect(screen.getByRole('heading', { name: 'Urgences' })).toBeInTheDocument()
    expect(screen.getByText('112')).toBeInTheDocument()
    expect(screen.getByText('114')).toBeInTheDocument()
  })

  it('renders owner useful numbers, formatted and tappable to call', () => {
    renderView('practical', {
      usefulNumbers: [{ label: 'Office de tourisme', number: '0450477608' }],
    })

    expect(screen.getByRole('heading', { name: 'Numéros utiles' })).toBeInTheDocument()
    expect(screen.getByText('+33 4 50 47 76 08')).toBeInTheDocument()
    expect(
      screen.getByRole('link', { name: /Office de tourisme/i }),
    ).toHaveAttribute('href', 'tel:+33450477608')
  })

  it('keeps emergency short codes tappable without +33 reformatting', () => {
    renderView('practical', { usefulNumbers: [] })

    expect(
      screen.getByRole('link', { name: /numéro européen/i }),
    ).toHaveAttribute('href', 'tel:112')
  })

  it('shows the active trash bins in a Recyclage section', () => {
    renderView('practical', {
      trashBins: [{ type: 'jaune' }, { type: 'verte' }],
      trashLocation: 'https://maps.app.goo.gl/abc',
    })

    expect(screen.getByRole('heading', { name: 'Recyclage' })).toBeInTheDocument()
    expect(screen.getByText('Poubelle jaune')).toBeInTheDocument()
    expect(
      screen.getByText('Emballages & papiers recyclables'),
    ).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /maps/i })).toHaveAttribute(
      'href',
      'https://maps.app.goo.gl/abc',
    )
  })

  it('does not show the règlement in practical (moved to Consignes)', () => {
    renderView('practical', { houseRules: ['Non-fumeur'], usefulNumbers: [] })

    expect(
      screen.queryByRole('heading', { name: 'Règlement intérieur' }),
    ).not.toBeInTheDocument()
  })
})

describe('practical block cards live in Équipements, not in Informations pratiques', () => {
  const blocks = [
    { id: 'c1', title: 'Écran de cinéma', description: 'attention', icon: 'tv' },
  ]

  it('shows the block cards in the Équipements (rules) view', () => {
    renderView('rules', { practicalCards: blocks })
    expect(screen.getByText('Écran de cinéma')).toBeInTheDocument()
  })

  it('expands equipment descriptions under the icon column', () => {
    renderView('rules', {
      practicalCards: [
        {
          id: 'c1',
          title: 'Climatisation',
          description: 'L’appartement est équipé d’une climatisation réversible.',
          icon: 'air-vent',
        },
      ],
    })

    const contentWrapper = screen
      .getByText('L’appartement est équipé d’une climatisation réversible.')
      .closest('div')

    expect(contentWrapper).toHaveClass('mt-3', 'pl-12')
  })

  it('no longer shows the block cards in Informations pratiques', () => {
    renderView('practical', { practicalCards: blocks })
    expect(screen.queryByText('Écran de cinéma')).not.toBeInTheDocument()
  })

  it('routes recycling cards to Informations pratiques instead of Équipements', () => {
    const recyclingCard = {
      id: 'waste',
      title: 'Tri des déchets',
      description: 'Verre, emballages et ordures ménagères.',
      icon: 'recycle',
    }

    const { unmount } = render(
      <GuideLodgingViews
        view="rules"
        lodging={{ ...demoLodging, practicalCards: [recyclingCard] }}
        onNavigate={jest.fn()}
      />,
    )
    expect(screen.queryByText('Tri des déchets')).not.toBeInTheDocument()

    unmount()
    renderView('practical', { practicalCards: [recyclingCard], trashBins: [] })
    expect(screen.getByText('Tri des déchets')).toBeInTheDocument()
  })
})

describe('Équipements view (rules)', () => {
  it('lists the house rules', () => {
    renderView('rules', {
      houseRules: ['Non-fumeur', 'Animaux sur demande'],
    })

    expect(
      screen.getByRole('heading', { name: 'Les Équipements' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('heading', { name: 'Règlement intérieur' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Non-fumeur')).toBeInTheDocument()
  })
})

describe('arrival view (Bienvenue)', () => {
  it('groups the arrival steps under an "Instructions" section', () => {
    renderView('arrival', {
      arrivalInstructions: [
        { text: 'Ouvrez le portail avec le badge', videoUrl: null, photos: [] },
      ],
    })

    expect(
      screen.getByRole('heading', { name: 'Instructions' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Ouvrez le portail avec le badge')).toBeInTheDocument()
  })

  it('embeds a compact Maps link in the Localisation card, address on two lines', () => {
    renderView('arrival', {
      addressLabel: '1094 route de la croix, 74170 Saint-Gervais-les-Bains',
    })

    // Bouton Maps intégré (plus de gros bouton "Google Maps")
    const maps = screen.getByRole('link', { name: /^maps$/i })
    expect(maps.getAttribute('href')).toContain('google.com/maps')
    expect(screen.queryByText('Google Maps')).not.toBeInTheDocument()

    // Adresse découpée en lignes
    expect(screen.getByText('1094 route de la croix')).toBeInTheDocument()
    expect(screen.getByText('74170 Saint-Gervais-les-Bains')).toBeInTheDocument()
  })
})

describe('lodging hub navigation', () => {
  it('routes the "Équipements" link to the rules view', () => {
    const onNavigate = renderView('lodging')

    fireEvent.click(screen.getByRole('button', { name: /Équipements/i }))

    expect(onNavigate).toHaveBeenCalledWith('rules')
  })
})
