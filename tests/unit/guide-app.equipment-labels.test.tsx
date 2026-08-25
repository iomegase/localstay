/** @jest-environment jsdom */

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fireEvent, render, screen } from '@testing-library/react'
import { GuideLodgingTabs } from '@/features/guide-app/components/GuideLodgingTabs'
import { GuideLodgingViews } from '@/features/guide-app/components/GuideLodgingViews'
import { demoLodging } from '@/features/guide-demo/demo-guide-data'

describe('036 BR-07 — libellés Équipements', () => {
  it('renames the rules tab without changing its internal view', () => {
    const onNavigate = jest.fn()
    render(<GuideLodgingTabs view="rules" onNavigate={onNavigate} />)

    const equipmentTab = screen.getByRole('button', { name: 'Équipements' })
    expect(equipmentTab).toHaveAttribute('aria-current', 'page')
    expect(equipmentTab.querySelector('.lucide-house-plug')).toBeInTheDocument()
    fireEvent.click(equipmentTab)
    expect(onNavigate).toHaveBeenCalledWith('rules')
  })

  it.each([
    [0, '0 équipements'],
    [1, '1 équipement'],
    [2, '2 équipements'],
  ])('shows %s practical cards as %s on the lodging hub', (count, label) => {
    const onNavigate = jest.fn()
    render(
      <GuideLodgingViews
        view="lodging"
        lodging={{
          ...demoLodging,
          houseRules: ['Règle 1', 'Règle 2', 'Règle 3'],
          practicalCards: Array.from({ length: count }, (_, index) => ({
            id: `equipment-${index}`,
            title: `Équipement ${index}`,
            description: 'Description',
            icon: 'info',
          })),
        }}
        onNavigate={onNavigate}
      />,
    )

    const equipmentLink = screen.getByRole('button', {
      name: new RegExp(`Équipements.*${label}`, 'i'),
    })
    expect(equipmentLink.querySelector('.lucide-house-plug')).toBeInTheDocument()
    expect(screen.queryByText('3 règles')).not.toBeInTheDocument()
    fireEvent.click(equipmentLink)
    expect(onNavigate).toHaveBeenCalledWith('rules')
  })

  it('keeps the canonical rules route unchanged', () => {
    const source = readFileSync(
      join(process.cwd(), 'src/features/guide-app/components/PrivateGuidePage.tsx'),
      'utf8',
    )
    expect(source).toContain("rules: '/sejour/logement/consignes'")
  })

  it('uses HousePlug in the equipment page header', () => {
    const { container } = render(
      <GuideLodgingViews
        view="rules"
        lodging={{ ...demoLodging, houseRules: [], practicalCards: [] }}
        onNavigate={jest.fn()}
      />,
    )
    expect(container.querySelectorAll('.lucide-house-plug')).toHaveLength(2)
  })

  it('does not count recycling cards as equipment', () => {
    render(
      <GuideLodgingViews
        view="lodging"
        lodging={{
          ...demoLodging,
          practicalCards: [
            {
              id: 'television',
              title: 'Télévision',
              description: 'Smart TV',
              icon: 'tv',
            },
            {
              id: 'waste',
              title: 'Tri des déchets',
              description: 'Consignes de tri',
              icon: 'recycle',
            },
          ],
        }}
        onNavigate={jest.fn()}
      />,
    )

    expect(
      screen.getByRole('button', { name: /Équipements.*1 équipement/i }),
    ).toBeInTheDocument()
  })
})
