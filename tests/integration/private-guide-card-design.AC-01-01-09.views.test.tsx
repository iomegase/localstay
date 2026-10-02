/** @jest-environment jsdom */

import type { ComponentProps } from 'react'
import { fireEvent, render, screen, within } from '@testing-library/react'
import { GuidePracticalView } from '@/features/guide-app/components/GuidePracticalView'
import { GuideHouseGuide } from '@/features/guide-app/components/stay/GuideHouseGuide'
import { GUIDE_CARD } from '@/features/guide-app/components/GuideCard'
import { FRENCH_EMERGENCY_NUMBERS } from '@/features/guide-app/lib/emergency-numbers'

type Lodging = ComponentProps<typeof GuidePracticalView>['lodging']

const lodging: Lodging = {
  id: 'lodging-fixture',
  name: 'Chalet Test',
  city: 'saint-gervais-les-bains',
  tagline: 'Chalet de test',
  coverImage: '/cover.jpg',
  gallery: [],
  latitude: 45.89,
  longitude: 6.71,
  addressLabel: '12 chemin des Sapins, 74170 Saint-Gervais-les-Bains',
  checkIn: '16:00',
  checkOut: '10:00',
  wifiName: 'Chalet-Wifi',
  wifiPassword: 'Sapins-2026',
  arrivalInstructions: [
    {
      title: 'Arrivée', text: 'Rendez-vous devant la **porte**.', videoUrl: null, photos: ['/p1.jpg'],
      kind: 'address', tip: null, substeps: [], facts: [],
    },
  ],
  departureInstructions: ['Fermer les fenêtres.', 'Éteindre les lumières.'],
  houseRules: ['Non-fumeur', 'Calme après 22 h'],
  practicalCards: [
    { id: 'tv', title: 'Télévision', description: 'Smart TV du séjour.', icon: 'tv' },
    { id: 'spa', title: 'Spa', description: 'Voir la vidéo.', icon: 'bath', photoUrl: '/spa.jpg' },
    { id: 'plumber', title: 'Plombier', description: 'En cas de fuite.', icon: 'wrench', phone: '0450000000' },
    { id: 'waste', title: 'Tri des déchets', description: 'Verre au conteneur vert.', icon: 'recycle' },
  ],
  usefulNumbers: [{ label: 'Office de tourisme', number: '0450477608' }],
  trashBins: [{ type: 'jaune' }, { type: 'verte' }],
  trashLocation: 'https://maps.app.goo.gl/abc',
  keyBoxCode: null,
  stats: { guests: null, bedrooms: null, surfaceM2: null },
}

const CARD_CLASSES = GUIDE_CARD.split(' ')

// Spec 054 : seule la vue « Infos pratiques » garde le design de cartes 050 ;
// arrivée, guide logement et départ suivent le handoff (tests private-guide-stay.*).
function renderPractical(overrides: Partial<Lodging> = {}) {
  const { container } = render(
    <GuidePracticalView lodging={{ ...lodging, ...overrides }} onBack={jest.fn()} />,
  )
  return container
}

function expectGuideCard(element: Element) {
  expect(element).toHaveAttribute('data-guide-card', 'true')
  expect(element).toHaveClass(...CARD_CLASSES)
  expect(element.parentElement?.closest('[data-guide-card]')).toBeNull()
}

