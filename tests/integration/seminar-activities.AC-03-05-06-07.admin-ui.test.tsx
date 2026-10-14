/** @jest-environment jsdom */
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import type { SeminarActivityAdmin, SeminarSurfaceOption } from '@/features/seminar-activities/types'

const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }))
jest.mock('@/shared/components/ImageUpload', () => ({
  ImageUpload: ({ onUploaded, endpoint, label }: { onUploaded: (url: string) => void; endpoint: string; label: string }) => (
    <button type="button" data-endpoint={endpoint} onClick={() => onUploaded('https://cdn/new.webp')}>{label}</button>
  ),
}))

import { SeminarActivityEditor } from '@/features/seminar-activities/components/SeminarActivityEditor'
import { AdminSeminarActivities } from '@/features/seminar-activities/components/AdminSeminarActivities'

const ID = '5188960d-3b52-4b5c-b613-b7cfcf299a79'
const DEST = 'b6f3b1f0-1111-4a4a-9c9c-000000000001'
const surfaces: SeminarSurfaceOption[] = [{ destination_id: DEST, city_name: 'Saint-Gervais-les-Bains', seminar_published: true }]
const activity: SeminarActivityAdmin = {
  id: ID, slug: 'rafting', title: 'Rafting', category: 'SUMMER', description: 'Eaux vives', season_label: 'Été', level_label: 'Sportif',
  is_published: false, image_url: null, price_per_person_cents: 4500, price_per_group_cents: 20000, internal_notes: null,
  providers: [{ poi_id: 'poi-1', poi_name: 'Rafting Mont-Blanc', city_name: 'Passy', poi_deleted: true, notes: 'Tél. Léa' }],
  placements: [{ surface_key: 'hub', destination_id: null, position: 0 }],
}

type FetchCall = [string, RequestInit | undefined]
let fetchMock: jest.Mock

beforeEach(() => {
  jest.clearAllMocks()
  fetchMock = jest.fn(async (url: string) => ({
    ok: true,
    status: 200,
    json: async () => (url.includes('provider-search')
      ? { items: [{ poi_id: 'poi-2', poi_name: 'ESF Saint-Gervais', city_name: 'Saint-Gervais' }] }
      : { ...activity }),
  }))
  global.fetch = fetchMock as unknown as typeof fetch
})

function renderEditor(value: SeminarActivityAdmin | null = activity) {
  const onSaved = jest.fn()
  render(<SeminarActivityEditor activity={value} surfaces={surfaces} onSaved={onSaved} onClose={jest.fn()} />)
  return { onSaved }
}

