/** @jest-environment jsdom */

import { fireEvent, render, screen, within } from '@testing-library/react'
import { GuideArrivalFlow } from '@/features/guide-app/components/stay/GuideArrivalFlow'
import { arrivalMediaCount, ARRIVAL_STEP_MAX_MEDIA } from '@/features/guide-app/lib/arrival-steps'
import { buildStayLodging } from '../support/guide-stay-lodging'

const step = (photos: string[], videoUrl: string | null = null) => ({
  title: 'Garage', text: 'Entrez par la rampe.', videoUrl, photos,
  kind: 'garage' as const, tip: null, substeps: [], facts: [],
})

function renderStep(photos: string[], videoUrl: string | null = null) {
  render(
    <GuideArrivalFlow
      lodging={buildStayLodging({ arrivalInstructions: [step(photos, videoUrl)] })}
      arrived={false}
      onArrived={jest.fn()}
      onBack={jest.fn()}
    />,
  )
}

describe('054 AC-02-05 — step media layout', () => {
  it('shows the first photo as hero and the others plus the video in a grid of up to 4 columns', () => {
    renderStep(['/hero.jpg', '/a.jpg', '/b.jpg', '/c.jpg'], 'https://youtu.be/dQw4w9WgXcQ')

    expect(screen.getByTestId('arrival-step-hero')).toContainElement(screen.getByRole('button', { name: 'Photo 1' }))
    const grid = screen.getByTestId('arrival-step-media-grid')
    expect(grid).toHaveClass('grid-cols-4')
    expect(within(grid).getAllByRole('button').map(button => button.getAttribute('aria-label'))).toEqual([
      'Photo 2', 'Photo 3', 'Photo 4', 'Lire la vidéo',
    ])
  })

  it('sizes the grid to the number of secondary media', () => {
    renderStep(['/hero.jpg', '/a.jpg'])
    expect(screen.getByTestId('arrival-step-media-grid')).toHaveClass('grid-cols-1')
  })

  it('uses the video as hero when the step has no photo', () => {
    renderStep([], 'https://youtu.be/dQw4w9WgXcQ')
    expect(within(screen.getByTestId('arrival-step-hero')).getByRole('button', { name: 'Lire la vidéo' })).toBeInTheDocument()
    expect(screen.queryByTestId('arrival-step-media-grid')).not.toBeInTheDocument()
  })

  it('opens the lightbox on the clicked photo', () => {
    renderStep(['/hero.jpg', '/a.jpg'])
    fireEvent.click(screen.getByRole('button', { name: 'Photo 2' }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('AC-05-03: caps a step at five media', () => {
    expect(ARRIVAL_STEP_MAX_MEDIA).toBe(5)
    expect(arrivalMediaCount(['a', 'b', 'c', 'd'], 'https://youtu.be/x')).toBe(5)
    expect(arrivalMediaCount([], null)).toBe(0)
  })
})
