/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import { GuestReviews } from '@/features/local-seo/components/GuestReviews'

describe('062 AC-03-01 — mention « Avis Google »', () => {
  it('labels Google reviews and keeps Airbnb / direct labels unchanged', () => {
    render(<GuestReviews reviews={[
      { id: 'g', quote: 'Séjour parfait, accueil au top.', author: 'Julie', source: 'GOOGLE', rating: 5 },
      { id: 'a', quote: 'Très bon séjour au chalet.', author: 'Marc', source: 'AIRBNB' },
      { id: 'd', quote: 'Merci pour tout, à refaire.', author: 'Anne', source: 'DIRECT' },
    ]} />)

    expect(screen.getByText('Avis Google')).toBeInTheDocument()
    expect(screen.getByText('Avis voyageur reçu via Airbnb')).toBeInTheDocument()
    expect(screen.getAllByText(/Avis Google|Avis voyageur reçu via Airbnb/)).toHaveLength(2)
  })
})
