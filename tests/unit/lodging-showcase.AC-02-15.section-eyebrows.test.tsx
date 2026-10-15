/** @jest-environment jsdom */
import { render, screen, within } from '@testing-library/react'
import { LodgingFaq } from '@/features/lodging-showcase/components/LodgingFaq'
import { LodgingAvailabilityCalendar } from '@/features/lodging-showcase/components/LodgingAvailabilityCalendar'
import { LodgingFeatureSections } from '@/features/lodging-showcase/components/LodgingFeatureSections'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'

const eyebrowClasses = ['pt-7', 'uppercase', 'text-pink-600', 'before:bg-pink-600']

describe('028 AC-02-15 — eyebrows des sections de la fiche logement', () => {
  it('FAQ : eyebrow « Questions fréquentes », sans « Bon à savoir » ni grand titre', () => {
    render(<LodgingFaq items={[{ question: 'Q ?', answer: 'R.' }]} />)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent(/^Questions fréquentes$/)
    expect(heading).toHaveClass(...eyebrowClasses)
    expect(screen.queryByText('Bon à savoir')).not.toBeInTheDocument()
  })

  it('Calendrier : eyebrow « Disponibilités » et navigation dans la carte', () => {
    render(<LodgingAvailabilityCalendar today="2026-10-15" busy={[]} />)
    const heading = screen.getByRole('heading', { level: 2 })
    expect(heading).toHaveTextContent(/^Disponibilités$/)
    expect(heading).toHaveClass(...eyebrowClasses)
    expect(screen.queryByText('Disponibilités.')).not.toBeInTheDocument()
    const card = screen.getByTestId('availability-month').parentElement!
    expect(within(card).getByRole('button', { name: 'Mois précédent' })).toHaveClass('absolute')
    expect(within(card).getByRole('button', { name: 'Mois suivant' })).toHaveClass('absolute')
  })

  it.each(['LodgingLocationMap', 'LodgingAreaMap'])('%s : eyebrow « Les alentours », plus de « Situer le logement. », carte redimensionnée', name => {
    const source = readFileSync(join(process.cwd(), `src/features/lodging-showcase/components/${name}.tsx`), 'utf8')
    expect(source).toContain('<LodgingSectionEyebrow>Les alentours</LodgingSectionEyebrow>')
    expect(source).not.toContain('Situer le logement.')
    expect(source).toContain('new ResizeObserver(() => map.resize())')
  })

  it('Équipements : pastille des icônes en slate-100', () => {
    render(<LodgingFeatureSections includedAmenities={['Wi-Fi']} onRequestAmenities={[]} />)
    expect(screen.getByRole('listitem').querySelector('span')).toHaveClass('bg-slate-100')
  })
})

describe('028 AC-02-16 / 031 AC-01-22 — réponses de FAQ pleine largeur et justifiées', () => {
  it('fiche logement : pas de marge droite, texte justifié avec césure', () => {
    render(<LodgingFaq items={[{ question: 'Q ?', answer: 'Une réponse.' }]} />)
    const answer = screen.getByTestId('lodging-faq-answer')
    expect(answer).toHaveClass('text-justify', 'hyphens-auto', '[&_p]:text-justify')
    expect(answer.className).not.toMatch(/(^|\s)(sm:)?pr-\d+/)
  })

  it('FAQ marketing : même règle', () => {
    const source = readFileSync(join(process.cwd(), 'src/features/marketing/components/MarketingFaqSection.tsx'), 'utf8')
    expect(source).toContain('hyphens-auto text-justify')
    expect(source).not.toMatch(/pr-16|sm:pr-20|max-w-\[600px\]/)
  })
})
