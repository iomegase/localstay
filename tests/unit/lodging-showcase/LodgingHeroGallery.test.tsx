/** @jest-environment jsdom */
import { render, screen } from '@testing-library/react'
import { LodgingHeroGallery } from '@/features/lodging-showcase/components/LodgingHeroGallery'

const photos = [
  { id: '1', url: 'a.jpg', alt: 'Chambre', room_type: 'bedroom', sort_order: 0, is_cover: true },
  { id: '2', url: 'b.jpg', alt: 'Cuisine', room_type: 'kitchen', sort_order: 1, is_cover: false },
]

describe('LodgingHeroGallery', () => {
  it('renders one image per photo with alt text', () => {
    render(<LodgingHeroGallery title="Chalet Remy" photos={photos} />)
    expect(screen.getByAltText('Chambre')).toBeInTheDocument()
    expect(screen.getByAltText('Cuisine')).toBeInTheDocument()
  })

  it('shows a slide counter', () => {
    render(<LodgingHeroGallery title="Chalet Remy" photos={photos} />)
    expect(screen.getByText('1 / 2')).toBeInTheDocument()
  })

  it('renders a placeholder when there are no photos', () => {
    const { container } = render(<LodgingHeroGallery title="Chalet Remy" photos={[]} />)
    expect(container.querySelector('[data-testid="gallery-placeholder"]')).toBeInTheDocument()
  })
})
