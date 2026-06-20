/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { LodgingAmenitiesGrid } from '@/features/lodging-showcase/components/LodgingAmenitiesGrid'

describe('LodgingAmenitiesGrid', () => {
  it('renders a heading, subtitle and each label', () => {
    render(<LodgingAmenitiesGrid title="Équipements" subtitle="compris dans le séjour" items={['Wifi', 'Parking']} />)
    expect(screen.getByText('Équipements')).toBeInTheDocument()
    expect(screen.getByText('compris dans le séjour')).toBeInTheDocument()
    expect(screen.getByText('Wifi')).toBeInTheDocument()
    expect(screen.getByText('Parking')).toBeInTheDocument()
  })

  it('renders nothing when there are no items', () => {
    const { container } = render(<LodgingAmenitiesGrid title="Services" subtitle="sur demande" items={[]} />)
    expect(container).toBeEmptyDOMElement()
  })
})
