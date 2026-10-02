/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { ArrivalInstructionsEditor } from '@/features/guide-customization/components/ArrivalInstructionsEditor'
import type { ArrivalInstructionInput } from '@/features/guide-customization/types'

function Harness({ photos, video = null }: { photos: string[]; video?: string | null }) {
  const [value, setValue] = useState<ArrivalInstructionInput[]>([
    { id: 'a', title: 'Garage', text: 'Rampe', video_url: video, photos, sort_order: 0 },
  ])
  return (
    <>
      <ArrivalInstructionsEditor value={value} onChange={setValue} lodgingId="l1" />
      <pre data-testid="state">{JSON.stringify(value[0].photos)}</pre>
    </>
  )
}

describe('054 AC-05-03 — step media editor', () => {
  it('marks the hero and promotes another photo to hero', () => {
    render(<Harness photos={['/a.jpg', '/b.jpg', '/c.jpg']} />)
    expect(screen.getByText('Image principale')).toBeInTheDocument()
    expect(screen.getByText('3 / 5 médias')).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Définir la photo 3 comme image principale' }))
    expect(JSON.parse(screen.getByTestId('state').textContent ?? '[]')).toEqual(['/c.jpg', '/a.jpg', '/b.jpg'])
  })

  it('blocks uploads once five media are reached', () => {
    render(<Harness photos={['/a.jpg', '/b.jpg', '/c.jpg', '/d.jpg']} video="https://youtu.be/dQw4w9WgXcQ" />)
    expect(screen.getByText('5 / 5 médias')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /ajouter une photo/i })).not.toBeInTheDocument()
    expect(screen.getByText(/Limite atteinte/)).toBeInTheDocument()
  })

  it('hides the video field when five photos already fill the step', () => {
    render(<Harness photos={['/a.jpg', '/b.jpg', '/c.jpg', '/d.jpg', '/e.jpg']} />)
    expect(screen.queryByLabelText(/Vidéo YouTube/)).not.toBeInTheDocument()
    expect(screen.getByText('Retirez une photo pour ajouter une vidéo.')).toBeInTheDocument()
  })
})

describe('054 AC-05-03 — multiple upload in the step editor', () => {
  const originalFetch = globalThis.fetch
  afterEach(() => { globalThis.fetch = originalFetch })

  it('adds several photos at once without exceeding five media', async () => {
    const { act } = await import('@testing-library/react')
    let call = 0
    globalThis.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ url: `/u${++call}.webp` }) })) as unknown as typeof fetch
    const { container } = render(<Harness photos={['/a.jpg', '/b.jpg']} />)
    const input = container.querySelector('input[type="file"]') as HTMLInputElement
    expect(input).toHaveAttribute('multiple')

    await act(async () => {
      fireEvent.change(input, { target: { files: ['1', '2', '3', '4'].map(name => new File(['x'], `${name}.png`, { type: 'image/png' })) } })
    })

    expect(JSON.parse(screen.getByTestId('state').textContent ?? '[]')).toEqual(['/a.jpg', '/b.jpg', '/u1.webp', '/u2.webp', '/u3.webp'])
    expect(screen.getByText('5 / 5 médias')).toBeInTheDocument()
  })
})
