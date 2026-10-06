/** @jest-environment jsdom */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { LodgingShowcaseForm } from '@/features/lodging-showcase/components/LodgingShowcaseForm'

let mockDragEnd: (event: { active: { id: string }; over: { id: string } | null }) => void
jest.mock('@dnd-kit/core', () => {
  const actual = jest.requireActual('@dnd-kit/core')
  return { ...actual, DndContext: (props: { children: React.ReactNode; onDragEnd: typeof mockDragEnd }) => {
    mockDragEnd = props.onDragEnd
    return <actual.DndContext {...props} />
  } }
})

const baseProfile = {
  id: 'profile-1',
  lodging_id: 'lodging-1',
  city_id: 'city-1',
  slug: 'chalet-hygge',
  publication_status: 'draft' as const,
  title: 'Chalet Hygge',
  short_description: 'Texte court initial pour la fiche publique du logement.',
  description: 'Description initiale assez longue pour etre validee cote formulaire sans encore appliquer le brouillon MyStay.',
  property_type: 'Chalet',
  max_guests: 4,
  bedroom_count: 2,
  bathroom_count: 1,
  bed_count: 3,
  surface_m2: 70,
  public_area_label: 'Annecy-le-Vieux',
  precise_location_public: false,
  public_latitude: null,
  public_longitude: null,
  external_booking_url: null,
  external_booking_platform: null,
  public_contact_enabled: true,
  source_listing_url: null,
  source_listing_platform: null,
  source_listing_identifier: null,
  source_metadata_status: 'not_checked' as const,
  source_description_text: 'Texte source Owner suffisamment long pour etre reecrit en version MyStay premium, locale et SEO.',
  content_rights_confirmed_at: null,
  content_rights_confirmed_by_user_id: null,
  content_rights_statement_version: null,
  rewrite_status: 'generated' as const,
  rewrite_suggestion: JSON.stringify({
    short_description: 'Brouillon MyStay plus premium pour Annecy.',
    description: 'Description reecrite pour la fiche publique avec une intention locale et un ton plus premium pour MyStay.',
    seo_title: 'Chalet Hygge a Annecy | MyStay',
    seo_description: 'Sejournez a Annecy dans un chalet lumineux avec un ton MyStay premium et local.',
  }),
  rewrite_generated_at: '2026-06-12T10:00:00.000Z',
  rewrite_provider: 'gemini',
  seo_title: null,
  seo_description: null,
  photos: [],
  amenities: [],
  faq: [],
}


const photo = {
  id: 'b76af918-ab21-40c3-8b59-708f61572444', url: 'https://example.com/photo.jpg',
  alt: 'Chambre lumineuse', room_type: 'bedroom' as const, room_label: 'Chambre 2',
  sort_order: 0, is_cover: true,
}

beforeAll(() => {
  HTMLElement.prototype.scrollIntoView = jest.fn()
  HTMLElement.prototype.hasPointerCapture = jest.fn(() => false)
  HTMLElement.prototype.setPointerCapture = jest.fn()
  HTMLElement.prototype.releasePointerCapture = jest.fn()
})
afterEach(() => jest.restoreAllMocks())

it.each(['owner', 'admin'] as const)('AC-05-14: immediately persists a category in %s mode and keeps other edits', async mode => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ ok: true }) })
  render(<LodgingShowcaseForm mode={mode} lodgingId="lodging-1" initialProfile={{ ...baseProfile, photos: [photo] }} />)
  fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'Titre encore non enregistré' } })
  fireEvent.keyDown(screen.getByRole('combobox', { name: 'Catégorie de Chambre lumineuse' }), { key: 'ArrowDown' })
  fireEvent.click(await screen.findByRole('option', { name: 'Salon' }))
  await screen.findByText('Catégorie enregistrée.')
  expect(fetch).toHaveBeenCalledWith(`/api/${mode === 'admin' ? 'admin' : 'dashboard'}/lodgings/lodging-1/public-profile/photos/${photo.id}`, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ room_type: 'common_area', room_label: 'Salon' }),
  })
  expect(screen.getByRole('combobox', { name: 'Catégorie de Chambre lumineuse' })).toHaveTextContent('Salon')
  expect(screen.getByText('Couverture')).toBeInTheDocument()
  expect(screen.getByLabelText('Titre')).toHaveValue('Titre encore non enregistré')
})

it('AC-05-14: keeps the previous category when the request fails', async () => {
  global.fetch = jest.fn().mockRejectedValue(new Error('Network'))
  render(<LodgingShowcaseForm lodgingId="lodging-1" initialProfile={{ ...baseProfile, photos: [photo] }} />)
  fireEvent.keyDown(screen.getByRole('combobox', { name: 'Catégorie de Chambre lumineuse' }), { key: 'ArrowDown' })
  fireEvent.click(await screen.findByRole('option', { name: 'Salon' }))
  await screen.findByText('Catégorie non enregistrée. Veuillez réessayer.')
  expect(screen.getByRole('combobox', { name: 'Catégorie de Chambre lumineuse' })).toHaveTextContent('Chambre 2')
})

