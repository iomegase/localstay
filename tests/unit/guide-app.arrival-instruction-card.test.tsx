/** @jest-environment jsdom */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { ArrivalInstructionCard } from '@/features/guide-app/components/ArrivalInstructionCard'

const instruction = {
  text: 'Ouvrez le portail avec le badge',
  videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  photos: ['https://cdn.example.com/a.jpg', 'https://cdn.example.com/b.jpg'],
}

describe('ArrivalInstructionCard', () => {
  it('shows a numbered mini-card with the instruction text', () => {
    render(<ArrivalInstructionCard index={0} instruction={instruction} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('Ouvrez le portail avec le badge')).toBeInTheDocument()
  })

  it('opens the photos in a framed carousel lightbox', () => {
    render(<ArrivalInstructionCard index={0} instruction={instruction} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /photo 2/i }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getAllByRole('img').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByTestId('media-modal-frame')).toHaveClass(
      'border-[5px]',
      'border-white',
    )
    // navigation du carrousel
    expect(
      screen.getByRole('button', { name: /photo suivante/i }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /photo précédente/i }),
    ).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: /fermer/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens the video in the lightbox', () => {
    render(<ArrivalInstructionCard index={2} instruction={instruction} />)

    fireEvent.click(screen.getByRole('button', { name: /vidéo/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /lire la vidéo/i }),
    ).toBeInTheDocument()
  })

  it('renders no media thumbnails when the instruction has none', () => {
    render(
      <ArrivalInstructionCard
        index={0}
        instruction={{ text: 'Sonnez à l’interphone', videoUrl: null, photos: [] }}
      />,
    )
    expect(screen.queryByRole('button', { name: /photo 1/i })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /vidéo/i })).not.toBeInTheDocument()
  })
})
