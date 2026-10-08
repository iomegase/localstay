/** @jest-environment jsdom */
import { fireEvent, render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { useState } from 'react'
import { PracticalBlocksEditor } from '@/features/guide-customization/components/PracticalBlocksEditor'
import type { PracticalBlockInput } from '@/features/guide-customization/types'
import type { EquipmentTemplate } from '@/features/equipment-library/types'

const template = (patch: Partial<EquipmentTemplate>): EquipmentTemplate => ({
  id: 't', title: '', icon: 'info', body: null, photo_url: null, video_url: null, status: 'approved', created_at: '', ...patch,
})
const library = [
  template({ id: 't1', title: 'Machine à café', icon: 'utensils', body: 'Capsules Nespresso.', photo_url: 'https://cdn/cafe.webp' }),
  template({ id: 't2', title: 'Télévision', icon: 'tv', body: 'Chaînes TNT.', video_url: 'https://youtu.be/abc12345678' }),
  template({ id: 't3', title: 'Lave-linge', icon: 'info' }),
]
const linked: PracticalBlockInput = {
  id: 'b1', equipment_template_id: 't1', title: 'Cafetière Nespresso', body: 'Ma machine.', icon: 'utensils',
  photo_url: 'https://cdn/cafe.webp', video_url: null, sort_order: 0,
}

function Harness({ initial = [] as PracticalBlockInput[], lib = library }) {
  const [value, setValue] = useState<PracticalBlockInput[]>(initial)
  return (
    <>
      <PracticalBlocksEditor value={value} onChange={setValue} library={lib} />
      <pre data-testid="state">{JSON.stringify(value)}</pre>
    </>
  )
}
const state = () => JSON.parse(screen.getByTestId('state').textContent ?? '[]') as PracticalBlockInput[]

describe('spec 096 US-02 — équipements choisis dans la bibliothèque', () => {
  it('AC-02-01 : « Ajouter un équipement » ouvre la bibliothèque privée des équipements déjà présents ; pas de saisie libre', () => {
    render(<Harness initial={[linked]} />)
    fireEvent.click(screen.getByRole('button', { name: /ajouter un équipement/i }))
    const picker = screen.getByTestId('equipment-library-picker')
    expect(within(picker).queryByText('Machine à café')).not.toBeInTheDocument()
    expect(within(picker).getByText('Télévision')).toBeInTheDocument()
    expect(within(picker).getByText('Lave-linge')).toBeInTheDocument()
    expect(state()).toHaveLength(1) // ouvrir ne crée rien
  })

  it('AC-02-01 : recherche sans casse ni accents, puis ajout avec nom, texte et lien', () => {
    render(<Harness />)
    fireEvent.click(screen.getByRole('button', { name: /ajouter un équipement/i }))
    const picker = screen.getByTestId('equipment-library-picker')
    fireEvent.change(within(picker).getByRole('searchbox'), { target: { value: 'TELE' } })
    expect(within(picker).queryByText('Lave-linge')).not.toBeInTheDocument()
    fireEvent.click(within(picker).getByLabelText(/Télévision/))
    fireEvent.click(within(picker).getByRole('button', { name: 'Ajouter (1)' }))
    expect(state().map(block => [block.equipment_template_id, block.title, block.body, block.icon, block.video_url])).toEqual([
      ['t2', 'Télévision', 'Chaînes TNT.', 'tv', 'https://youtu.be/abc12345678'],
    ])
    expect(screen.queryByTestId('equipment-library-picker')).not.toBeInTheDocument()
  })

  it('AC-02-02 : bibliothèque vide ou épuisée', () => {
    render(<Harness lib={[]} />)
    fireEvent.click(screen.getByRole('button', { name: /ajouter un équipement/i }))
    expect(screen.getByText('Aucun équipement disponible pour l’instant.')).toBeInTheDocument()
  })

  it('AC-02-03 : nom et texte modifiables ; photo et icône en lecture seule, sans téléversement ni choix d’icône', () => {
    render(<Harness initial={[linked]} />)
    fireEvent.change(screen.getByLabelText('Nom de l’équipement'), { target: { value: 'Machine Nespresso' } })
    fireEvent.change(screen.getByLabelText('Texte'), { target: { value: 'Capsules dans le tiroir.' } })
    expect(state()[0]).toMatchObject({ title: 'Machine Nespresso', body: 'Capsules dans le tiroir.', icon: 'utensils', photo_url: 'https://cdn/cafe.webp' })
    expect(screen.getByRole('img', { name: 'Photo de l’équipement' })).toHaveAttribute('src', 'https://cdn/cafe.webp')
    expect(screen.getByText('Photo et icône gérées par MyStay')).toBeInTheDocument()
    expect(screen.queryByText(/téléverser/i)).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Skis' })).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/vidéo youtube/i)).not.toBeInTheDocument()
  })

  it('AC-02-04 : supprimer retire l’équipement du guide', () => {
    render(<Harness initial={[linked]} />)
    fireEvent.click(screen.getByRole('button', { name: /supprimer l’équipement/i }))
    expect(state()).toEqual([])
  })
})
