/** @jest-environment jsdom */
import { fireEvent, render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'

jest.mock('next/image', () => ({
  __esModule: true,
  // eslint-disable-next-line @next/next/no-img-element
  default: ({ src, alt }: { src: string; alt: string }) => <img src={src} alt={alt} />,
}))

import { LodgingMarketingGallery } from '@/features/lodging-showcase/components/LodgingMarketingGallery'
import { LodgingRoomsGrid } from '@/features/lodging-showcase/components/LodgingRoomsGrid'

const photos = Array.from({ length: 7 }, (_, index) => ({ id: `p${index}`, url: `https://cdn.test/p${index}.jpg`, alt: `Photo ${index + 1}` }))

const dialog = () => screen.getByRole('dialog', { name: 'Photos de Chalet Hygge' })
const counter = () => within(dialog()).getByTestId('lightbox-counter')
const caption = () => within(dialog()).getByTestId('lightbox-caption')

describe('spec 091 — lightbox des photos du logement', () => {
  it('AC-01 / BR-01 : rien n’est chargé avant le clic ; la photo cliquée ouvre toutes les photos', () => {
    render(<LodgingMarketingGallery title="Chalet Hygge" photos={photos} />)
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.querySelectorAll('img[src="https://cdn.test/p6.jpg"]')).toHaveLength(0)

    fireEvent.click(screen.getByRole('button', { name: 'Agrandir la photo : Photo 3' }))
    expect(counter()).toHaveTextContent('3 / 7')
    expect(caption()).toHaveTextContent('Photo 3')
    expect(within(dialog()).getAllByRole('img')).toHaveLength(7)
  })

  it('AC-03 : boutons, flèches du clavier, bornes et fermeture par Échap', () => {
    render(<LodgingMarketingGallery title="Chalet Hygge" photos={photos} />)
    fireEvent.click(screen.getByRole('button', { name: 'Agrandir la photo : Photo 1' }))

    expect(within(dialog()).getByRole('button', { name: 'Photo précédente' })).toBeDisabled()
    fireEvent.click(within(dialog()).getByRole('button', { name: 'Photo suivante' }))
    expect(counter()).toHaveTextContent('2 / 7')
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(counter()).toHaveTextContent('3 / 7')
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(caption()).toHaveTextContent('Photo 2')

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('AC-04 : focus sur Fermer, page figée, focus rendu à la photo cliquée', () => {
    render(<LodgingMarketingGallery title="Chalet Hygge" photos={photos} />)
    const trigger = screen.getByRole('button', { name: 'Agrandir la photo : Photo 2' })
    trigger.focus()
    fireEvent.click(trigger)

    expect(dialog()).toHaveAttribute('aria-modal', 'true')
    expect(within(dialog()).getByRole('button', { name: 'Fermer' })).toHaveFocus()
    expect(document.body.style.overflow).toBe('hidden')

    fireEvent.click(within(dialog()).getByRole('button', { name: 'Fermer' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.body.style.overflow).toBe('')
    expect(trigger).toHaveFocus()
  })

  it('AC-03 : un clic sur le fond ferme la lightbox', () => {
    render(<LodgingMarketingGallery title="Chalet Hygge" photos={photos} />)
    fireEvent.click(screen.getByRole('button', { name: 'Agrandir la photo : Photo 1' }))
    fireEvent.click(dialog())
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('AC-02 : une carte de pièce ouvre les photos de cette pièce, avec son libellé', () => {
    const roomPhotos = [
      { id: 'k1', url: 'https://cdn.test/k1.jpg', alt: 'Cuisine équipée', room_type: 'kitchen', sort_order: 0, is_cover: false },
      { id: 'k2', url: 'https://cdn.test/k2.jpg', alt: 'Îlot de cuisine', room_type: 'kitchen', sort_order: 1, is_cover: false },
      { id: 'b1', url: 'https://cdn.test/b1.jpg', alt: 'Salle de bain', room_type: 'bathroom', sort_order: 2, is_cover: false },
    ]
    render(<LodgingRoomsGrid photos={roomPhotos} />)
    fireEvent.click(screen.getByRole('button', { name: 'Agrandir la photo : Îlot de cuisine' }))

    const box = screen.getByRole('dialog')
    expect(box).toHaveAccessibleName(/^Photos de /)
    expect(within(box).getByTestId('lightbox-counter')).toHaveTextContent('2 / 2')
    expect(within(box).getAllByRole('img').map(img => img.getAttribute('alt'))).toEqual(['Cuisine équipée', 'Îlot de cuisine'])
  })
})
