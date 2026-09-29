/** @jest-environment jsdom */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AdminPoiEditForm } from '@/features/admin-pois/components/AdminPoiEditForm'
import type { AdminPoiDetail } from '@/features/admin-pois/types'

const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }))

jest.mock('@/features/trail-navigation/components/TrailPreviewMap', () => ({ TrailPreviewMap: () => null }))
jest.mock('@/shared/components/ImageUpload', () => ({ ImageUpload: () => null }))

const poi: AdminPoiDetail = {
  id: '44444444-4444-4444-8444-444444444444', name: 'Refuge du Mont-Joly', slug: 'refuge-mont-joly',
  address: 'Saint-Gervais-les-Bains', description: 'Description actuelle.', website: null, phone: null,
  status: 'active', city: { id: 'city', name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais' },
  category: { id: 'category', name: 'Refuges', slug: 'refuges' }, subcategory: null,
  photos: [], tags: [], latitude: 45.8, longitude: 6.7, geocode_status: 'success', photo_count: 0,
  primary_photo_url: null, photos_status: 'ok', review_source: 'MANUAL', merchant_attached: false,
  has_trail_detail: false, updated_at: '2026-09-28T10:00:00.000Z', discovery_status: 'DRAFT',
  discovery_published_at: null, public_url: null, slug_editable: false, trail_fields_locked: false,
  trail_detail: null, discovery_public_url: null,
  discovery_eligibility: { eligible: false, checks: { active: true, city: true, category: true, subcategory: true, description: true, photo: false, address: true, geocode: true, contact: false } },
}
const proposal = { description: 'Ce chalet accueille les randonneurs. Une restauration familiale y est proposée.', source_mode: 'web_search', sources: [{ title: 'Office de tourisme', url: 'https://tourisme.example/refuge' }], search_entry_point: '<div>Google Search</div>' }
const mockFetch = jest.fn()
const originalFetch = global.fetch
beforeEach(() => { jest.clearAllMocks(); global.fetch = mockFetch; mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: proposal }) }) })
afterAll(() => { global.fetch = originalFetch })
function mount(value = poi) { return render(<AdminPoiEditForm poi={value} categories={[poi.category]} />) }
async function generate() {
  fireEvent.click(screen.getByRole('button', { name: 'Proposer une description' }))
  return screen.findByRole('textbox', { name: 'Proposition à relire' })
}

it('AC-05/06: generation is separate, edited acceptance is local, save sends only the accepted text', async () => {
  mount()
  const draft = await generate()
  expect(screen.getByRole('textbox', { name: 'Description', exact: true })).toHaveValue(poi.description)
  expect(screen.getByRole('link', { name: 'Office de tourisme' })).toHaveAttribute('href', proposal.sources[0].url)
  const frame = screen.getByTitle('Suggestions de recherche Google')
  expect(frame).toHaveAttribute('sandbox', 'allow-popups allow-popups-to-escape-sandbox')
  expect(frame.getAttribute('srcdoc')).toContain("default-src 'none'")
  fireEvent.change(draft, { target: { value: 'Description corrigée et validée.' } })
  fireEvent.click(screen.getByRole('button', { name: 'Utiliser cette proposition' }))
  expect(screen.getByRole('textbox', { name: 'Description', exact: true })).toHaveValue('Description corrigée et validée.')
  expect(mockFetch).toHaveBeenCalledTimes(1)
  expect(mockRefresh).not.toHaveBeenCalled()
  expect(screen.queryByRole('textbox', { name: 'Proposition à relire' })).not.toBeInTheDocument()
  mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: poi }) })
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la fiche' }))
  await screen.findByText('Modifications enregistrées avec succès')
  const [url, options] = mockFetch.mock.calls[1]
  expect(url).toBe(`/api/admin/pois/${poi.id}`)
  expect(options.method).toBe('PATCH')
  expect(JSON.parse(options.body)).toMatchObject({ description: 'Description corrigée et validée.' })
  expect(JSON.parse(options.body)).not.toHaveProperty('discovery_status')
  expect(mockRefresh).toHaveBeenCalledTimes(1)
})

