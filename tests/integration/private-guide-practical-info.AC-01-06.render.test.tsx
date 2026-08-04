/** @jest-environment jsdom */

import type { ComponentProps } from 'react'
import { render, screen } from '@testing-library/react'
import { GuideLodgingViews } from '@/features/guide-app/components/GuideLodgingViews'
import { demoLodging } from '@/features/guide-demo/demo-guide-data'

type Overrides = Partial<ComponentProps<typeof GuideLodgingViews>['lodging']>

function renderPractical(overrides: Overrides) {
  return render(
    <GuideLodgingViews
      view="practical"
      lodging={{ ...demoLodging, practicalCards: [], ...overrides }}
      onNavigate={jest.fn()}
    />,
  )
}

describe('038 AC — practical view: emergencies, house rules, useful numbers', () => {
  it('always shows the hard-coded French emergency numbers', () => {
    renderPractical({ houseRules: [], usefulNumbers: [] })

    expect(screen.getByRole('heading', { name: 'Urgences' })).toBeInTheDocument()
    expect(screen.getByText('112')).toBeInTheDocument()
    expect(screen.getByText('Pompiers')).toBeInTheDocument()
  })

  it('renders the house rules (règlement intérieur) when present', () => {
    renderPractical({
      houseRules: ['Non-fumeur', 'Animaux sur demande'],
      usefulNumbers: [],
    })

    expect(
      screen.getByRole('heading', { name: 'Règlement intérieur' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Non-fumeur')).toBeInTheDocument()
    expect(screen.getByText('Animaux sur demande')).toBeInTheDocument()
  })

  it('renders owner useful numbers, formatted and tappable to call', () => {
    renderPractical({
      houseRules: [],
      usefulNumbers: [{ label: 'Office de tourisme', number: '0450477608' }],
    })

    expect(
      screen.getByRole('heading', { name: 'Numéros utiles' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Office de tourisme')).toBeInTheDocument()
    // 0450477608 → +33 4 50 47 76 08
    expect(screen.getByText('+33 4 50 47 76 08')).toBeInTheDocument()

    const link = screen.getByRole('link', { name: /Office de tourisme/i })
    expect(link).toHaveAttribute('href', 'tel:+33450477608')
  })

  it('keeps emergency short codes tappable without +33 reformatting', () => {
    renderPractical({ houseRules: [], usefulNumbers: [] })

    const link = screen.getByRole('link', { name: /Pompiers/i })
    expect(link).toHaveAttribute('href', 'tel:18')
    expect(screen.getByText('112')).toBeInTheDocument()
  })

  it('hides the house-rules and useful-numbers blocks when empty (urgences stays)', () => {
    renderPractical({ houseRules: [], usefulNumbers: [] })

    expect(
      screen.queryByRole('heading', { name: 'Règlement intérieur' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('heading', { name: 'Numéros utiles' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Urgences' })).toBeInTheDocument()
  })
})
