/** @jest-environment jsdom */
import { render, screen, within } from '@testing-library/react'
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
    // AC-02-14 (bis) : fond blanc sous la barre, plus de crème.
    expect(screen.getByTestId('lodging-essentials')).toHaveClass('bg-white')
    expect(screen.getByTestId('lodging-essentials')).not.toHaveClass('bg-[#f8f7f5]')
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

describe('028 AC-02-18 — équipements du bandeau au mot près', () => {
  it('does not show Hammam for a sauna nor Jacuzzi for « Espace de travail »', () => {
    render(<LodgingEssentials title="Appartement" maxGuests={6} bedroomCount={2} bathroomCount={1} surfaceM2={70} amenities={['Sauna', 'Espace de travail']} />)
    const dl = list()
    expect(dl).not.toHaveTextContent('Hammam')
    expect(dl).not.toHaveTextContent('Jacuzzi')
  })
})

describe('028 AC-02-29 — équipements sans « Oui »', () => {
  it('shows Jacuzzi and Cinéma by name, without a « Oui » value', () => {
    render(<LodgingEssentials title="Chalet" maxGuests={10} bedroomCount={5} bathroomCount={4} surfaceM2={200} amenities={['Jacuzzi', 'Salle de cinéma']} />)
    const dl = list()
    expect(dl).not.toHaveTextContent('Oui')
    expect(within(dl).getByText('Jacuzzi').tagName).toBe('DD')
    expect(within(dl).getByText('Cinéma').tagName).toBe('DD')
    expect(within(dl).getAllByText('Équipement')).toHaveLength(2)
  })
})
