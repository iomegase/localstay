/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import { MarkdownLink } from '@/shared/components/MarkdownText'

// Décision PO du 2026-10-05 : un lien interne ne s'ouvre jamais dans un nouvel onglet.
describe('MarkdownLink — onglet selon la destination', () => {
  it.each([
    '/logements/le-chalet-remy',
    '/decouvrir/saint-nicolas-de-veroce/diner/la-table-d-armante',
    'https://www.mystay.city/logements/le-chalet-remy',
    'https://mystay.city/journal',
    '#programme',
  ])('ouvre %s dans le même onglet', href => {
    render(<MarkdownLink href={href}>lien</MarkdownLink>)
    const link = screen.getByRole('link', { name: 'lien' })
    expect(link).toHaveAttribute('href', href)
    expect(link).not.toHaveAttribute('target')
  })

  it('ouvre un site externe dans un nouvel onglet, sans transmettre le référent', () => {
    render(<MarkdownLink href="https://www.atout-france.fr/">Atout France</MarkdownLink>)
    const link = screen.getByRole('link', { name: 'Atout France' })
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', 'noopener noreferrer')
  })
})