it('AC-07: cancellation preserves all unsaved description edits', async () => {
  mount()
  fireEvent.change(screen.getByRole('textbox', { name: 'Description', exact: true }), { target: { value: 'Saisie en cours.' } })
  await generate()
  fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))
  expect(screen.getByRole('textbox', { name: 'Description', exact: true })).toHaveValue('Saisie en cours.')
  expect(mockFetch).toHaveBeenCalledTimes(1)
})

it('022 AC-02-02/03-05: saves a description without resubmitting unchanged legacy photos', async () => {
  const photos = ['https://www.lafoliedouce.com/images/logos/folie-douce-corporate-noir.png', 'https://example.com/photo.jpg']
  mount({ ...poi, photos })
  fireEvent.change(screen.getByLabelText('Description'), { target: { value: 'Description relue.' } })
  mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: { ...poi, photos } }) })
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la fiche' }))
  await screen.findByText('Modifications enregistrées avec succès')
  expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toMatchObject({ description: 'Description relue.' })
  expect(JSON.parse(mockFetch.mock.calls[0][1].body)).not.toHaveProperty('photos')
  expect(screen.getByRole('img', { name: 'Photo 1' })).toHaveAttribute('src', photos[0])
  await waitFor(() => expect(screen.getByRole('button', { name: 'Enregistrer la fiche' })).toBeEnabled())

  fireEvent.click(screen.getByRole('button', { name: /Effacer Photo 1/i }))
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la fiche' }))
  await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2))
  await waitFor(() => expect(mockRefresh).toHaveBeenCalledTimes(2))
  expect(JSON.parse(mockFetch.mock.calls[1][1].body)).toMatchObject({ photos: [photos[1]] })
  await waitFor(() => expect(screen.getByRole('button', { name: 'Enregistrer la fiche' })).toBeEnabled())

  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la fiche' }))
  await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(3))
  expect(JSON.parse(mockFetch.mock.calls[2][1].body)).not.toHaveProperty('photos')
})

it('022 BR-19: displays failed saves as errors and keeps changed photos pending', async () => {
  mount({ ...poi, photos: ['https://example.com/photo.jpg', 'https://example.com/photo-2.jpg'] })
  mockFetch.mockResolvedValue({ ok: false, json: async () => ({ error: { message: 'Photos invalides' } }) })
  fireEvent.click(screen.getByRole('button', { name: /Effacer Photo 1/i }))
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la fiche' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Photos invalides')
  expect(mockRefresh).not.toHaveBeenCalled()
  await waitFor(() => expect(screen.getByRole('button', { name: 'Enregistrer la fiche' })).toBeEnabled())
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la fiche' }))
  await waitFor(() => expect(mockFetch).toHaveBeenCalledTimes(2))
  expect(JSON.parse(mockFetch.mock.calls[1][1].body)).toMatchObject({ photos: ['https://example.com/photo-2.jpg'] })
})

it('022 AC-03-05: identifies the invalid photo when a legacy list is changed', async () => {
  mount({ ...poi, photos: ['https://www.lafoliedouce.com/images/logos/folie-douce-corporate-noir.png', 'https://example.com/photo.jpg'] })
  fireEvent.click(screen.getByRole('button', { name: /Définir Photo 2 comme hero/i }))
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la fiche' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(/Photo 2.*non exploitable/)
  expect(mockFetch).not.toHaveBeenCalled()
  expect(screen.getByRole('img', { name: 'Photo 2' })).toHaveAttribute('src', 'https://www.lafoliedouce.com/images/logos/folie-douce-corporate-noir.png')
  fireEvent.click(screen.getByRole('button', { name: /Effacer Photo 2/i }))
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la fiche' }))
  await screen.findByText('Modifications enregistrées avec succès')
  expect(JSON.parse(mockFetch.mock.calls[0][1].body)).toMatchObject({ photos: ['https://example.com/photo.jpg'] })
})

