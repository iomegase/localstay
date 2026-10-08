/** @jest-environment jsdom */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom'

const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }))
jest.mock('@/shared/components/ImageUpload', () => ({
  ImageUpload: ({ onUploaded, endpoint }: { onUploaded: (url: string) => void; endpoint: string }) => (
    <button type="button" data-endpoint={endpoint} onClick={() => onUploaded('https://cdn/new.webp')}>Téléverser une photo</button>
  ),
}))

import { AdminEquipmentLibrary } from '@/features/equipment-library/components/AdminEquipmentLibrary'

const templates = [
  { id: 't1', title: 'Machine à café', icon: 'info', body: 'Code du placard : 1234', photo_url: 'https://cdn/cafe.webp', video_url: null, status: 'pending' as const, created_at: '' },
  { id: 't2', title: 'Télévision', icon: 'tv', body: null, photo_url: null, video_url: null, status: 'approved' as const, created_at: '' },
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
    expect(JSON.parse(init.body)).toEqual({
      title: 'Machine à café', icon: 'info', body: 'Capsules dans le placard.', photo_url: 'https://cdn/cafe.webp', video_url: null, status: 'approved',
    })
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

  it('spec 096 AC-01-02 : l’admin téléverse une photo (endpoint admin) puis enregistre ; il peut la retirer', async () => {
    render(<AdminEquipmentLibrary templates={templates} />)
    const second = screen.getAllByTestId('equipment-template')[1]!
    const upload = within(second).getByRole('button', { name: 'Téléverser une photo' })
    expect(upload).toHaveAttribute('data-endpoint', '/api/admin/equipment-library/photo')
    fireEvent.click(upload)
    expect(within(second).getByRole('img', { name: 'Photo de l’équipement' })).toHaveAttribute('src', 'https://cdn/new.webp')
    fireEvent.change(within(second).getByLabelText('Vidéo YouTube (optionnelle)'), { target: { value: 'https://youtu.be/abc12345678' } })
    fireEvent.click(within(second).getByRole('button', { name: 'Enregistrer' }))
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled())
    expect(JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)).toMatchObject({ photo_url: 'https://cdn/new.webp', video_url: 'https://youtu.be/abc12345678' })

    const first = screen.getAllByTestId('equipment-template')[0]!
    fireEvent.click(within(first).getByRole('button', { name: 'Retirer la photo' }))
    expect(within(first).queryByRole('img', { name: 'Photo de l’équipement' })).not.toBeInTheDocument()
    expect(within(first).getByRole('button', { name: 'Enregistrer' })).toBeInTheDocument()
  })

  it('spec 096 AC-01-01 : « Nouvel équipement » crée un équipement validé', async () => {
    global.fetch = jest.fn(async () => ({ ok: true, status: 201, json: async () => ({ data: {} }) })) as unknown as typeof fetch
    render(<AdminEquipmentLibrary templates={[]} />)
    fireEvent.click(screen.getByRole('button', { name: /nouvel équipement/i }))
    const form = screen.getByTestId('equipment-template-new')
    expect(within(form).getByRole('button', { name: 'Créer' })).toBeDisabled()
    fireEvent.change(within(form).getByLabelText('Nom de l’équipement'), { target: { value: 'Barbecue' } })
    fireEvent.change(within(form).getByLabelText('Icône'), { target: { value: 'umbrella' } })
    fireEvent.change(within(form).getByLabelText('Texte'), { target: { value: 'Sur la terrasse.' } })
    fireEvent.click(within(form).getByRole('button', { name: 'Téléverser une photo' }))
    fireEvent.click(within(form).getByRole('button', { name: 'Créer' }))
    await waitFor(() => expect(mockRefresh).toHaveBeenCalled())
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0]
    expect([url, init.method]).toEqual(['/api/admin/equipment-library', 'POST'])
    expect(JSON.parse(init.body)).toEqual({ title: 'Barbecue', icon: 'umbrella', body: 'Sur la terrasse.', photo_url: 'https://cdn/new.webp', video_url: null })
    expect(screen.queryByTestId('equipment-template-new')).not.toBeInTheDocument()
  })
})
