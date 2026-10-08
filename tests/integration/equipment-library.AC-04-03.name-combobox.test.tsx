/** @jest-environment jsdom */
import { fireEvent, render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PracticalBlocksEditor } from '@/features/guide-customization/components/PracticalBlocksEditor'
import type { PracticalBlockInput } from '@/features/guide-customization/types'

jest.mock('@/shared/components/ImageUpload', () => ({ ImageUpload: () => null }))

const library = [
  { id: 'l1', title: 'Machine à café', icon: 'utensils', body: 'Capsules Nespresso.', status: 'approved' as const, created_at: '' },
  { id: 'l2', title: 'Télévision', icon: 'tv', body: 'Chaînes TNT et Netflix.', status: 'approved' as const, created_at: '' },
  { id: 'l3', title: 'Lave-linge', icon: 'info', body: null, status: 'approved' as const, created_at: '' },
]
const block = (patch: Partial<PracticalBlockInput>): PracticalBlockInput => ({
  id: 'b1', title: '', body: null, icon: 'info', photo_url: null, video_url: null, sort_order: 0, ...patch,
})

describe('spec 095 AC-04-03 — select sur « Nom de l’équipement »', () => {
  it('liste au focus les équipements validés absents des autres équipements', () => {
    const value = [block({ id: 'b0', title: 'TELEVISION', sort_order: 0 }), block({ id: 'b1', sort_order: 1 })]
    render(<PracticalBlocksEditor value={value} onChange={jest.fn()} lodgingId="lodging-1" library={library} />)
    fireEvent.focus(screen.getAllByRole('combobox')[1]!)
    const list = screen.getByRole('listbox')
    expect(within(list).getAllByRole('option').map(option => option.textContent)).toEqual(['Lave-linge', 'Machine à café'])
  })

  it('filtre par le texte saisi (sans casse ni accents)', () => {
    render(<PracticalBlocksEditor value={[block({ title: 'cafe' })]} onChange={jest.fn()} lodgingId="lodging-1" library={library} />)
    fireEvent.focus(screen.getByRole('combobox'))
    expect(within(screen.getByRole('listbox')).getAllByRole('option').map(option => option.textContent)).toEqual(['Machine à café'])
  })

  it('choisir remplit nom, icône et texte vide', () => {
    const onChange = jest.fn()
    render(<PracticalBlocksEditor value={[block({ title: 'caf' })]} onChange={onChange} lodgingId="lodging-1" library={library} />)
    fireEvent.focus(screen.getByRole('combobox'))
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Machine à café' }))
    const next = onChange.mock.calls[0][0] as PracticalBlockInput[]
    expect([next[0]!.title, next[0]!.icon, next[0]!.body]).toEqual(['Machine à café', 'utensils', 'Capsules Nespresso.'])
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('ne remplace jamais un texte déjà saisi', () => {
    const onChange = jest.fn()
    render(<PracticalBlocksEditor value={[block({ body: 'Mon texte.' })]} onChange={onChange} lodgingId="lodging-1" library={library} />)
    fireEvent.focus(screen.getByRole('combobox'))
    fireEvent.mouseDown(screen.getByRole('option', { name: 'Télévision' }))
    const next = onChange.mock.calls[0][0] as PracticalBlockInput[]
    expect([next[0]!.title, next[0]!.icon, next[0]!.body]).toEqual(['Télévision', 'tv', 'Mon texte.'])
  })

  it('clavier : flèche bas puis Entrée choisit, Échap ferme', () => {
    const onChange = jest.fn()
    render(<PracticalBlocksEditor value={[block({})]} onChange={onChange} lodgingId="lodging-1" library={library} />)
    const input = screen.getByRole('combobox')
    fireEvent.focus(input)
    fireEvent.keyDown(input, { key: 'ArrowDown' })
    fireEvent.keyDown(input, { key: 'Enter' })
    expect((onChange.mock.calls[0][0] as PracticalBlockInput[])[0]!.title).toBe('Lave-linge')
    fireEvent.focus(input)
    fireEvent.keyDown(input, { key: 'Escape' })
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument()
  })

  it('saisie libre conservée et sans bibliothèque, simple champ texte', () => {
    const onChange = jest.fn()
    const { rerender } = render(<PracticalBlocksEditor value={[block({})]} onChange={onChange} lodgingId="lodging-1" library={library} />)
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'Barbecue' } })
    expect((onChange.mock.calls[0][0] as PracticalBlockInput[])[0]!.title).toBe('Barbecue')
    rerender(<PracticalBlocksEditor value={[block({})]} onChange={onChange} lodgingId="lodging-1" />)
    expect(screen.queryByRole('combobox')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Nom de l’équipement')).toBeInTheDocument()
  })
})
