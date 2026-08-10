/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { ArrivalInstructionsEditor } from '@/features/guide-customization/components/ArrivalInstructionsEditor'

function Harness({ initialValue = [] }: { initialValue?: Array<{ id?: string; title?: string | null; text: string; video_url: string | null; photos: string[]; sort_order: number }> }) {
  const [value, setValue] = useState(initialValue)
  return (
    <>
      <ArrivalInstructionsEditor value={value} onChange={setValue} lodgingId="l1" />
      <pre data-testid="state">{JSON.stringify(value)}</pre>
    </>
  )
}

describe('ArrivalInstructionsEditor', () => {
  it('adds an empty instruction', () => {
    const onChange = jest.fn()
    render(<ArrivalInstructionsEditor value={[]} onChange={onChange} lodgingId="l1" />)

    fireEvent.click(screen.getByRole('button', { name: /ajouter une instruction/i }))

    expect(onChange).toHaveBeenCalledWith([
      { id: expect.any(String), title: '', text: '', video_url: null, photos: [], sort_order: 0 },
    ])
  })

  it('edits the title and instruction text', async () => {
    const user = userEvent.setup()
    render(
      <Harness
        initialValue={[{ id: 'a', title: '', text: '', video_url: null, photos: [], sort_order: 0 }]}
      />,
    )

    const titleInput = screen.getByLabelText(/titre de l'étape/i)
    await user.clear(titleInput)
    await user.type(titleInput, 'Bienvenue à la Pieuca')

    const textArea = screen.getByLabelText(/texte de l'instruction/i)
    await user.clear(textArea)
    await user.type(textArea, 'Ouvrez le portail')

    expect(screen.getByTestId('state').textContent).toContain('"title":"Bienvenue à la Pieuca"')
    expect(screen.getByTestId('state').textContent).toContain('"text":"Ouvrez le portail"')
  })

  it('provides drag handles to reorder instructions', () => {
    render(
      <ArrivalInstructionsEditor
        value={[
          { id: 'a', text: 'Première étape', video_url: null, photos: [], sort_order: 0 },
          { id: 'b', text: 'Deuxième étape', video_url: null, photos: [], sort_order: 1 },
        ]}
        onChange={jest.fn()}
        lodgingId="l1"
      />,
    )

    expect(screen.getAllByRole('button', { name: /déplacer l'instruction/i })).toHaveLength(2)
  })

  it('removes a photo from an instruction', () => {
    const onChange = jest.fn()
    render(
      <ArrivalInstructionsEditor
        value={[
          { id: 'a', title: '', text: 'x', video_url: null, photos: ['a.jpg', 'b.jpg'], sort_order: 0 },
        ]}
        onChange={onChange}
        lodgingId="l1"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /retirer la photo 1/i }))

    expect(onChange).toHaveBeenCalledWith([
      { id: 'a', title: '', text: 'x', video_url: null, photos: ['b.jpg'], sort_order: 0 },
    ])
  })

  it('removes an instruction', () => {
    const onChange = jest.fn()
    render(
      <ArrivalInstructionsEditor
        value={[{ id: 'a', title: '', text: 'x', video_url: null, photos: [], sort_order: 0 }]}
        onChange={onChange}
        lodgingId="l1"
      />,
    )

    fireEvent.click(screen.getByRole('button', { name: /supprimer l'instruction/i }))

    expect(onChange).toHaveBeenCalledWith([])
  })
})
