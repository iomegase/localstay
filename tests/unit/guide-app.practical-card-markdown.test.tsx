/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import { GuideLodgingViews } from '@/features/guide-app/components/GuideLodgingViews'
import { demoLodging } from '@/features/guide-demo/demo-guide-data'

jest.mock('@/features/guide-app/components/GuideDarkMarkdown', () => ({
  GuideDarkMarkdown: ({ source }: { source: string }) => (
    <div data-testid="guide-dark-markdown">{source}</div>
  ),
}))

describe('BR-23 — Markdown des blocs pratiques privés', () => {
  it('uses the secured Markdown renderer for every practical-card variant', () => {
    const descriptions = [
      'Un **sèche-cheveux** est disponible.',
      '- Télévision\n- Chromecast',
      'Appelez *si nécessaire*.',
      'Triez les **emballages**.',
    ]

    render(
      <GuideLodgingViews
        view="rules"
        lodging={{
          ...demoLodging,
          houseRules: [],
          practicalCards: [
            {
              id: 'standard',
              title: 'Salle de bain',
              description: descriptions[0],
              icon: 'bath',
            },
            {
              id: 'media',
              title: 'Télévision',
              description: descriptions[1],
              icon: 'tv',
              photoUrl: '/tv.jpg',
            },
            {
              id: 'phone',
              title: 'Assistance',
              description: descriptions[2],
              icon: 'phone',
              phone: '0450000000',
            },
            {
              id: 'recycle',
              title: 'Recyclage',
              description: descriptions[3],
              icon: 'recycle',
            },
          ],
        }}
        onNavigate={jest.fn()}
      />,
    )

    expect(
      screen.getAllByTestId('guide-dark-markdown').map(node => node.textContent),
    ).toEqual(descriptions)
  })
})
