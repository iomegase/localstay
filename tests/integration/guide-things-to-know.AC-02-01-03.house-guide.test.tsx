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
  it('AC-02-01 : affichée entre « Règlement » et « Point de tri »', () => {
    render(<GuideHouseGuide lodging={buildStayLodging({ thingsToKnow: [thing] })} onBack={jest.fn()} />)

    const headings = screen.getAllByRole('heading', { level: 2 }).map(heading => heading.textContent)
    expect(headings).toEqual(['Règlement', 'Choses à savoir', 'Point de tri', 'Équipements'])
  })

  it('AC-02-01 : absente sans carte', () => {
    render(<GuideHouseGuide lodging={buildStayLodging({ thingsToKnow: [] })} onBack={jest.fn()} />)
    expect(screen.queryByRole('heading', { name: 'Choses à savoir' })).not.toBeInTheDocument()
  })

  it('AC-02-02 : accordion fermé (vignette + titre), déplié au toucher du titre', () => {
    render(<GuideHouseGuide lodging={buildStayLodging({ thingsToKnow: [thing] })} onBack={jest.fn()} />)
    const card = screen.getByTestId('guide-thing-to-know')
    const toggle = within(card).getByRole('button', { name: 'Volets roulants' })

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(within(card).getByRole('button', { name: 'Volets roulants — photo 1' })).toBeInTheDocument()
    expect(within(card).queryByText('La télécommande est sur la cheminée.')).not.toBeInTheDocument()

    fireEvent.click(toggle)
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(within(card).getByText('La télécommande est sur la cheminée.')).toBeInTheDocument()
    expect(within(card).getByRole('button', { name: 'Volets roulants — photo 2' })).toBeInTheDocument()

    fireEvent.click(toggle)
    expect(within(card).queryByText('La télécommande est sur la cheminée.')).not.toBeInTheDocument()
  })

  it('AC-02-03 : toucher une photo l’ouvre en plein écran', () => {
    render(<GuideHouseGuide lodging={buildStayLodging({ thingsToKnow: [thing] })} onBack={jest.fn()} />)
    fireEvent.click(screen.getByRole('button', { name: 'Volets roulants — photo 1' }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getAllByRole('img').length).toBeGreaterThanOrEqual(2)
  })
})