it.each(['Nom', 'Adresse postale complète', 'Site web'])('requires saving changed identity field %s', async label => {
  mount()
  fireEvent.change(screen.getByRole('textbox', { name: label, exact: true }), { target: { value: 'Valeur modifiée' } })
  expect(screen.getByRole('button', { name: 'Proposer une description' })).toBeDisabled()
  expect(screen.getByText(/Enregistrez les modifications du nom/)).toHaveAttribute('role', 'status')
  expect(mockFetch).not.toHaveBeenCalled()
})

it('unlocks generation after identity changes have been saved', async () => {
  mount()
  fireEvent.change(screen.getByRole('textbox', { name: 'Nom', exact: true }), { target: { value: 'Nom corrigé' } })
  mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: { ...poi, name: 'Nom corrigé' } }) })
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la fiche' }))
  await screen.findByText('Modifications enregistrées avec succès')
  await waitFor(() => expect(screen.getByRole('button', { name: 'Proposer une description' })).toBeEnabled())
})

it('does not treat normalized website whitespace as unsaved after a successful save', async () => {
  mount()
  fireEvent.change(screen.getByRole('textbox', { name: 'Site web', exact: true }), { target: { value: ' https://refuge.example/ ' } })
  mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: { ...poi, website: 'https://refuge.example/' } }) })
  fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la fiche' }))
  await screen.findByText('Modifications enregistrées avec succès')
  expect(screen.getByRole('button', { name: 'Proposer une description' })).toBeEnabled()
})

it('prevents accepting a proposal after identity edits and rejects invalid draft lengths', async () => {
  mount()
  const draft = await generate()
  fireEvent.change(draft, { target: { value: ' ' } })
  expect(screen.getByRole('button', { name: 'Utiliser cette proposition' })).toBeDisabled()
  fireEvent.change(draft, { target: { value: 'x'.repeat(2001) } })
  expect(screen.getByRole('button', { name: 'Utiliser cette proposition' })).toBeDisabled()
  fireEvent.change(draft, { target: { value: 'Texte corrigé.' } })
  fireEvent.change(screen.getByRole('textbox', { name: 'Nom', exact: true }), { target: { value: 'Autre POI' } })
  expect(screen.getByRole('button', { name: 'Utiliser cette proposition' })).toBeDisabled()
})

it('AC-04: shows errors and keeps the current description', async () => {
  mount()
  mockFetch.mockResolvedValue({ ok: false, json: async () => ({ error: { message: 'Site officiel illisible.' } }) })
  fireEvent.click(screen.getByRole('button', { name: 'Proposer une description' }))
  expect(await screen.findByRole('alert')).toHaveTextContent('Site officiel illisible.')
  expect(screen.getByRole('textbox', { name: 'Description', exact: true })).toHaveValue(poi.description)
})

it('deduplicates clicks and ignores late results after cancellation', async () => {
  let resolve: (value: unknown) => void = () => {}
  mockFetch.mockReturnValue(new Promise(done => { resolve = done }))
  mount()
  const button = screen.getByRole('button', { name: 'Proposer une description' })
  fireEvent.click(button)
  fireEvent.click(button)
  expect(mockFetch).toHaveBeenCalledTimes(1)
  fireEvent.click(screen.getByRole('button', { name: 'Annuler' }))
  await act(async () => { resolve({ ok: true, json: async () => ({ data: proposal }) }) })
  await waitFor(() => expect(screen.queryByRole('textbox', { name: 'Proposition à relire' })).not.toBeInTheDocument())
})

it('disables suggestions for archived POIs', () => {
  mount({ ...poi, status: 'archived' })
  expect(screen.getByRole('button', { name: 'Proposer une description' })).toBeDisabled()
})
