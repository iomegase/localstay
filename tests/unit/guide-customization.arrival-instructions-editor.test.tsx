/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { ArrivalInstructionsEditor } from '@/features/guide-customization/components/ArrivalInstructionsEditor'

describe('ArrivalInstructionsEditor', () => {
  it('adds an empty instruction', () => {
    const onChange = jest.fn()
    render(<ArrivalInstructionsEditor value={[]} onChange={onChange} lodgingId="l1" />)

    fireEvent.click(screen.getByRole('button', { name: /ajouter une instruction/i }))

    expect(onChange).toHaveBeenCalledWith([
      { id: expect.any(String), text: '', video_url: null, photos: [], sort_order: 0 },
    ])
  })

  it('edits the instruction text', () => {
    const onChange = jest.fn()
    render(
      <ArrivalInstructionsEditor
        value={[{ id: 'a', text: '', video_url: null, photos: [], sort_order: 0 }]}
        onChange={onChange}
        lodgingId="l1"
      />,
    )

    fireEvent.change(screen.getByLabelText(/texte de l'instruction/i), {
      target: { value: 'Ouvrez le portail' },
    })

    expect(onChange).toHaveBeenCalledWith([
      { id: 'a', text: 'Ouvrez le portail', video_url: null, photos: [], sort_order: 0 },
    ])
  })

  it('removes a photo from an instruction', () => {
    const onChange = jest.fn()
    render(
      <ArrivalInstructionsEditor
        value={[
          { id: 'a', text: 'x', video_url: null, photos: ['a.jpg', 'b.jpg'], sort_order: 0 },
        ]}
        onChange={onChange}
        lodgingId="l1"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /retirer la photo 1/i }))

    expect(onChange).toHaveBeenCalledWith([
      { id: 'a', text: 'x', video_url: null, photos: ['b.jpg'], sort_order: 0 },
    ])
  })

  it('removes an instruction', () => {
    const onChange = jest.fn()
    render(
      <ArrivalInstructionsEditor
        value={[{ id: 'a', text: 'x', video_url: null, photos: [], sort_order: 0 }]}
        onChange={onChange}
        lodgingId="l1"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /supprimer l'instruction/i }))

    expect(onChange).toHaveBeenCalledWith([])
  })
})
