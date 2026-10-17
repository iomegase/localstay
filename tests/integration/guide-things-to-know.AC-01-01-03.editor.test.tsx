/** @jest-environment jsdom */

import { fireEvent, render, screen } from '@testing-library/react'
import { useState } from 'react'
import { ThingsToKnowEditor } from '@/features/guide-customization/components/ThingsToKnowEditor'
import { validateGuideForm } from '@/features/guide-customization/lib/form-errors'
import type { ThingToKnowInput } from '@/features/guide-customization/types'

function Harness({ initialValue = [] }: { initialValue?: ThingToKnowInput[] }) {
  const [value, setValue] = useState(initialValue)
  return (
    <>
      <ThingsToKnowEditor value={value} onChange={setValue} lodgingId="l1" />
      <pre data-testid="state">{JSON.stringify(value)}</pre>
    </>
  )
}

const state = () => JSON.parse(screen.getByTestId('state').textContent ?? '[]') as ThingToKnowInput[]

// Spec 099 US-01 — éditeur « Choses à savoir » de la page Guide.
describe('099 US-01 — ThingsToKnowEditor', () => {
  it('AC-01-01 : ajoute une carte avec titre, description et photos', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: /ajouter une chose à savoir/i }))
    fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'Volets' } })
    fireEvent.change(screen.getByLabelText('Description (optionnelle)'), { target: { value: 'Télécommande sur la cheminée.' } })

    expect(state()).toEqual([
      { id: expect.stringMatching(/^tmp-/), title: 'Volets', body: 'Télécommande sur la cheminée.', photos: [], sort_order: 0 },
    ])
    expect(screen.getByText('0 / 5 photos')).toBeInTheDocument()
  })

  it('AC-01-02 : retire une photo et supprime une carte', () => {
    render(<Harness initialValue={[{ id: 'k1', title: 'Volets', body: null, photos: ['/a.jpg', '/b.jpg'], sort_order: 0 }]} />)

    fireEvent.click(screen.getByRole('button', { name: 'Retirer la photo 1' }))
    expect(state()[0].photos).toEqual(['/b.jpg'])

    fireEvent.click(screen.getByRole('button', { name: 'Supprimer la carte 1' }))
    expect(state()).toEqual([])
  })

  it('BR-01 : à 5 photos, le téléversement est remplacé par la limite', () => {
    render(<Harness initialValue={[{ id: 'k1', title: 'Volets', body: null, photos: ['1', '2', '3', '4', '5'], sort_order: 0 }]} />)
    expect(screen.getByText('Limite atteinte : 5 photos.')).toBeInTheDocument()
  })

  it('AC-01-03 : une carte sans titre bloque l’enregistrement', () => {
    expect(validateGuideForm({
      arrival_instructions: [],
      practical_blocks: [],
      things_to_know: [{ title: 'Volets' }, { title: '  ' }],
    })).toEqual({ 'things_to_know.1.title': 'Le titre est requis.' })
  })
})
