/** @jest-environment jsdom */
import { fireEvent, render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { publicLocalLanding } from '../fixtures/public-local-landing'
import { listSeminarLodgings } from '@/features/lodging-showcase/queries/seminar-lodgings'
import { getPublishedLocalLanding } from '@/features/local-seo/queries/landing-pages'
import { listPublicSeminarActivities } from '@/features/seminar-activities/queries/public'
import { SeminarActivityMenu } from '@/features/seminar-activities/components/SeminarActivityMenu'
import SeminarsPage from '@/app/(public)/seminaires/page'
import SeminarCityPage from '@/app/(public)/seminaires/[city-slug]/page'
import type { PublicSeminarActivity } from '@/features/seminar-activities/types'

jest.mock('@/features/lodging-showcase/queries/seminar-lodgings', () => ({ listSeminarLodgings: jest.fn() }))
jest.mock('@/features/seminar-activities/queries/public', () => ({ listPublicSeminarActivities: jest.fn() }))
jest.mock('@/features/local-seo/queries/landing-pages', () => ({ getPublishedLocalLanding: jest.fn(), listPublishedLocalLandingSummaries: jest.fn().mockResolvedValue([]) }))
jest.mock('next/navigation', () => ({ usePathname: () => '/seminaires', notFound: () => { throw new Error('NEXT_NOT_FOUND') } }))

const activities: PublicSeminarActivity[] = [
  { id: 'a1', title: 'Rafting', category: 'SUMMER', description: 'Une descente en eaux vives.', season_label: 'Printemps, été', level_label: 'Modéré à sportif', image_url: 'https://x.supabase.co/rafting.webp' },
  { id: 'a2', title: 'Yoga au chalet', category: 'WELLBEING', description: 'Une parenthèse de détente.', season_label: 'Toute l’année', level_label: 'Tous niveaux', image_url: 'https://x.supabase.co/yoga.webp' },
]

beforeEach(() => {
  jest.clearAllMocks()
  jest.mocked(listSeminarLodgings).mockResolvedValue([])
  jest.mocked(listPublicSeminarActivities).mockResolvedValue(activities)
})

describe('spec 097 US-06 — section « Le menu d’activités »', () => {
  it('affiche les cartes vitrine dans l’ordre, avec catégorie, saison et niveau', () => {
    render(<SeminarActivityMenu activities={activities} />)
    const section = screen.getByRole('region', { name: 'Le menu d’activités.' })
    expect(within(section).getByText(/nous\s+composons avec nos partenaires locaux/)).toBeInTheDocument()
    const cards = within(section).getAllByRole('article')
    expect(cards.map(card => within(card).getByRole('heading').textContent)).toEqual(['Rafting', 'Yoga au chalet'])
    expect(within(cards[0]!).getByText('Été')).toBeInTheDocument()
    expect(within(cards[0]!).getByText('Printemps, été')).toHaveClass('sr-only')
    expect(within(cards[0]!).getByText('Modéré à sportif')).toBeInTheDocument()
  })

  it('pied de carte : seules les saisons de l’activité, précision affichée', () => {
    render(<SeminarActivityMenu activities={[...activities, { ...activities[0]!, id: 'a3', title: 'Biathlon', season_label: 'Toute l’année selon la formule' }, { ...activities[0]!, id: 'a4', title: 'Glacier', season_label: 'Selon conditions' }]} />)
    const [rafting, , biathlon, glacier] = screen.getAllByRole('article')
    const states = (card: HTMLElement) => [...card.querySelectorAll('[data-season]')].map(icon => icon.getAttribute('data-season'))
    expect(states(rafting!)).toEqual(['spring', 'summer'])
    expect(states(biathlon!)).toEqual(['winter', 'spring', 'summer', 'autumn'])
    expect(within(biathlon!).getByText('selon la formule')).toBeInTheDocument()
    expect(states(glacier!)).toEqual([])
    expect(within(glacier!).getByText('Selon conditions')).toBeVisible()
  })

  it('AC-05 / AC-06 : aucune mention de prix, de devis, de prestataire, aucun lien ; aucun bouton sur les cartes', () => {
    render(<SeminarActivityMenu activities={activities} />)
    const section = screen.getByRole('region', { name: 'Le menu d’activités.' })
    expect(section.textContent).not.toMatch(/€|prix|devis|tarif|HT|TTC|prestataire/i)
    expect(within(section).queryAllByRole('link')).toHaveLength(0)
    // Seuls les filtres de catégorie sont des boutons ; aucune carte n'en contient.
    for (const card of within(section).getAllByRole('article')) expect(within(card).queryAllByRole('button')).toHaveLength(0)
  })

  it('affiche 6 cartes puis révèle les suivantes avec « Voir plus »', () => {
    const many = Array.from({ length: 8 }, (_, index) => ({ ...activities[0]!, id: `m${index}`, title: `Activité ${index + 1}` }))
    render(<SeminarActivityMenu activities={many} />)
    expect(screen.getAllByRole('article')).toHaveLength(6)
    const more = screen.getByRole('button', { name: 'Voir plus d’activités (2)' })
    expect(more).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(more)
    expect(screen.getAllByRole('article').map(card => within(card).getByRole('heading').textContent)).toEqual(many.map(item => item.title))
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('pas de bouton « Voir plus » avec 6 cartes ou moins', () => {
    render(<SeminarActivityMenu activities={Array.from({ length: 6 }, (_, index) => ({ ...activities[0]!, id: `s${index}` }))} />)
    expect(screen.getAllByRole('article')).toHaveLength(6)
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('sous-menu : catégories non vides seulement, filtre et limite réappliquée', () => {
    const many = [
      ...Array.from({ length: 7 }, (_, index) => ({ ...activities[0]!, id: `s${index}`, title: `Été ${index}` })),
      { ...activities[1]!, id: 'w1', title: 'Yoga' },
    ]
    render(<SeminarActivityMenu activities={many} />)
    const menu = screen.getByRole('group', { name: 'Filtrer les activités par catégorie' })
    expect(within(menu).getAllByRole('button').map(button => button.textContent)).toEqual(['Toutes', 'Été', 'Bien-être'])
    expect(within(menu).getByRole('button', { name: 'Toutes' })).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(within(menu).getByRole('button', { name: 'Bien-être' }))
    expect(screen.getAllByRole('article').map(card => within(card).getByRole('heading').textContent)).toEqual(['Yoga'])
    expect(screen.queryByRole('button', { name: /Voir plus/ })).not.toBeInTheDocument()

    fireEvent.click(within(menu).getByRole('button', { name: 'Été' }))
    expect(screen.getAllByRole('article')).toHaveLength(6)
    expect(screen.getByRole('button', { name: 'Voir plus d’activités (1)' })).toBeInTheDocument()
  })

  it('sous-menu absent quand une seule catégorie est représentée', () => {
    render(<SeminarActivityMenu activities={[activities[0]!]} />)
    expect(screen.queryByRole('group')).not.toBeInTheDocument()
  })

  it('BR-12 : section absente sans carte', () => {
    const { container } = render(<SeminarActivityMenu activities={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})

describe('spec 097 AC-09 / AC-10 — surfaces séminaire', () => {
  it('page globale : lit la surface hub et place la section après les formats', async () => {
    render(await SeminarsPage())
    expect(listPublicSeminarActivities).toHaveBeenCalledWith(null)
    const formats = screen.getByText('Formats de séminaire')
    const menu = screen.getByRole('region', { name: 'Le menu d’activités.' })
    expect(formats.compareDocumentPosition(menu) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
  })

  it('landing : lit la surface de sa destination', async () => {
    const landing = publicLocalLanding('SEMINAR', { id: 'city-sg', slug: 'saint-gervais-les-bains', name: 'Saint-Gervais' })
    jest.mocked(getPublishedLocalLanding).mockResolvedValue(landing)
    const { container } = render(await SeminarCityPage({ params: Promise.resolve({ 'city-slug': 'saint-gervais-les-bains' }) }))
    expect(listPublicSeminarActivities).toHaveBeenCalledWith('destination-saint-gervais-les-bains')
    expect(screen.getByRole('heading', { name: 'Le menu d’activités.' })).toBeVisible()
    // AC-10 : aucune activité dans les données structurées.
    const jsonLd = [...container.querySelectorAll('script[type="application/ld+json"]')].map(script => script.textContent).join('')
    expect(jsonLd).not.toContain('Rafting')
  })

  it('landing non publiée : 404 sans lecture des activités', async () => {
    jest.mocked(getPublishedLocalLanding).mockResolvedValue(null)
    await expect(SeminarCityPage({ params: Promise.resolve({ 'city-slug': 'inactive' }) })).rejects.toThrow('NEXT_NOT_FOUND')
    expect(listPublicSeminarActivities).not.toHaveBeenCalled()
  })
})
