/** @jest-environment jsdom */

import { fireEvent, render, screen, within } from '@testing-library/react'

const mockListSeminarLodgings = jest.fn()
jest.mock('@/features/lodging-showcase/queries/seminar-lodgings', () => ({
  listSeminarLodgings: (...args: unknown[]) => mockListSeminarLodgings(...args),
}))
jest.mock('@/features/guide-demo/components/GuideDemoPhoneButton', () => ({
  GuideDemoPhoneButton: () => null,
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
    const ctas = screen.getAllByRole('button', { name: 'Recevoir une proposition' })
    expect(ctas).toHaveLength(2)
    fireEvent.click(ctas[1])
    const dialog = screen.getByRole('dialog', { name: 'Recevoir une proposition' })
    expect(dialog).toHaveTextContent('dans le Pays du Mont-Blanc')
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