describe('050 private guide card design', () => {
  it('AC-01-01 / BR-01 uses white shadowed cards with black text, flat, on every tab and header', () => {
    expect(CARD_CLASSES).toEqual(expect.arrayContaining(['bg-white', 'text-slate-900']))
    expect(GUIDE_CARD).toMatch(/shadow-/)

    const container = renderPractical()
    const cards = Array.from(container.querySelectorAll('[data-guide-card]'))
    expect(cards.length).toBeGreaterThan(1)
    cards.forEach(expectGuideCard)
    // Aucun texte blanc sur fond blanc : seul le contenu des pastilles colorées reste blanc.
    const whiteText = Array.from(container.querySelectorAll('[data-guide-card] [class*="text-white"]'))
      .filter(element => !element.closest('[data-guide-pastille]'))
    expect(whiteText).toEqual([])
    container.querySelectorAll('[data-guide-pastille]').forEach(pastille => {
      expect(pastille).toHaveClass('text-white')
    })
  })

  it('AC-01-02 hides section titles outside cards in Infos pratiques', () => {
    renderPractical()
    for (const name of ['Urgences', 'Numéros utiles', 'Tri des déchets']) {
      const heading = screen
        .getAllByRole('heading', { level: 2, name })
        .find(element => element.classList.contains('sr-only'))
      expect(heading).toBeDefined()
    }
  })

  it('AC-01-04 copies the Wi-Fi password from the light box', async () => {
    const writeText = jest.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true })
    renderPractical()

    const wifi = screen.getByTestId('guide-practical-wifi')
    expectGuideCard(wifi)
    expect(within(wifi).getByText('Chalet-Wifi')).toBeInTheDocument()
    const copy = within(wifi).getByRole('button', { name: /Copier le mot de passe Wi-Fi/ })
    expect(copy).toHaveClass('bg-slate-100')
    expect(copy).toHaveTextContent('Tapoter pour copier')

    fireEvent.click(copy)
    expect(writeText).toHaveBeenCalledWith('Sapins-2026')
    expect(await within(wifi).findByText('Copié')).toBeInTheDocument()
  })

  it('AC-01-05 shows a single 112 emergency card', () => {
    expect(FRENCH_EMERGENCY_NUMBERS.map(item => item.number)).toEqual(['112'])
    renderPractical()

    const emergencies = screen.getAllByTestId('guide-practical-emergency')
    expect(emergencies).toHaveLength(1)
    expectGuideCard(emergencies[0])
    expect(emergencies[0]).toHaveAttribute('href', 'tel:112')
    expect(screen.queryByText('114')).not.toBeInTheDocument()
  })

  it('AC-01-06 renders each useful number as a tel: card link', () => {
    renderPractical()

    const useful = screen.getAllByTestId('guide-practical-useful-number')
    expect(useful).toHaveLength(1)
    expectGuideCard(useful[0])
    expect(useful[0]).toHaveAttribute('href', 'tel:+33450477608')
    expect(useful[0]).toHaveTextContent(/Office de tourisme.*\+33 4 50 47 76 08/)
  })

  it('AC-01-07 drops trash bin rows, keeps recycle text and one Point de tri card', () => {
    renderPractical()

    expect(screen.queryByText(/Poubelle/)).not.toBeInTheDocument()
    expect(screen.getByText('Verre au conteneur vert.')).toBeInTheDocument()

    const points = screen.getAllByTestId('guide-practical-trash-location')
    expect(points).toHaveLength(1)
    expectGuideCard(points[0])
    expect(points[0]).toHaveTextContent('Point de tri')
    expect(points[0]).toHaveAttribute('href', 'https://maps.app.goo.gl/abc')
  })

  it('AC-01-07 falls back to a city search when no trash location is set', () => {
    renderPractical({ trashLocation: null })

    expect(screen.getByTestId('guide-practical-trash-location')).toHaveAttribute(
      'href',
      'https://www.google.com/maps/search/?api=1&query=point%20de%20tri%20saint%20gervais%20les%20bains',
    )
  })

  it('054 AC-04-01 keeps equipment media and phone actions in the house guide', () => {
    render(<GuideHouseGuide lodging={lodging} onBack={jest.fn()} />)

    const blocks = screen.getAllByTestId('guide-equipment')
    expect(blocks.map(block => within(block).getByRole('heading', { level: 3 }).textContent)).toEqual([
      'Télévision',
      'Spa',
      'Plombier',
    ])
    fireEvent.click(within(blocks[1]).getByRole('button', { name: 'Voir — Spa' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(within(blocks[2]).getByRole('link', { name: /0450000000/ })).toHaveAttribute(
      'href',
      'tel:0450000000',
    )
  })
})
