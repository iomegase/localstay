/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { LodgingFaq } from '@/features/lodging-showcase/components/LodgingFaq'

const items = [
  { id: '1', question: 'Heure arrivée ?', answer: 'À partir de 15h.' },
  { id: '2', question: 'Parking ?', answer: 'Oui, gratuit.' },
]

describe('LodgingFaq', () => {
  it('renders each question and answer', () => {
    render(<LodgingFaq items={items} />)
    expect(screen.getByText('Heure arrivée ?')).toBeInTheDocument()
    expect(screen.getByText('Oui, gratuit.')).toBeInTheDocument()
  })

  it('renders nothing with no items', () => {
    const { container } = render(<LodgingFaq items={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