it('AC-05-15: shows ten bedrooms and preserves existing labels after reducing the count', () => {
  render(<LodgingShowcaseForm lodgingId="lodging-1" initialProfile={{ ...baseProfile, bedroom_count: 10, photos: [{ ...photo, room_label: 'Chambre 10' }] }} />)
  expect(screen.getByRole('option', { name: 'Chambre 10' })).toBeInTheDocument()
  fireEvent.change(screen.getByLabelText('Chambres'), { target: { value: '1' } })
  expect(screen.getByRole('combobox', { name: 'Catégorie de Chambre lumineuse' })).toHaveTextContent('Chambre 10')
})

it('AC-05-13: imports a batch, retains successes and retries only the failed file', async () => {
  const first = new File(['one'], 'salon.jpg', { type: 'image/jpeg' })
  const second = new File(['two'], 'chambre.jpg', { type: 'image/jpeg' })
  const mockFetch = jest.fn()
    .mockResolvedValueOnce({ ok: true, json: async () => ({ ...photo, alt: 'salon' }) })
    .mockResolvedValueOnce({ ok: false, json: async () => ({ error: { message: 'Image invalide' } }) })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ ...photo, id: 'b76af918-ab21-40c3-8b59-708f61572445', alt: 'chambre', is_cover: false }) })
  global.fetch = mockFetch
  render(<LodgingShowcaseForm lodgingId="lodging-1" initialProfile={baseProfile} />)
  expect(screen.getByLabelText('Photos à importer')).toHaveAttribute('multiple')
  fireEvent.change(screen.getByLabelText('Photos à importer'), { target: { files: [first, second] } })
  fireEvent.click(screen.getByRole('button', { name: 'Importer les photos' }))
  expect(screen.getByRole('button', { name: 'Sauvegarder le brouillon' })).toBeDisabled()
  await screen.findByText('chambre.jpg : Image invalide')
  expect(screen.getByAltText('salon')).toBeInTheDocument()
  expect(screen.getByText('1 fichier(s) sélectionné(s)')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Importer les photos' }))
  await screen.findByAltText('chambre')
  await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
  expect(mockFetch).toHaveBeenCalledTimes(3)
  expect(mockFetch.mock.calls.map(call => (call[1].body as FormData).get('file'))).toEqual([first, second, second])
  expect(screen.getByAltText('salon')).toBeInTheDocument()
})


it('AC-05-13: locks competing actions until the entire batch finishes', async () => {
  let finish!: (response: { ok: boolean; json: () => Promise<typeof photo> }) => void
  global.fetch = jest.fn(() => new Promise(resolve => { finish = resolve })) as jest.Mock
  render(<LodgingShowcaseForm lodgingId="lodging-1" initialProfile={{ ...baseProfile, photos: [photo] }} />)
  fireEvent.change(screen.getByLabelText('Photos à importer'), { target: { files: [new File(['one'], 'salon.jpg', { type: 'image/jpeg' })] } })
  fireEvent.click(screen.getByRole('button', { name: 'Importer les photos' }))
  expect(screen.getByRole('button', { name: 'Appliquer le brouillon MyStay' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Demander la publication' })).toBeDisabled()
  expect(screen.getByRole('button', { name: 'Supprimer' })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: 'Appliquer le brouillon MyStay' }))
  expect(screen.getByRole('button', { name: 'Sauvegarder le brouillon' })).toBeDisabled()
  expect(screen.getByRole('combobox', { name: 'Catégorie de Chambre lumineuse' })).toBeDisabled()
  // Spec 085 : la photo est préparée (asynchrone) avant l'envoi.
  await waitFor(() => expect(global.fetch).toHaveBeenCalled())
  finish({ ok: true, json: async () => ({ ...photo, id: 'b76af918-ab21-40c3-8b59-708f61572446', alt: 'Salon lumineux', is_cover: false }) })
  await screen.findByAltText('Salon lumineux')
  await waitFor(() => expect(screen.getByRole('button', { name: 'Sauvegarder le brouillon' })).toBeEnabled())
})

it.each(['owner', 'admin'] as const)('AC-05-16: saves reordered photos immediately in %s mode without changing other edits', async mode => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true })
  const second = { ...photo, id: 'second', alt: 'Salon lumineux', is_cover: false, sort_order: 1 }
  render(<LodgingShowcaseForm mode={mode} lodgingId="lodging-1" initialProfile={{ ...baseProfile, photos: [photo, second] }} />)
  fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'Texte non sauvegardé' } })
  expect(screen.getByRole('button', { name: `Déplacer ${photo.alt} avant` })).toBeDisabled()
  fireEvent.click(screen.getByRole('button', { name: `Déplacer ${second.alt} avant` }))
  await screen.findByText('Ordre des photos enregistré.')
  expect(fetch).toHaveBeenCalledWith(`/api/${mode === 'admin' ? 'admin' : 'dashboard'}/lodgings/lodging-1/public-profile/photos`, expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ photo_ids: [second.id, photo.id] }) }))
  expect(screen.getByRole('button', { name: `Déplacer ${second.alt} avant` })).toBeDisabled()
  expect(screen.getByRole('button', { name: `Déplacer ${photo.alt} après` })).toBeDisabled()
  expect(screen.getByLabelText('Titre')).toHaveValue('Texte non sauvegardé')
  expect(screen.getByText('Couverture')).toBeInTheDocument()
})
it('AC-05-16: retains the original order after a failed save', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: false })
  const second = { ...photo, id: 'second', alt: 'Salon lumineux', is_cover: false, sort_order: 1 }
  render(<LodgingShowcaseForm lodgingId="lodging-1" initialProfile={{ ...baseProfile, photos: [photo, second] }} />)
  fireEvent.click(screen.getByRole('button', { name: `Déplacer ${second.alt} avant` }))
  await screen.findByText('Ordre non enregistré. Actualisez la galerie puis réessayez.')
  expect(screen.getByRole('button', { name: `Déplacer ${photo.alt} avant` })).toBeDisabled()
})


