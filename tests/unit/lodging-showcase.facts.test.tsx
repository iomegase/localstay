/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { LodgingFacts } from '@/features/lodging-showcase/components/LodgingFacts'

describe('028 lodging facts component', () => {
  it('AC-02-01: renders the visible public lodging facts', () => {
    render(
      <LodgingFacts
        maxGuests={6}
        bedroomCount={3}
        bathroomCount={2}
        bedCount={4}
        surfaceM2={72}
      />,
    )

    expect(screen.getByText('Voyageurs')).toBeInTheDocument()
    expect(screen.getByText('Chambres')).toBeInTheDocument()
    expect(screen.getByText('Salles de bain')).toBeInTheDocument()
    expect(screen.getByText('Couchages')).toBeInTheDocument()
    expect(screen.getByText('Surface')).toBeInTheDocument()
    expect(screen.getByText('72 m2')).toBeInTheDocument()
  })
})
