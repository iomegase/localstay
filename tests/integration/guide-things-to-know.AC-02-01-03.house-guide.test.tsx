/** @jest-environment jsdom */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { GuideHouseGuide } from '@/features/guide-app/components/stay/GuideHouseGuide'
import { buildStayLodging } from '../support/guide-stay-lodging'

const thing = {
  id: 'k1',
  title: 'Volets roulants',
  description: 'La télécommande est sur la cheminée.',
  photos: ['/volet-1.jpg', '/volet-2.jpg'],
}

// Spec 099 US-02 — section « Choses à savoir » du guide logement.
describe('099 US-02 — Choses à savoir', () => {
  it('AC-02-01 : affichée entre « Point de tri » et « Équipements »', () => {
    render(<GuideHouseGuide lodging={buildStayLodging({ thingsToKnow: [thing] })} onBack={jest.fn()} />)

    const headings = screen.getAllByRole('heading', { level: 2 }).map(heading => heading.textContent)
    expect(headings).toEqual(['Règlement', 'Point de tri', 'Choses à savoir', 'Équipements'])
  })

  it('AC-02-01 : absente sans carte', () => {
    render(<GuideHouseGuide lodging={buildStayLodging({ thingsToKnow: [] })} onBack={jest.fn()} />)
    expect(screen.queryByRole('heading', { name: 'Choses à savoir' })).not.toBeInTheDocument()
  })

  it('AC-02-02 : accordion fermé (ampoule + titre, sans photo), déplié au toucher du titre', () => {
    render(<GuideHouseGuide lodging={buildStayLodging({ thingsToKnow: [thing] })} onBack={jest.fn()} />)
    const card = screen.getByTestId('guide-thing-to-know')
    const toggle = within(card).getByRole('button', { name: 'Volets roulants' })

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(card.querySelector('svg.lucide-lightbulb')).not.toBeNull()
    expect(within(card).queryByRole('button', { name: 'Volets roulants — photo 1' })).not.toBeInTheDocument()
    expect(within(card).queryByText('La télécommande est sur la cheminée.')).not.toBeInTheDocument()

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(within(card).getByText('La télécommande est sur la cheminée.')).toBeInTheDocument()
    expect(within(card).getByRole('button', { name: 'Volets roulants — photo 1' })).toBeInTheDocument()
    expect(within(card).getByRole('button', { name: 'Volets roulants — photo 2' })).toBeInTheDocument()

    fireEvent.click(toggle)
    expect(within(card).queryByText('La télécommande est sur la cheminée.')).not.toBeInTheDocument()
  })

  it('AC-02-02 (PO 2026-10-18) : ouvrir une carte referme celle qui était ouverte', () => {
    const other = { id: 'k2', title: 'Vélux', description: 'Une télécommande par Vélux.', photos: [] }
    render(<GuideHouseGuide lodging={buildStayLodging({ thingsToKnow: [thing, other] })} onBack={jest.fn()} />)
    const first = screen.getByRole('button', { name: 'Volets roulants' })
    const second = screen.getByRole('button', { name: 'Vélux' })

    fireEvent.click(first)
    expect(first).toHaveAttribute('aria-expanded', 'true')

    fireEvent.click(second)
    expect(second).toHaveAttribute('aria-expanded', 'true')
    expect(first).toHaveAttribute('aria-expanded', 'false')
    expect(screen.queryByText('La télécommande est sur la cheminée.')).not.toBeInTheDocument()
    expect(screen.getByText('Une télécommande par Vélux.')).toBeInTheDocument()
  })

  it('AC-02-03 : toucher une photo l’ouvre en plein écran', () => {
    render(<GuideHouseGuide lodging={buildStayLodging({ thingsToKnow: [thing] })} onBack={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Volets roulants' }))
    fireEvent.click(screen.getByRole('button', { name: 'Volets roulants — photo 1' }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getAllByRole('img').length).toBeGreaterThanOrEqual(2)
  })
})
