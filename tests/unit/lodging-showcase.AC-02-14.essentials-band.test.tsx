/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { LodgingEssentials } from '@/features/lodging-showcase/components/LodgingEssentials'

const list = () => screen.getByLabelText(/^Caractéristiques principales de /)

describe('028 AC-02-14 — bandeau des caractéristiques', () => {
  it('uses a shadow without border and 4 columns for 4 facts', () => {
    render(<LodgingEssentials title="Le 305" maxGuests={2} bedroomCount={1} bathroomCount={1} surfaceM2={37} />)
    const dl = list()
    expect(dl).toHaveClass('shadow-md', 'md:grid-cols-4')
    expect(dl.className).not.toMatch(/(^|\s)border(\s|-slate)/)
    expect(dl.className).not.toContain('md:grid-cols-5')
    expect(dl.querySelectorAll(':scope > div')).toHaveLength(4)
  })

  it('switches to 3 columns when a fact is missing', () => {
    render(<LodgingEssentials title="Le 305" maxGuests={2} bedroomCount={1} bathroomCount={1} surfaceM2={null} />)
    expect(list()).toHaveClass('md:grid-cols-3')
    expect(list().querySelectorAll(':scope > div')).toHaveLength(3)
  })

  it('caps at 4 columns when there are more facts', () => {
    render(<LodgingEssentials title="Chalet" maxGuests={10} bedroomCount={5} bathroomCount={4} surfaceM2={200} amenities={['Piscine', 'Sauna']} />)
    expect(list()).toHaveClass('md:grid-cols-4')
    expect(list().querySelectorAll(':scope > div')).toHaveLength(5)
  })
})
