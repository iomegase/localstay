/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

function EmptyLodgingsState() {
  return (
    <div>
      <p>Vous n&apos;avez pas encore de logement.</p>
      <a href="/dashboard/lodgings">Créer mon premier logement</a>
    </div>
  )
}

describe('EmptyLodgingsState — AC-01-02', () => {
  it('displays invite message and link to create lodging', () => {
    render(<EmptyLodgingsState />)
    expect(screen.getByText(/vous n'avez pas encore de logement/i)).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /créer mon premier logement/i })).toHaveAttribute(
      'href',
      '/dashboard/lodgings',
    )
  })
})
