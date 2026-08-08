/** @jest-environment jsdom */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { ArrivalInstructionCard } from '@/features/guide-app/components/ArrivalInstructionCard'

const instruction = {
  text: '# Accès au garage\n\nOuvrez le portail avec le badge',
  videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
  photos: ['https://cdn.example.com/a.jpg', 'https://cdn.example.com/b.jpg'],
}

describe('ArrivalInstructionCard', () => {
  it('shows a numbered mini-card with the instruction text', () => {
    render(<ArrivalInstructionCard index={0} instruction={instruction} />)
    expect(screen.getByText('1')).toBeInTheDocument()
    expect(screen.getByText('Ouvrez le portail avec le badge')).toBeInTheDocument()
  })

  it('places the number beside the title and the content below at full width', () => {
    render(<ArrivalInstructionCard index={0} instruction={instruction} />)

    const header = screen.getByTestId('arrival-instruction-header')
    expect(within(header).getByText('1')).toBeInTheDocument()
    expect(within(header).getByRole('heading', { name: 'Accès au garage' })).toBeInTheDocument()
    expect(within(header).queryByText('Ouvrez le portail avec le badge')).not.toBeInTheDocument()

    const content = screen.getByTestId('arrival-instruction-content')
    expect(within(content).getByText('Ouvrez le portail avec le badge')).toBeInTheDocument()
    expect(content).not.toHaveClass('pl-10')

    expect(screen.getByTestId('arrival-instruction-media')).not.toHaveClass('pl-10')
  })

  it.each(['#', '##', '###'])('extracts a level %s heading as the card title', marker => {
    render(
      <ArrivalInstructionCard
        index={1}
        instruction={{ text: `${marker} Parking\n\nGarez-vous place 46`, videoUrl: null, photos: [] }}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Parking' })).toBeInTheDocument()
    expect(screen.getByText('Garez-vous place 46')).toBeInTheDocument()
  })

  it('uses a safe fallback title for a legacy instruction without heading', () => {
    render(
      <ArrivalInstructionCard
        index={2}
        instruction={{ text: 'Sonnez à l’interphone', videoUrl: null, photos: [] }}
      />,
    )
    expect(screen.getByRole('heading', { name: 'Instruction 3' })).toBeInTheDocument()
    expect(screen.getByText('Sonnez à l’interphone')).toBeInTheDocument()
  })

  it('opens the photos in a framed carousel lightbox', () => {
    render(<ArrivalInstructionCard index={0} instruction={instruction} />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /photo 2/i }))

    const dialog = screen.getByRole('dialog')
    expect(within(dialog).getAllByRole('img').length).toBeGreaterThanOrEqual(2)
    expect(screen.getByTestId('media-modal-frame')).toHaveClass('rounded-[24px]')
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
    // Lecteur « short » maison : barre de progression exposée (pas le chrome YouTube).
    expect(
      screen.getByRole('slider', { name: /progression de la vidéo/i }),
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