describe('spec 097 AC-05 — prix internes et simulateur', () => {
  it('affiche les équivalents TTC et le total pour 10 participants par défaut', () => {
    renderEditor()
    expect(screen.getByText(/54,00\s€ TTC \(TVA 20 %\)/)).toBeInTheDocument()
    const simulator = screen.getByTestId('seminar-price-simulator')
    expect(within(simulator).getByLabelText('Participants')).toHaveValue('10')
    // 45 € × 10 + 200 € = 650 € HT, 780 € TTC.
    expect(simulator.textContent?.replace(/\s/g, ' ')).toContain('650,00 € HT · 780,00 € TTC')
    fireEvent.change(within(simulator).getByLabelText('Participants'), { target: { value: '30' } })
    expect(simulator.textContent?.replace(/\s/g, ' ')).toContain('1 550,00 € HT · 1 860,00 € TTC')
    expect(within(simulator).getAllByRole('option')).toHaveLength(30)
  })

  it('refuse un montant invalide avec une erreur en ligne, sans requête', () => {
    renderEditor()
    fireEvent.change(screen.getByLabelText(/Prix par personne HT/), { target: { value: '45,555' } })
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Montant invalide')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe('spec 097 AC-03 / AC-04 — image et publication', () => {
  it('publication désactivée sans image, puis possible après téléversement', () => {
    renderEditor()
    const toggle = screen.getByRole('switch')
    expect(toggle).toBeDisabled()
    const upload = screen.getByRole('button', { name: 'Téléverser une image' })
    expect(upload).toHaveAttribute('data-endpoint', `/api/admin/seminar-activities/${ID}/image`)
    fireEvent.click(upload)
    expect(screen.getByRole('switch')).toBeEnabled()
    expect(mockRefresh).toHaveBeenCalled()
  })

  it('une nouvelle activité doit être enregistrée avant l’image', () => {
    renderEditor(null)
    expect(screen.getByText('Enregistrez l’activité pour pouvoir ajouter son image.')).toBeInTheDocument()
    expect(screen.queryByRole('switch')).not.toBeInTheDocument()
  })
})

describe('spec 097 AC-06 / AC-07 — prestataires et diffusion', () => {
  it('enregistre la carte, les prestataires puis les surfaces', async () => {
    const { onSaved } = renderEditor()
    expect(screen.getByText('fiche supprimée')).toBeInTheDocument()

    jest.useFakeTimers()
    fireEvent.change(screen.getByLabelText('Ajouter un prestataire'), { target: { value: 'esf' } })
    await act(async () => { jest.advanceTimersByTime(300) })
    jest.useRealTimers()
    fireEvent.click(await screen.findByRole('button', { name: 'Ajouter' }))

    fireEvent.click(screen.getByLabelText(/Séminaires — Saint-Gervais-les-Bains/))
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(ID))

    const writes = (fetchMock.mock.calls as FetchCall[]).filter(([, init]) => init?.method && init.method !== 'GET')
    expect(writes.map(([url, init]) => `${init?.method} ${url}`)).toEqual([
      `PATCH /api/admin/seminar-activities/${ID}`,
      `PUT /api/admin/seminar-activities/${ID}/providers`,
      `PUT /api/admin/seminar-activities/${ID}/placements`,
    ])
    expect(JSON.parse(String(writes[0]![1]!.body))).toMatchObject({ price_per_person_cents: 4500, price_per_group_cents: 20000, is_published: false })
    expect(JSON.parse(String(writes[1]![1]!.body))).toEqual({ providers: [{ poi_id: 'poi-1', notes: 'Tél. Léa' }, { poi_id: 'poi-2', notes: null }] })
    expect(JSON.parse(String(writes[2]![1]!.body))).toEqual({ include_hub: true, destination_ids: [DEST] })
    expect(screen.getByRole('status')).toHaveTextContent('Activité enregistrée.')
  })

  it('affiche l’erreur serveur sans faux succès', async () => {
    fetchMock.mockResolvedValueOnce({ ok: false, status: 422, json: async () => ({ error: { code: 'IMAGE_REQUIRED', message: 'Ajoutez une image avant de publier l’activité' } }) })
    renderEditor()
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Ajoutez une image avant de publier l’activité')
    expect(screen.queryByRole('status')).not.toBeInTheDocument()
  })
})

describe('spec 097 UI admin — catalogue', () => {
  it('filtre par statut et résume prix, prestataires et surfaces', () => {
    const published = { ...activity, id: 'p', title: 'Yoga au chalet', category: 'WELLBEING' as const, image_url: 'https://cdn/y.webp', is_published: true, providers: [], placements: [{ surface_key: DEST, destination_id: DEST, position: 0 }] }
    render(<AdminSeminarActivities activities={[activity, published]} surfaces={surfaces} />)
    const rows = screen.getAllByTestId('seminar-activity-row')
    expect(within(rows[0]!).getByText('Sans image')).toBeInTheDocument()
    expect(rows[0]!.textContent?.replace(/\s/g, ' ')).toContain('45,00 € / pers. + 200,00 € / groupe HT · 1 prestataire · Page Séminaires')
    expect(rows[1]!.textContent).toContain('Saint-Gervais-les-Bains')
    fireEvent.change(screen.getByLabelText('Statut'), { target: { value: 'published' } })
    expect(screen.getAllByTestId('seminar-activity-row')).toHaveLength(1)
  })
})