it('AC-05-16: drag and drop inserts a photo across the grid and persists its new position', async () => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true })
  const second = { ...photo, id: 'second', alt: 'Salon lumineux', is_cover: false, sort_order: 1 }
  const third = { ...photo, id: 'third', alt: 'Terrasse', is_cover: false, sort_order: 2 }
  render(<LodgingShowcaseForm lodgingId="lodging-1" initialProfile={{ ...baseProfile, photos: [photo, second, third] }} />)
  expect(screen.getByRole('button', { name: `Réorganiser ${photo.alt}` })).toHaveClass('touch-none')
  act(() => mockDragEnd({ active: { id: photo.id }, over: { id: third.id } }))
  await screen.findByText('Ordre des photos enregistré.')
  expect(fetch).toHaveBeenCalledWith(expect.any(String), expect.objectContaining({ body: JSON.stringify({ photo_ids: [second.id, third.id, photo.id] }) }))
  expect(screen.getByRole('button', { name: `Déplacer ${photo.alt} après` })).toBeDisabled()
})
it('AC-05-16: a drop without a target or without movement sends no request', () => {
  global.fetch = jest.fn()
  render(<LodgingShowcaseForm lodgingId="lodging-1" initialProfile={{ ...baseProfile, photos: [photo] }} />)
  act(() => mockDragEnd({ active: { id: photo.id }, over: null }))
  act(() => mockDragEnd({ active: { id: photo.id }, over: { id: photo.id } }))
  expect(fetch).not.toHaveBeenCalled()
})

it('AC-05-16: keeps the dropped position visible while saving and rolls back on failure', async () => {
  let finish!: (response: { ok: boolean }) => void
  global.fetch = jest.fn(() => new Promise(resolve => { finish = resolve })) as typeof fetch
  const second = { ...photo, id: 'second', alt: 'Salon lumineux', is_cover: false, sort_order: 1 }
  render(<LodgingShowcaseForm lodgingId="lodging-1" initialProfile={{ ...baseProfile, photos: [photo, second] }} />)
  act(() => mockDragEnd({ active: { id: photo.id }, over: { id: second.id } }))
  expect(screen.getAllByRole('img').map(img => img.getAttribute('alt'))).toEqual([second.alt, photo.alt])
  expect(screen.getByText('Enregistrement de l’ordre…')).toBeInTheDocument()
  await act(async () => finish({ ok: false }))
  expect(screen.getAllByRole('img').map(img => img.getAttribute('alt'))).toEqual([photo.alt, second.alt])
})

it('042 AC-08-04 allows correcting a legacy UUID alt before saving', () => {
  render(<LodgingShowcaseForm mode="admin" lodgingId="lodging-1" initialProfile={{ ...baseProfile, photos: [{ ...photo, alt: '45bd1b02 d2a0 42f2 ad5b d93a2e753b9d' }] }} />)
  const input = screen.getByLabelText('Description de la photo')
  fireEvent.change(input, { target: { value: 'Salon du Chalet Hygge avec canapé' } })
  expect(input).toHaveValue('Salon du Chalet Hygge avec canapé')
})
