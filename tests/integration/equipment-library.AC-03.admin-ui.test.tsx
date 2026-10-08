/** @jest-environment jsdom */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom'

const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }))

import { AdminEquipmentLibrary } from '@/features/equipment-library/components/AdminEquipmentLibrary'

const templates = [
  { id: 't1', title: 'Machine à café', icon: 'info', body: 'Code du placard : 1234', status: 'pending' as const, created_at: '' },
  { id: 't2', title: 'Télévision', icon: 'tv', body: null, status: 'approved' as const, created_at: '' },
]

describe('spec 095 AC-03 — administration de la bibliothèque', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn(async () => ({ ok: true, json: async () => ({ data: {} }) })) as unknown as typeof fetch
  })

  it('l’admin corrige le texte puis valide : une seule requête avec le texte et le statut', async () => {
    render(<AdminEquipmentLibrary templates={templates} />)
    const first = screen.getAllByTestId('equipment-template')[0]!
    expect(within(first).getByText('À valider')).toBeInTheDocument()
    fireEvent.change(within(first).getByLabelText('Texte'), { target: { value: 'Capsules dans le placard.' } })
    fireEvent.click(within(first).getByRole('button', { name: 'Valider' }))
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled())
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0]
    expect(url).toBe('/api/admin/equipment-library/t1')
    expect(JSON.parse(init.body)).toEqual({ title: 'Machine à café', icon: 'info', body: 'Capsules dans le placard.', status: 'approved' })
  })

  it('un équipement validé peut être refusé ; « Enregistrer » n’apparaît qu’après modification', () => {
    render(<AdminEquipmentLibrary templates={templates} />)
    const second = screen.getAllByTestId('equipment-template')[1]!
    expect(within(second).queryByRole('button', { name: 'Valider' })).not.toBeInTheDocument()
    expect(within(second).queryByRole('button', { name: 'Enregistrer' })).not.toBeInTheDocument()
    fireEvent.change(within(second).getByLabelText('Nom de l’équipement'), { target: { value: 'Télévision connectée' } })
    expect(within(second).getByRole('button', { name: 'Enregistrer' })).toBeInTheDocument()
    expect(within(second).getByRole('button', { name: 'Refuser' })).toBeInTheDocument()
  })

  it('bibliothèque vide : message', () => {
    render(<AdminEquipmentLibrary templates={[]} />)
    expect(screen.getByText(/Aucun équipement pour l’instant/)).toBeInTheDocument()
  })
})
