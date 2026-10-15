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
