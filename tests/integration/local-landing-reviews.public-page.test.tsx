/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import { GuestReviews } from '@/features/local-seo/components/GuestReviews'

describe('047 public landing review rendering', () => {
  it('hides an empty collection and renders rating/source when present', () => {
    const { rerender } = render(<GuestReviews reviews={[]} />)
    expect(screen.queryByText('L’expérience de nos voyageurs')).not.toBeInTheDocument()
    rerender(<GuestReviews reviews={[{ id: 'one', author: 'Marie', quote: 'Un séjour très agréable.', rating: 5, source: 'AIRBNB' }]} />)
    expect(screen.getByText('L’expérience de nos voyageurs')).toBeInTheDocument()
    expect(screen.getByLabelText('5 étoiles sur 5')).toBeInTheDocument()
    expect(screen.getByText('Avis voyageur reçu via Airbnb')).toBeInTheDocument()
  })
})
