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
  it('opens the photo directly in a framed modal via the "Voir" button', () => {
    render(
      <PracticalMediaCard
        {...baseProps}
        photoUrl="https://cdn.example.com/parking.jpg"
      />,
    )

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /voir/i }))

    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByAltText('Parking')).toHaveAttribute(
      'src',
      'https://cdn.example.com/parking.jpg',
    )
    expect(screen.getByTestId('media-modal-frame')).toHaveClass(
      'border-[5px]',
      'border-white',
    )

    fireEvent.click(screen.getByRole('button', { name: /fermer/i }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('opens the video directly (video takes priority over photo)', () => {
    render(
      <PracticalMediaCard
        {...baseProps}
        photoUrl="https://cdn.example.com/parking.jpg"
        videoUrl="https://www.youtube.com/watch?v=dQw4w9WgXcQ"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /voir/i }))
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

    fireEvent.click(screen.getByRole('button', { name: /voir/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()

    fireEvent.keyDown(window, { key: 'Escape' })
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('renders no "Voir" button when there is neither photo nor video', () => {
    render(<PracticalMediaCard {...baseProps} />)

    expect(screen.queryByRole('button', { name: /voir/i })).not.toBeInTheDocument()
    expect(screen.getByText('Parking')).toBeInTheDocument()
  })
})
