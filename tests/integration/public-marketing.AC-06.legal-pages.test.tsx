/** @jest-environment jsdom */
import { render, screen, within } from '@testing-library/react'
import LegalNoticePage, { metadata as legalMetadata } from '@/app/(public)/mentions-legales/page'
import PrivacyPage, { metadata as privacyMetadata } from '@/app/(public)/confidentialite/page'
import TermsPage, { metadata as termsMetadata } from '@/app/(public)/cgu/page'

jest.mock('@/features/marketing/components/MarketingHeader', () => ({
  MarketingHeader: () => <header>MyStay</header>,
  MarketingBrand: () => <span>MyStay</span>,
}))

describe('031 US-06 — pages légales MyStay', () => {
  it.each([
    [LegalNoticePage, 'Mentions légales', '/mentions-legales', legalMetadata],
    [PrivacyPage, 'Confidentialité', '/confidentialite', privacyMetadata],
    [TermsPage, 'Conditions d’utilisation', '/cgu', termsMetadata],
  ] as const)('AC-06-01/05 renders %s with the marketing shell, footer and working anchors', (Page, title, path, metadata) => {
    const { container } = render(<Page />)
    expect(screen.getByTestId('marketing-surface')).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(title)
    expect(container.querySelector('time')).toHaveAttribute('datetime', '2026-10-05')
    for (const link of within(screen.getByRole('navigation', { name: 'Sommaire' })).getAllByRole('link')) {
      expect(container.querySelector(link.getAttribute('href')!)).toBeInTheDocument()
    }
    const footer = within(screen.getByRole('contentinfo'))
    expect(footer.getByRole('link', { name: 'Mentions légales' })).toHaveAttribute('href', '/mentions-legales')
    expect(footer.getByRole('link', { name: 'Confidentialité' })).toHaveAttribute('href', '/confidentialite')
    expect(footer.getByRole('link', { name: 'CGU' })).toHaveAttribute('href', '/cgu')
    expect(metadata.alternates?.canonical).toBe(path)
    expect(metadata.description).toBeTruthy()
  })

  it('AC-06-02 identifies the actual editor and host without inventing a company', () => {
    const { container } = render(<LegalNoticePage />)
    expect(container.textContent).toContain('David Devillers')
    expect(container.textContent).toContain('1094 route de la Croix, 74170 Saint-Gervais-les-Bains')
    expect(container.textContent).toContain('Vercel Inc.')
    expect(container.textContent).not.toContain('Jump')
    expect(container.textContent).not.toContain('SIRET')
  })

  it('AC-06-03 explains retention, services and consent accurately', () => {
    const { container } = render(<PrivacyPage />)
    const article = within(container.querySelector('article')!)
    expect(article.getByText('au maximum 12 mois après le dernier échange')).toBeInTheDocument()
    for (const label of ['Supabase', 'Resend', 'Vercel', 'CNIL']) expect(article.getByRole('link', { name: label })).toBeInTheDocument()
    expect(container.textContent).toContain('indépendant du choix relatif à Google Analytics')
    expect(container.textContent).toContain('mesures précontractuelles')
    expect(container.textContent).toContain('téléphone est facultatif')
    expect(container.textContent).toContain('copies dans la messagerie')
  })

  it('AC-06-04 makes clear that submitting a form creates no booking or purchase', () => {
    const { container } = render(<TermsPage />)
    expect(container.textContent).toContain('ni une commande, ni une réservation, ni un contrat de prestation')
    expect(container.textContent).toContain('ne propose pas de vente ou de paiement en ligne')
    expect(container.textContent).toContain('ne limitent pas les droits impératifs')
  })
})
