/** @jest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react'
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
  it('086 AC-01 : deux colonnes (moitié gauche, moitié droite), ordre conservé', () => {
    const many = Array.from({ length: 5 }, (_, index) => ({ id: String(index), question: `Q${index + 1} ?`, answer: `R${index + 1}` }))
    render(<LodgingFaq items={many} />)
    const columns = screen.getAllByTestId('lodging-faq-column')
    expect(columns).toHaveLength(2)
    expect(columns[0]!.parentElement).toHaveClass('md:grid-cols-2')
    expect(columns.map(column => [...column.querySelectorAll('summary')].map(summary => summary.textContent))).toEqual([
      ['Q1 ?', 'Q2 ?', 'Q3 ?'], ['Q4 ?', 'Q5 ?'],
    ])
  })

  it('086 AC-02 : la réponse passe par le rendu markdown', () => {
    render(<LodgingFaq items={[{ id: '1', question: 'Heure ?', answer: 'Arrivée dès **16 h**.' }]} />)
    expect(screen.getByTestId('lodging-faq-answer')).toHaveTextContent('Arrivée dès **16 h**.')
  })
  it('PO 2026-10-06 : ouvrir une question ferme la précédente, y compris dans l’autre colonne', () => {
    const many = Array.from({ length: 4 }, (_, index) => ({ id: String(index), question: `Q${index + 1} ?`, answer: `R${index + 1}` }))
    const { container } = render(<LodgingFaq items={many} />)
    const details = () => [...container.querySelectorAll('details')]

    fireEvent.click(screen.getByText('Q1 ?'))
    expect(details().map(item => item.open)).toEqual([true, false, false, false])

    fireEvent.click(screen.getByText('Q4 ?'))
    expect(details().map(item => item.open)).toEqual([false, false, false, true])

    fireEvent.click(screen.getByText('Q4 ?'))
    expect(details().map(item => item.open)).toEqual([false, false, false, false])
  })
})
