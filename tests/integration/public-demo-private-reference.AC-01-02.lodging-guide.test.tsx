/** @jest-environment jsdom */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { DemoGuideApp } from '@/features/guide-demo/components/DemoGuideApp'

function renderLodgingGuide() {
  render(<DemoGuideApp />)
  fireEvent.click(screen.getByRole('button', { name: 'Guide logement' }))
  return screen.getByTestId('demo-lodging-guide')
}

describe('045-public-demo-private-guide-reference lodging guide', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/concept')
  })

  it('A. renders the lodging hero, stay facts and sections in reference order', () => {
    const guide = renderLodgingGuide()
    const hero = within(guide).getByTestId('demo-lodging-hero')

    expect(guide).toHaveClass('overflow-x-hidden', 'pb-32')
    expect(hero).toHaveClass('relative', 'min-h-[410px]', 'rounded-[32px]')
    expect(
      within(hero).getByText('Votre guide de séjour'),
    ).toBeInTheDocument()
    expect(
      within(hero).getByRole('heading', { level: 1, name: 'Le 305' }),
    ).toBeInTheDocument()
    expect(within(hero).getByText('Saint-Gervais-les-Bains')).toBeInTheDocument()
    expect(within(hero).getByText('4')).toBeInTheDocument()
    expect(within(hero).getByText('Voyageurs')).toBeInTheDocument()
    expect(within(hero).getByText('2')).toBeInTheDocument()
    expect(within(hero).getByText('Chambres')).toBeInTheDocument()
    expect(within(hero).getByText('62 m²')).toBeInTheDocument()

    const arrival = within(guide).getByTestId('arrival-fact')
    const departure = within(guide).getByTestId('departure-fact')
    expect(within(arrival).getByText('Arrivée')).toBeInTheDocument()
    expect(within(arrival).getByText('16:00')).toBeInTheDocument()
    expect(within(departure).getByText('Départ')).toBeInTheDocument()
    expect(within(departure).getByText('10:00')).toBeInTheDocument()

    const sections = within(guide).getAllByTestId('demo-lodging-section')
    expect(
      sections.map(section => within(section).getByRole('button').textContent),
    ).toEqual([
      'Accéder au logementAdresse, vidéo, accès et Wi-Fi',
      'Découvrir le logementÉquipements, règlement et services',
      'Infos pratiquesUrgences et numéros utiles',
      'DépartConsignes et tri des déchets',
    ])
  })

  it('B. exposes a single-open accessible accordion and local demo media', () => {
    const guide = renderLodgingGuide()
    const accessButton = within(guide).getByRole('button', {
      name: /Accéder au logement/,
    })
    const discoverButton = within(guide).getByRole('button', {
      name: /Découvrir le logement/,
    })

    for (const button of within(guide).getAllByRole('button', {
      name: /Accéder au logement|Découvrir le logement|Infos pratiques|Départ/,
    })) {
      expect(button).toHaveAttribute('aria-expanded', 'false')
      const controls = button.getAttribute('aria-controls')
      expect(controls).not.toBeNull()
      const panel = document.getElementById(controls ?? '')
      expect(panel).toHaveAttribute('role', 'region')
      expect(panel).toHaveAttribute('aria-labelledby', button.id)
      expect(panel).toHaveAttribute('hidden')
    }

    fireEvent.click(accessButton)
    expect(accessButton).toHaveAttribute('aria-expanded', 'true')
    const accessRegion = within(guide).getByRole('region', {
      name: /Accéder au logement/,
    })
    expect(accessRegion).toBeVisible()
    expect(
      within(accessRegion).getByText(
        'Résidence de démonstration, centre de Saint-Gervais',
      ),
    ).toBeInTheDocument()
    expect(within(accessRegion).getByText('Avant votre arrivée')).toBeInTheDocument()
    expect(within(accessRegion).getByText('Rejoindre le quartier')).toBeInTheDocument()
    expect(within(accessRegion).getByText('Découvrir le logement')).toBeInTheDocument()
    expect(within(accessRegion).getByText('MyStay-Demo')).toBeInTheDocument()
    expect(within(accessRegion).getByText('Exemple-Non-Reel')).toBeInTheDocument()
    expect(within(accessRegion).getAllByText(/fictif/i)).toHaveLength(4)

    const mediaButton = within(accessRegion).getByRole('button', {
      name: 'Vidéo de présentation (démonstration)',
    })
    expect(mediaButton).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(mediaButton)
    expect(mediaButton).toHaveAttribute('aria-expanded', 'true')
    const mediaPanel = within(accessRegion).getByRole('region', {
      name: 'Vidéo de présentation (démonstration)',
    })
    expect(
      within(mediaPanel).getByText(/aucun média d’accès privé n’est publié/i),
    ).toBeInTheDocument()
    expect(within(mediaPanel).getByRole('img')).toBeInTheDocument()

    fireEvent.click(discoverButton)
    expect(accessButton).toHaveAttribute('aria-expanded', 'false')
    expect(accessRegion).toHaveAttribute('hidden')
    expect(discoverButton).toHaveAttribute('aria-expanded', 'true')
    const discoverRegion = within(guide).getByRole('region', {
      name: /Découvrir le logement/,
    })
    expect(within(discoverRegion).getByText('Télévision')).toBeInTheDocument()
    expect(within(discoverRegion).getByText('Chauffage')).toBeInTheDocument()
    expect(within(discoverRegion).getByText('Cuisine équipée')).toBeInTheDocument()
    expect(
      within(discoverRegion).getByRole('heading', { name: 'Règlement' }),
    ).toBeInTheDocument()
    expect(within(discoverRegion).getAllByRole('listitem')).toHaveLength(3)
  })

  it('C. renders public practical numbers and an interactive departure checklist', () => {
    const guide = renderLodgingGuide()

    fireEvent.click(
      within(guide).getByRole('button', { name: /Infos pratiques/ }),
    )
    const practicalRegion = within(guide).getByRole('region', {
      name: /Infos pratiques/,
    })
    expect(within(practicalRegion).getByText('112')).toBeInTheDocument()
    expect(within(practicalRegion).getByText('15')).toBeInTheDocument()
    expect(within(practicalRegion).getByText('18')).toBeInTheDocument()
    expect(within(practicalRegion).getByText('Office de tourisme')).toBeInTheDocument()
    expect(within(practicalRegion).getByText('04 50 47 76 08')).toBeInTheDocument()

    fireEvent.click(within(guide).getByRole('button', { name: /^Départ/ }))
    const departureRegion = within(guide).getByRole('region', {
      name: /^Départ/,
    })
    const checklist = within(departureRegion).getByRole('group', {
      name: 'Checklist de départ',
    })
    const checkboxes = within(checklist).getAllByRole('checkbox')
    expect(checkboxes).toHaveLength(9)
    expect(within(checklist).getByText('0 / 9')).toBeInTheDocument()

    fireEvent.click(checkboxes[0])
    expect(checkboxes[0]).toBeChecked()
    expect(within(checklist).getByText('1 / 9')).toBeInTheDocument()

    fireEvent.click(checkboxes[1])
    expect(checkboxes[1]).toBeChecked()
    expect(within(checklist).getByText('2 / 9')).toBeInTheDocument()
    expect(
      within(checklist).getByRole('progressbar').firstElementChild,
    ).toHaveClass('w-[22.222%]')

    expect(within(departureRegion).getByText('Poubelle jaune')).toBeInTheDocument()
    expect(within(departureRegion).getByText('Poubelle verte')).toBeInTheDocument()
    expect(within(departureRegion).getByText('Poubelle bordeaux')).toBeInTheDocument()
    expect(
      within(departureRegion).getByText(
        'Emballages & papiers recyclables',
      ),
    ).toBeInTheDocument()
    expect(within(departureRegion).getByText('Verre')).toBeInTheDocument()
    expect(within(departureRegion).getByText('Ordures ménagères')).toBeInTheDocument()
    expect(
      within(departureRegion).getByText(
        'Point de tri public du centre de Saint-Gervais',
      ),
    ).toBeInTheDocument()
  })

  it('D. keeps lodging interactions local without anchors, forms or URL changes', () => {
    const guide = renderLodgingGuide()

    fireEvent.click(
      within(guide).getByRole('button', { name: /Accéder au logement/ }),
    )
    fireEvent.click(
      within(guide).getByRole('button', {
        name: 'Vidéo de présentation (démonstration)',
      }),
    )
    fireEvent.click(within(guide).getByRole('button', { name: /^Départ/ }))
    fireEvent.click(within(guide).getAllByRole('checkbox')[0])

    expect(guide.querySelectorAll('a')).toHaveLength(0)
    expect(guide.querySelectorAll('form')).toHaveLength(0)
    expect(window.location.pathname).toBe('/concept')
  })
})
