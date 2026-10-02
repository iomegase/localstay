/** @jest-environment jsdom */

import type { ComponentProps } from 'react'
import { render, screen } from '@testing-library/react'
import { GuidePracticalView } from '@/features/guide-app/components/GuidePracticalView'
import { GuideHouseGuide } from '@/features/guide-app/components/stay/GuideHouseGuide'
import { demoLodging } from '@/features/guide-demo/demo-guide-data'

type Overrides = Partial<ComponentProps<typeof GuidePracticalView>['lodging']>

// Spec 054 : « rules » = Guide logement (équipements), « practical » = Infos pratiques.
function renderView(view: 'practical' | 'rules', overrides: Overrides = {}) {
  const lodging = { ...demoLodging, practicalCards: [], ...overrides }
  render(
    view === 'practical'
      ? <GuidePracticalView lodging={lodging} onBack={jest.fn()} />
      : <GuideHouseGuide lodging={lodging} onBack={jest.fn()} />,
  )
}

describe('038 AC — practical view: emergencies, useful numbers', () => {
  it('always shows the hard-coded 112 emergency number only (spec 050 AC-01-05)', () => {
    renderView('practical', { usefulNumbers: [] })

    expect(screen.getByRole('heading', { name: 'Urgences' })).toBeInTheDocument()
    expect(screen.getByText('112')).toBeInTheDocument()
    expect(screen.queryByText('114')).not.toBeInTheDocument()
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

  it('shows a single Point de tri link instead of the trash bins (spec 050 AC-01-07)', () => {
    renderView('practical', {
      trashBins: [{ type: 'jaune' }, { type: 'verte' }],
      trashLocation: 'https://maps.app.goo.gl/abc',
    })

    expect(screen.getByRole('heading', { name: 'Tri des déchets' })).toBeInTheDocument()
    expect(screen.queryByText('Poubelle jaune')).not.toBeInTheDocument()
    expect(screen.getByRole('link', { name: /Point de tri/i })).toHaveAttribute(
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
      <GuideHouseGuide lodging={{ ...demoLodging, practicalCards: [recyclingCard] }} onBack={jest.fn()} />,
    )
    expect(screen.queryByText('Tri des déchets')).not.toBeInTheDocument()

    unmount()
    renderView('practical', { practicalCards: [recyclingCard], trashBins: [] })
    expect(
      screen.getByRole('heading', { level: 3, name: 'Tri des déchets' }),
    ).toBeInTheDocument()
  })
})
