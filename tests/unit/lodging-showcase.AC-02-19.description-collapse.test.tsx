/** @jest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react'
import { LodgingDescription } from '@/features/lodging-showcase/components/LodgingDescription'

const words = (count: number) => Array.from({ length: count }, (_, index) => `mot${index}`).join(' ')

describe('028 AC-02-19 — description longue repliée', () => {
  it('collapses beyond 150 words and toggles with « Lire la suite » / « Réduire »', () => {
    render(<LodgingDescription source={`${words(200)} fin-du-texte`} />)
    const box = screen.getByTestId('lodging-description')
    expect(box).toHaveClass('max-h-[22rem]', 'overflow-hidden')
    // Le texte complet reste dans le HTML (SEO).
    expect(box).toHaveTextContent('fin-du-texte')
    const toggle = screen.getByRole('button', { name: 'Lire la suite' })
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    fireEvent.click(toggle)
    expect(box).not.toHaveClass('max-h-[22rem]')
    expect(screen.getByRole('button', { name: 'Réduire' })).toHaveAttribute('aria-expanded', 'true')
  })

  it('shows a short description in full, without button', () => {
    render(<LodgingDescription source={words(80)} />)
    expect(screen.getByTestId('lodging-description')).not.toHaveClass('max-h-[22rem]')
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
