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
    [LegalNoticePage, 'Mentions légales', '/mentions-legales', legalMetadata, '2026-10-14', '14 octobre 2026'],
    [PrivacyPage, 'Confidentialité', '/confidentialite', privacyMetadata, '2026-10-05', '5 octobre 2026'],
    [TermsPage, 'Conditions d’utilisation', '/cgu', termsMetadata, '2026-10-14', '14 octobre 2026'],
  ] as const)('AC-06-01/05 renders %s with the marketing shell, footer and working anchors', (Page, title, path, metadata, isoDate, label) => {
    const { container } = render(<Page />)
    expect(screen.getByTestId('marketing-surface')).toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 1 })).toHaveLength(1)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(title)
    expect(container.querySelector('time')).toHaveAttribute('datetime', isoDate)
    expect(container.querySelector('time')).toHaveTextContent(label)
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

  it('AC-06-02 identifies the actual editor, host and billing portage company', () => {
    const { container } = render(<LegalNoticePage />)
    expect(container.textContent).toContain('David Devillers')
    expect(container.textContent).toContain('1094 route de la Croix, 74170 Saint-Gervais-les-Bains')
    expect(container.textContent).toContain('Vercel Inc.')
    expect(container.textContent).toContain('portage salarial')
    expect(container.textContent).toContain('JUMP GREEN')
    expect(container.textContent).toContain('977 610 781 00022')
    expect(container.textContent).toContain('FR10 977 610 781')
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

  it('AC-06-04 describes the concierge model and who bills each service', () => {
    const { container } = render(<TermsPage />)
    const text = container.textContent ?? ''
    expect(text).toContain('co-hôte sur le compte')
    expect(text).toContain('MyStay n’encaisse pas les loyers.')
    expect(text).toContain('aucune clause')
    expect(text).toContain('JUMP GREEN')
    expect(text).toContain('MyStay ne facture que ses clients partenaires')
    expect(text).toContain('aucune facture aux voyageurs')
    expect(text).toContain('Les estimations transmises par MyStay ont une valeur')
    expect(text).not.toContain('ne facture pas les séjours aux entreprises en son nom')
  })
})
