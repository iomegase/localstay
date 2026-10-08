/** @jest-environment jsdom */
import { fireEvent, render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PracticalBlocksEditor } from '@/features/guide-customization/components/PracticalBlocksEditor'
import type { PracticalBlockInput } from '@/features/guide-customization/types'

jest.mock('@/shared/components/ImageUpload', () => ({ ImageUpload: () => null }))

const library = [
  { id: 'l1', title: 'Machine à café', icon: 'info', body: 'Capsules Nespresso.', status: 'approved' as const, created_at: '' },
  { id: 'l2', title: 'Télévision', icon: 'tv', body: 'Chaînes TNT et Netflix.', status: 'approved' as const, created_at: '' },
  { id: 'l3', title: 'Lave-linge', icon: 'info', body: null, status: 'approved' as const, created_at: '' },
]
const existing: PracticalBlockInput[] = [{ id: 'b1', title: 'MACHINE A CAFE', body: 'Ma machine.', icon: 'info', photo_url: 'https://x/photo.jpg', video_url: null, sort_order: 0 }]

describe('spec 095 — section Équipements', () => {
  it('AC-01-01 : section renommée', () => {
    render(<PracticalBlocksEditor value={[]} onChange={jest.fn()} lodgingId="lodging-1" />)
    expect(screen.getByRole('heading', { name: 'Équipements' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /ajouter un équipement/i })).toBeInTheDocument()
    expect(screen.queryByText('Blocs personnalisés')).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /bibliothèque/i })).not.toBeInTheDocument()
  })

  it('AC-04-01 / AC-04-02 / BR-02 : propose les équipements absents, ajoute des copies sans photo', () => {
    const onChange = jest.fn()
    render(<PracticalBlocksEditor value={existing} onChange={onChange} lodgingId="lodging-1" library={library} />)
    fireEvent.click(screen.getByRole('button', { name: /ajouter depuis la bibliothèque/i }))
    const picker = screen.getByTestId('equipment-library-picker')
    expect(within(picker).queryByText('Machine à café')).not.toBeInTheDocument()
    expect(within(picker).getByText('Télévision')).toBeInTheDocument()
    expect(within(picker).getByRole('button', { name: 'Ajouter (0)' })).toBeDisabled()

    fireEvent.click(within(picker).getByLabelText('Tout sélectionner'))
    fireEvent.click(within(picker).getByRole('button', { name: 'Ajouter (2)' }))
    const next = onChange.mock.calls[0][0] as PracticalBlockInput[]
    expect(next).toHaveLength(3)
    expect(next[0]).toBe(existing[0])
    expect(next.slice(1).map(block => [block.title, block.icon, block.body, block.photo_url, block.video_url, block.sort_order])).toEqual([
      ['Télévision', 'tv', 'Chaînes TNT et Netflix.', null, null, 1],
      ['Lave-linge', 'info', null, null, null, 2],
    ])
    expect(next[1]!.id).toMatch(/^tmp-/)
  })

  it('tout est déjà présent : message, aucune case', () => {
    render(<PracticalBlocksEditor value={existing} onChange={jest.fn()} lodgingId="lodging-1" library={[library[0]!]} />)
    fireEvent.click(screen.getByRole('button', { name: /ajouter depuis la bibliothèque/i }))
    expect(screen.getByText('Tous les équipements de la bibliothèque sont déjà dans votre guide.')).toBeInTheDocument()
  })
})
