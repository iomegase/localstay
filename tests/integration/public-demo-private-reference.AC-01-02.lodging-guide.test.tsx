/** @jest-environment jsdom */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { DemoGuideApp } from '@/features/guide-demo/components/DemoGuideApp'

function renderLodgingGuide() {
  render(<DemoGuideApp />)
  fireEvent.click(screen.getByRole('button', { name: 'Guide logement' }))
  return screen.getByTestId('demo-lodging-guide')
}

describe('045-public-demo-private-guide-reference lodging guide', () => {
  beforeEach(() => window.history.replaceState({}, '', '/concept'))

  it('A. reproduces the private arrival page structure and visual tokens', () => {
    const guide = renderLodgingGuide()
    const tabs = within(guide).getByRole('navigation', {
      name: 'Catégories du livret',
    })

    expect(within(tabs).getAllByRole('button').map(button => button.textContent)).toEqual([
      'Accès',
      'Infos',
      'Équipements',
      'Départ',
    ])
    expect(within(tabs).getByRole('button', { name: 'Accès' })).toHaveAttribute(
      'aria-current',
      'page',
    )
    expect(within(guide).getByRole('heading', { level: 1, name: 'Bienvenue' })).toBeInTheDocument()
    expect(within(guide).getByRole('heading', { level: 2, name: 'Localisation' })).toBeInTheDocument()
    expect(within(guide).getByText('96 rue du Mont-Blanc')).toBeInTheDocument()
    expect(within(guide).getByText('74170 Saint-Gervais-les-Bains')).toBeInTheDocument()
    expect(within(guide).getByRole('link', { name: 'Maps' })).toBeInTheDocument()
    expect(within(guide).getByRole('heading', { level: 2, name: 'Instructions' })).toBeInTheDocument()
    expect(within(guide).queryByTestId('demo-lodging-hero')).not.toBeInTheDocument()

    expect(within(guide).getByTestId('demo-access-location')).toHaveClass('bg-slate-900')
    expect(within(guide).getByTestId('demo-access-instructions')).toHaveClass('bg-slate-900')
    const instructions = within(guide).getAllByTestId('demo-arrival-instruction')
    expect(instructions).toHaveLength(3)
    expect(instructions[0]).toHaveClass('bg-slate-800')
    expect(within(instructions[0]).getAllByRole('img').length).toBeGreaterThan(0)
  })

  it('B. switches between the same four lodging categories', () => {
    const guide = renderLodgingGuide()

    fireEvent.click(within(guide).getByRole('button', { name: 'Infos' }))
    expect(within(guide).getByRole('heading', { level: 1, name: 'Informations pratiques' })).toBeInTheDocument()
    expect(within(guide).getByText('MyStay-Le305')).toBeInTheDocument()

    fireEvent.click(within(guide).getByRole('button', { name: 'Équipements' }))
    expect(within(guide).getByRole('heading', { level: 1, name: 'Les Équipements' })).toBeInTheDocument()
    expect(within(guide).getByText('Télévision')).toBeInTheDocument()

    fireEvent.click(within(guide).getByRole('button', { name: 'Départ' }))
    expect(within(guide).getByRole('heading', { level: 1, name: 'Checklist du départ' })).toBeInTheDocument()
    expect(within(guide).getAllByRole('checkbox')).toHaveLength(9)
  })

  it('D. AC-01-07 shows the showcase address and real arrival instructions with media frames', () => {
    const guide = renderLodgingGuide()

    expect(within(guide).getByRole('link', { name: 'Maps' })).toHaveAttribute(
      'href',
      'https://www.google.com/maps/search/?api=1&query=96%20rue%20du%20Mont-Blanc%2C%2074170%20Saint-Gervais-les-Bains',
    )

    const instructions = within(guide).getAllByTestId('demo-arrival-instruction')
    expect(
      instructions.map(item => within(item).getByRole('heading', { level: 3 }).textContent),
    ).toEqual(['Le logement', 'Accès au logement', 'Le parking'])
    expect(guide).not.toHaveTextContent(/Exemple fictif/i)

    for (const instruction of instructions) {
      expect(within(instruction).getAllByTestId('demo-arrival-video-frame')).toHaveLength(1)
      expect(
        within(instruction).queryAllByRole('img').length +
          within(instruction).queryAllByTestId('demo-arrival-photo-frame').length,
      ).toBeGreaterThan(0)
    }
    expect(within(instructions[1]).getByText(/boîte à clés/i)).toBeInTheDocument()
    expect(guide.querySelectorAll('video')).toHaveLength(0)
  })

  it('E. AC-01-08 shows readable Wi-Fi, a single emergency and fictional useful numbers as home-style cards', () => {
    const guide = renderLodgingGuide()
    fireEvent.click(within(guide).getByRole('button', { name: 'Infos' }))

    const wifi = within(guide).getByTestId('demo-practical-wifi')
    expect(wifi).toHaveClass('rounded-[22px]', 'bg-slate-900', 'text-white')
    expect(within(wifi).getByText('MyStay-Le305')).toBeInTheDocument()
    expect(within(wifi).getByText('Le305-StGervais')).toBeInTheDocument()
    expect(wifi.innerHTML).not.toMatch(/text-black/)

    const emergencies = within(guide).getAllByTestId('demo-practical-emergency')
    expect(emergencies).toHaveLength(1)
    expect(emergencies[0]).toHaveTextContent('Secours')
    expect(emergencies[0]).toHaveTextContent('112')
    expect(guide).not.toHaveTextContent(/SAMU|Pompiers/)

    const useful = within(guide).getAllByTestId('demo-practical-useful-number')
    expect(useful.map(card => card.textContent)).toEqual([
      expect.stringMatching(/Conciergerie.*04 65 71 30 05/),
      expect.stringMatching(/Office de tourisme.*04 65 71 12 34/),
    ])
    for (const card of [wifi, ...emergencies, ...useful]) {
      expect(card).toHaveClass('rounded-[22px]', 'bg-slate-900')
    }
    expect(guide.querySelectorAll('a[href^="tel:"]')).toHaveLength(0)
  })

  it('F. AC-01-09 lays out equipments like the access page with photo and video frames', () => {
    const guide = renderLodgingGuide()
    fireEvent.click(within(guide).getByRole('button', { name: 'Équipements' }))

    const section = within(guide).getByTestId('demo-equipment-list')
    expect(section).toHaveClass('bg-slate-900')
    expect(within(section).getByRole('heading', { level: 2, name: 'Équipements' })).toBeInTheDocument()

    const items = within(section).getAllByTestId('demo-equipment-item')
    expect(
      items.map(item => within(item).getByRole('heading', { level: 3 }).textContent),
    ).toEqual(['Télévision', 'Chauffage', 'Cuisine équipée'])
    for (const item of items) {
      expect(item).toHaveClass('bg-slate-800')
      expect(within(item).getAllByTestId('demo-arrival-photo-frame').length).toBeGreaterThan(0)
      expect(within(item).getAllByTestId('demo-arrival-video-frame')).toHaveLength(1)
    }

    expect(within(guide).getByTestId('demo-house-rules')).toHaveClass('bg-slate-900')
    expect(guide).not.toHaveTextContent(/démonstration|à titre d[’']exemple/i)
    expect(guide.querySelectorAll('video')).toHaveLength(0)
  })

  it('G. AC-01-10 moves waste sorting to the Infos page with Infos-style cards', () => {
    const guide = renderLodgingGuide()
    fireEvent.click(within(guide).getByRole('button', { name: 'Infos' }))

    expect(
      within(guide).getAllByRole('heading', { level: 2 }).map(heading => heading.textContent),
    ).toEqual(['Wi-Fi', 'Urgences', 'Numéros utiles', 'Tri des déchets'])

    const bins = within(guide).getAllByTestId('demo-practical-trash-bin')
    expect(bins.map(bin => within(bin).getByText(/^Poubelle/).textContent)).toEqual([
      'Poubelle jaune',
      'Poubelle verte',
      'Poubelle bordeaux',
    ])
    const location = within(guide).getByTestId('demo-practical-trash-location')
    expect(location).toHaveTextContent('Point de tri')
    expect(location).toHaveTextContent('Point de tri public du centre de Saint-Gervais')
    for (const card of [...bins, location]) {
      expect(card).toHaveClass('rounded-[22px]', 'bg-slate-900', 'text-white')
    }

    fireEvent.click(within(guide).getByRole('button', { name: 'Départ' }))
    expect(within(guide).queryByText('Tri des déchets')).not.toBeInTheDocument()
    expect(within(guide).queryAllByTestId('demo-practical-trash-bin')).toHaveLength(0)
  })

  it('C. keeps the demo navigation on the public page', () => {
    const guide = renderLodgingGuide()
    fireEvent.click(within(guide).getByRole('button', { name: 'Infos' }))
    fireEvent.click(within(guide).getByRole('button', { name: 'Départ' }))
    fireEvent.click(within(guide).getAllByRole('checkbox')[0])

    expect(guide.querySelectorAll('form')).toHaveLength(0)
    expect(window.location.pathname).toBe('/concept')
  })
})
