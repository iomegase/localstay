/** @jest-environment jsdom */

import { fireEvent, render, screen, within } from '@testing-library/react'

const mockListSeminarLodgings = jest.fn()
// Spec 097 : menu d'activités séminaire, vide dans ces tests.
jest.mock('@/features/seminar-activities/queries/public', () => ({ listPublicSeminarActivities: jest.fn().mockResolvedValue([]) }))
jest.mock('@/features/lodging-showcase/queries/seminar-lodgings', () => ({
  listSeminarLodgings: (...args: unknown[]) => mockListSeminarLodgings(...args),
}))
import SeminarsPage, { metadata } from '@/app/(public)/seminaires/page'

const chalet = {
  id: 'l1', slug: 'le-chalet-remy', title: 'Le Chalet Rémy', href: '/logements/le-chalet-remy',
  coverPhotoUrl: null, location: 'Saint-Gervais-les-Bains', city: 'Saint-Gervais-les-Bains',
  surfaceM2: 590, maxGuests: 26,
}

async function renderPage() {
  mockListSeminarLodgings.mockResolvedValue([chalet])
  return render(await SeminarsPage())
}

describe('031 AC-01-09 — /seminaires content', () => {
  it('fixes the SEO title (no doubled « MyStay ») and keeps the keyword', () => {
    expect(metadata.title).toBe('Séminaire d’entreprise en Haute-Savoie, au pied du Mont-Blanc')
    expect(String(metadata.description)).toContain('jusqu’à 26 personnes')
  })

  it('has a keyword H1, proof pills and no repeated taglines', async () => {
    const { container } = await renderPage()

    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Votre séminaire face au Mont-Blanc.')
    const facts = screen.getByTestId('seminar-hero-facts')
    for (const fact of ['Réponse sous 48 h', 'Jusqu’à 26 personnes en chalet', 'Proposition sur mesure, sans engagement']) {
      expect(facts).toHaveTextContent(fact)
    }
    const main = container.textContent ?? ''
    expect(main).not.toContain('Un seul interlocuteur')
    expect(main.split('Prendre de la hauteur').length - 1).toBeLessThanOrEqual(1)
    expect(main).not.toContain('chalets chaleureux')
    expect(main).toContain('guide digital du séjour')
  })

  it('replaces every mailto CTA with buttons opening the seminar lead modal', async () => {
    const { container } = await renderPage()

    expect(container.querySelector('main a[href^="mailto:"]')).toBeNull()
    expect(screen.queryByRole('link', { name: 'Échanger sur mon projet' })).not.toBeInTheDocument()
    // Bandeau du haut, trois cartes « Formats » et bloc final (libellé du 2026-10-14).
    const ctas = screen.getAllByRole('button', { name: 'Demander une estimation' })
    expect(ctas).toHaveLength(5)
    fireEvent.click(ctas[4])
    const dialog = screen.getByRole('dialog', { name: 'Demander une estimation' })
    expect(dialog).toHaveTextContent('dans le Pays du Mont-Blanc')
  })

  it('never bills the company from MyStay: owner bills the chalet, providers bill directly', async () => {
    const { container } = await renderPage()
    const main = container.querySelector('main')!.textContent ?? ''

    expect(main).toContain('La location du chalet vous est facturée par son propriétaire.')
    expect(main).toContain('devis du chalet établi par son propriétaire')
    expect(main).not.toMatch(/MyStay vous facture|frais de coordination/i)
    expect(main).toContain('facturés directement par chaque prestataire')
    expect(main).not.toMatch(/devis global|devis unique|facture unique|tout compris/i)
  })

  it('develops each seminar format: key facts, inclusions, typical day and a quote button', async () => {
    await renderPage()

    for (const [title, facts, inclusion, evening] of [
      ['Comité de direction', '6 à 12 personnes · 1 à 2 nuits', 'Chalet privatisé, sans autre groupe sur place', 'Dîner au chalet préparé par un chef'],
      ['Séminaire résidentiel', '12 à 26 personnes · 2 à 3 nuits', 'Hébergement de toute l’équipe sous le même toit', 'Dîner partagé et temps libre au chalet'],
      ['Retraite d’équipe', '8 à 20 personnes · 2 à 4 nuits', 'Temps de travail allégés, en matinée ou en demi-journée', 'Thermes, puis repas partagé'],
    ] as const) {
      const card = screen.getByRole('heading', { level: 3, name: title }).closest('article')!
      expect(card).toHaveTextContent(facts)
      const [inclusions, day] = within(card).getAllByRole('list')
      expect(within(inclusions).getAllByRole('listitem')).toHaveLength(3)
      expect(inclusions).toHaveTextContent(inclusion)
      expect(within(card).getByRole('heading', { level: 4, name: 'Journée type' })).toBeInTheDocument()
      expect(within(day).getAllByRole('listitem').map(item => item.textContent?.split(' — ')[0])).toEqual([
        'Matin', 'Après-midi', 'Soirée',
      ])
      expect(day).toHaveTextContent(evening)
      expect(within(card).getByRole('button', { name: 'Demander une estimation' })).toBeInTheDocument()
    }

    const card = screen.getByRole('heading', { level: 3, name: 'Séminaire résidentiel' }).closest('article')!
    fireEvent.click(within(card).getByRole('button', { name: 'Demander une estimation' }))
    expect(screen.getByRole('dialog', { name: 'Demander une estimation' })).toBeInTheDocument()
  })

  it('shows the lodgings block, a six-question two-column FAQ and the final call to action', async () => {
    await renderPage()

    expect(screen.getByRole('heading', { level: 2, name: 'Votre chalet de séminaire.' })).toBeInTheDocument()
    const faq = screen.getByTestId('marketing-faq-section')
    expect(within(faq).getByRole('heading', { level: 2 })).toHaveTextContent('Vos questions, nos réponses.')
    expect(within(faq).getAllByRole('group')).toHaveLength(6)
    expect(screen.getByTestId('marketing-faq-items')).toHaveClass('md:grid-cols-2')
    expect(screen.getByRole('heading', { level: 2, name: 'Parlons de votre prochain séminaire.' })).toBeInTheDocument()
  })
})
