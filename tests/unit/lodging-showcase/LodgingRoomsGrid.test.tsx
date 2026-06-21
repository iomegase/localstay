/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { LodgingRoomsGrid } from '@/features/lodging-showcase/components/LodgingRoomsGrid'

const photos = [
  { id: '1', url: 'a.jpg', alt: 'Chambre', room_type: 'bedroom', sort_order: 0, is_cover: true },
  { id: '2', url: 'b.jpg', alt: 'No type', room_type: null, sort_order: 1, is_cover: false },
]

describe('LodgingRoomsGrid', () => {
  it('renders room-typed photos with their label', () => {
    render(<LodgingRoomsGrid photos={photos} />)
    expect(screen.getByAltText('Chambre')).toBeInTheDocument()
    expect(screen.getByText('Chambre')).toBeInTheDocument()
  })

  it('renders nothing when no photo has a room type', () => {
    const { container } = render(<LodgingRoomsGrid photos={[photos[1]]} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('groups same-category photos into one card with slide controls', () => {
    render(
      <LodgingRoomsGrid
        photos={[
          { id: '1', url: 'ext1.jpg', alt: 'Terrasse', room_type: 'exterior', sort_order: 0, is_cover: false },
          { id: '2', url: 'ext2.jpg', alt: 'Piscine', room_type: 'exterior', sort_order: 1, is_cover: false },
        ]}
      />,
    )

    // One label for the grouped category, both photos rendered inside it.
    expect(screen.getAllByText('Extérieur')).toHaveLength(1)
    expect(screen.getByAltText('Terrasse')).toBeInTheDocument()
    expect(screen.getByAltText('Piscine')).toBeInTheDocument()
    // Slide dots appear for multi-photo groups.
    expect(screen.getByRole('button', { name: /photo 1 de Extérieur/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /photo 2 de Extérieur/i })).toBeInTheDocument()
  })
})
