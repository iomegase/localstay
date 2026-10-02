/** @jest-environment jsdom */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { ArrivalInstructionsEditor } from '@/features/guide-customization/components/ArrivalInstructionsEditor'
import type { ArrivalInstructionInput } from '@/features/guide-customization/types'

function Harness() {
  const [value, setValue] = useState<ArrivalInstructionInput[]>([
    { id: 'a', title: 'Garage', text: 'Deux places', video_url: null, photos: [], sort_order: 0 },
  ])
  return (
    <>
      <ArrivalInstructionsEditor value={value} onChange={setValue} lodgingId="l1" />
      <pre data-testid="state">{JSON.stringify(value)}</pre>
    </>
  )
}

const state = () => JSON.parse(screen.getByTestId('state').textContent ?? '[]')[0]

describe('054 AC-05-01 — arrival step editor', () => {
  it('edits the step kind, tip, substeps and facts', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.selectOptions(screen.getByLabelText(/type d'étape/i), 'garage')
    await user.type(screen.getByLabelText(/conseil/i), 'Hauteur 1,90 m')

    await user.click(screen.getByRole('button', { name: /ajouter une sous-étape/i }))
    await user.type(screen.getByLabelText(/sous-étape 1 — titre/i), 'Rampe')
    await user.type(screen.getByLabelText(/sous-étape 1 — détail/i), 'À l’arrière')

    await user.click(screen.getByRole('button', { name: /ajouter un repère/i }))
    await user.type(screen.getByLabelText(/repère 1 — libellé/i), 'Niveau')
    await user.type(screen.getByLabelText(/repère 1 — valeur/i), '-2')

    expect(state()).toMatchObject({
      kind: 'garage',
      tip: 'Hauteur 1,90 m',
      substeps: [{ title: 'Rampe', detail: 'À l’arrière' }],
      facts: [{ label: 'Niveau', value: '-2' }],
    })

    await user.click(screen.getByRole('button', { name: /retirer la sous-étape 1/i }))
    await user.click(screen.getByRole('button', { name: /retirer le repère 1/i }))
    expect(state()).toMatchObject({ substeps: [], facts: [] })
  })
})
