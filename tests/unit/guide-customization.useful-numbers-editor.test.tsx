/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { UsefulNumbersEditor } from '@/features/guide-customization/components/UsefulNumbersEditor'

describe('UsefulNumbersEditor', () => {
  it('renders existing rows parsed from the serialized value', () => {
    render(
      <UsefulNumbersEditor
        value="Office de tourisme: 04 50 47 76 08"
        onChange={jest.fn()}
      />,
    )

    expect((screen.getByLabelText('Catégorie') as HTMLSelectElement).value).toBe(
      'tourisme',
    )
    expect((screen.getByLabelText('Téléphone') as HTMLInputElement).value).toBe(
      '04 50 47 76 08',
    )
  })

  it('adds a row and serializes the preset category with the phone', () => {
    const onChange = jest.fn()
    render(<UsefulNumbersEditor value={null} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: /ajouter/i }))
    fireEvent.change(screen.getByLabelText('Téléphone'), {
      target: { value: '04 50 00 00 00' },
    })

    expect(onChange).toHaveBeenLastCalledWith(
      'Office de tourisme: 04 50 00 00 00',
    )
  })

  it('uses the custom label when the category is "autre"', () => {
    const onChange = jest.fn()
    render(<UsefulNumbersEditor value={null} onChange={onChange} />)

    fireEvent.click(screen.getByRole('button', { name: /ajouter/i }))
    fireEvent.change(screen.getByLabelText('Catégorie'), {
      target: { value: 'autre' },
    })
    fireEvent.change(screen.getByLabelText('Libellé personnalisé'), {
      target: { value: 'Boulangerie' },
    })
    fireEvent.change(screen.getByLabelText('Téléphone'), {
      target: { value: '04 50 11 22 33' },
    })

    expect(onChange).toHaveBeenLastCalledWith('Boulangerie: 04 50 11 22 33')
  })

  it('removes a row', () => {
    const onChange = jest.fn()
    render(
      <UsefulNumbersEditor value="Mairie: 04 50 47 75 66" onChange={onChange} />,
    )

    fireEvent.click(screen.getByRole('button', { name: /supprimer/i }))

    expect(onChange).toHaveBeenLastCalledWith('')
  })
})
