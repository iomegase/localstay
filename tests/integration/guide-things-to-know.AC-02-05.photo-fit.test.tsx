/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import { MediaLightbox } from '@/features/guide-app/components/MediaLightbox'

// Spec 099 AC-02-05 : en plein écran, la photo tient dans l'écran, centrée, sans cadre noir.
describe('099 AC-02-05 — photo adaptée à l’écran', () => {
  it('centre chaque photo, bornée à l’écran, sans fond noir autour', () => {
    render(
      <MediaLightbox
        title="Cuisine"
        content={{ kind: 'photos', photos: ['/paysage.jpg', '/portrait.jpg'], startIndex: 0 }}
        onClose={jest.fn()}
      />,
    )

    expect(screen.getByTestId('media-modal-frame')).not.toHaveClass('bg-black')
    const photo = screen.getByAltText('Cuisine — photo 1')
    expect(photo).toHaveClass('max-h-[80vh]', 'max-w-full', 'object-contain')
    expect(photo).not.toHaveClass('w-full')
    expect(photo.parentElement).toHaveClass('flex', 'items-center', 'justify-center')
  })

  it('garde le cadre noir pour la vidéo', () => {
    render(<MediaLightbox title="Vidéo" content={{ kind: 'video', url: 'https://youtu.be/dQw4w9WgXcQ' }} onClose={jest.fn()} />)
    expect(screen.getByTestId('media-modal-frame')).toHaveClass('bg-black')
  })
})
