/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { MediaLightbox } from '@/features/guide-app/components/MediaLightbox'

beforeAll(() => {
  Element.prototype.scrollTo = jest.fn() as unknown as typeof Element.prototype.scrollTo
})

function renderLightbox(startIndex = 0) {
  render(
    <MediaLightbox
      title="Garage"
      content={{ kind: 'photos', photos: ['/a.jpg', '/b.jpg', '/c.jpg'], startIndex }}
      onClose={jest.fn()}
    />,
  )
  return screen.getByTestId('media-lightbox-track')
}

describe('054 AC-02-06 — swipe between photos', () => {
  it('goes to the next photo after a leftward drag', () => {
    const track = renderLightbox()
    fireEvent.mouseDown(track, { clientX: 300, button: 0 })
    fireEvent.mouseMove(window, { clientX: 150 })
    fireEvent.mouseUp(window, { clientX: 150 })
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
  })

  it('goes back after a rightward drag and ignores tiny moves', () => {
    const track = renderLightbox(2)
    fireEvent.mouseDown(track, { clientX: 100, button: 0 })
    fireEvent.mouseUp(window, { clientX: 110 })
    expect(screen.getByText('3 / 3')).toBeInTheDocument()

    fireEvent.mouseDown(track, { clientX: 100, button: 0 })
    fireEvent.mouseMove(window, { clientX: 260 })
    fireEvent.mouseUp(window, { clientX: 260 })
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
  })

  it('supports the keyboard arrows', () => {
    renderLightbox()
    fireEvent.keyDown(window, { key: 'ArrowRight' })
    expect(screen.getByText('2 / 3')).toBeInTheDocument()
    fireEvent.keyDown(window, { key: 'ArrowLeft' })
    expect(screen.getByText('1 / 3')).toBeInTheDocument()
  })

  it('does not close when a drag ends outside the frame', () => {
    const onClose = jest.fn()
    render(<MediaLightbox title="Garage" content={{ kind: 'photos', photos: ['/a.jpg', '/b.jpg'], startIndex: 0 }} onClose={onClose} />)
    const track = screen.getByTestId('media-lightbox-track')
    fireEvent.mouseDown(track, { clientX: 300, button: 0 })
    fireEvent.mouseMove(window, { clientX: 20 })
    fireEvent.mouseUp(window, { clientX: 20 })
    fireEvent.click(screen.getByRole('dialog'))
    expect(onClose).not.toHaveBeenCalled()
  })
})
