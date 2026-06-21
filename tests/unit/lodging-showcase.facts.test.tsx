/**
 * @jest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { LodgingFacts } from '@/features/lodging-showcase/components/LodgingFacts'

describe('028 lodging facts component', () => {
  it('AC-02-01: renders the public lodging facts as accessible icon + value stats', () => {
    render(
      <LodgingFacts
        maxGuests={6}
        bedroomCount={3}
        bathroomCount={2}
        bedCount={4}
        surfaceM2={72}
      />,
    )

    // Labels stay accessible (aria-label / tooltip) but are no longer visible text.
    expect(screen.getByLabelText('Voyageurs : 6')).toBeInTheDocument()
    expect(screen.getByLabelText('Chambres : 3')).toBeInTheDocument()
    expect(screen.getByLabelText('Salles de bain : 2')).toBeInTheDocument()
    expect(screen.getByLabelText('Couchages : 4')).toBeInTheDocument()
    expect(screen.getByLabelText('Surface : 72 m²')).toBeInTheDocument()

    // The number is the visible content.
    expect(screen.getByText('72 m²')).toBeInTheDocument()

    // The wordy labels are no longer rendered as visible text.
    expect(screen.queryByText('Voyageurs')).not.toBeInTheDocument()
    expect(screen.queryByText('Salles de bain')).not.toBeInTheDocument()
  })

  it('omits a fact when its value is missing', () => {
    render(
      <LodgingFacts maxGuests={4} bedroomCount={2} bathroomCount={null} bedCount={null} surfaceM2={null} />,
    )
    expect(screen.getByLabelText('Voyageurs : 4')).toBeInTheDocument()
    expect(screen.getByLabelText('Chambres : 2')).toBeInTheDocument()
    expect(screen.queryByLabelText(/Salles de bain/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/Surface/)).not.toBeInTheDocument()
  })
})
