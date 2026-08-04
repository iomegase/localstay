/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { Info } from 'lucide-react'
import { PracticalMediaCard } from '@/features/guide-app/components/PracticalMediaCard'

const baseProps = {
  icon: Info,
  title: 'Parking',
  description: 'Devant le chalet.',
}

describe('PracticalMediaCard', () => {
  it('opens the photo in a framed modal and closes it', () => {
    render(
      <PracticalMediaCard
        {...baseProps}
        photoUrl="https://cdn.example.com/parking.jpg"
      />,
    )

    // Pas de modal au départ
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /photo/i }))

    const dialog = screen.getByRole('dialog')
    expect(dialog).toBeInTheDocument()
    const image = screen.getByAltText('Parking')
    expect(image).toHaveAttribute('src', 'https://cdn.example.com/parking.jpg')
    // Cadre blanc 5px autour du média
    expect(screen.getByTestId('media-modal-frame')).toHaveClass(
      'border-[5px]',
      'border-white',
    )

    fireEvent.click(screen.getByRole('button', { name: /fermer/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens the video in a modal (YouTube player)', () => {
    render(
      <PracticalMediaCard
        {...baseProps}
        videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /vidéo/i }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /lire la vidéo/i }),
    ).toBeInTheDocument()
  })

  it('closes the modal on Escape', () => {
    render(
      <PracticalMediaCard
        {...baseProps}
        photoUrl="https://cdn.example.com/parking.jpg"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /photo/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('flips between the text front and the media back', () => {
    render(
      <PracticalMediaCard
        {...baseProps}
        photoUrl="https://cdn.example.com/parking.jpg"
      />,
    )

    const flip = screen.getByRole('button', { name: /voir les médias/i })
    expect(flip).toHaveAttribute('aria-pressed', 'false')

    fireEvent.click(flip)
    expect(flip).toHaveAttribute('aria-pressed', 'true')

    fireEvent.click(screen.getByRole('button', { name: /retour/i }))
    expect(flip).toHaveAttribute('aria-pressed', 'false')
  })

  it('shows no media thumbnails when there is neither photo nor video', () => {
    render(<PracticalMediaCard {...baseProps} />)

    expect(screen.queryByRole('button', { name: /photo/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /vidéo/i })).not.toBeInTheDocument()
    expect(screen.getByText('Parking')).toBeInTheDocument()
  })
})
