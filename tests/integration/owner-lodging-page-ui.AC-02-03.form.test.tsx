/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { LodgingShowcaseForm } from '@/features/lodging-showcase/components/LodgingShowcaseForm'
import type { OwnerLodgingPublicProfileDto } from '@/features/lodging-showcase/types'

const profile = {
  id: 'profile-1', lodging_id: 'lodging-1', city_id: 'city-1', slug: 'le-305', publication_status: 'draft',
  title: 'Le 305', short_description: 'Appartement lumineux', description: 'x'.repeat(120), property_type: 'Appartement',
  max_guests: 4, bedroom_count: 2, bathroom_count: 1, bed_count: 3, surface_m2: 52, public_area_label: null,
  precise_location_public: false, public_latitude: null, public_longitude: null,
  external_booking_url: null, external_booking_platform: null, public_contact_enabled: true,
  source_listing_url: 'https://www.airbnb.fr/rooms/915825375084506990', source_listing_platform: 'airbnb',
  source_listing_identifier: '915825375084506990', source_metadata_status: 'url_only',
  source_description_text: null, content_rights_confirmed_at: null, content_rights_confirmed_by_user_id: null,
  content_rights_statement_version: null, rewrite_status: 'not_requested', rewrite_suggestion: null,
  seo_title: null, seo_description: null, photos: [], amenities: [], faq: [],
} as unknown as OwnerLodgingPublicProfileDto

beforeEach(() => {
  global.fetch = jest.fn(async (_url: string, init?: RequestInit) => ({
    ok: true, status: 200,
    json: async () => ({ ...profile, ...JSON.parse(String(init?.body ?? '{}')) }),
  })) as unknown as typeof fetch
})

// Spec 079 — page Logement.
describe('079 — page Logement', () => {
  it('AC-01-01 / AC-02-01 : plus de droits ni d’annonce externe ; un seul lien de réservation', () => {
    render(<LodgingShowcaseForm lodgingId="lodging-1" initialProfile={profile} />)
    expect(screen.queryByText('Droits contenus')).not.toBeInTheDocument()
    expect(screen.queryByText('Annonce externe')).not.toBeInTheDocument()
    expect(screen.queryByLabelText('URL Airbnb ou Booking')).not.toBeInTheDocument()
    expect(screen.getAllByLabelText(/Lien de réservation/)).toHaveLength(1)
  })

  it('AC-02-02 : pré-rempli par l’ancienne URL d’annonce et enregistré avec le brouillon', async () => {
    render(<LodgingShowcaseForm lodgingId="lodging-1" initialProfile={profile} />)
    expect(screen.getByLabelText('Lien de réservation (Airbnb, Booking…)')).toHaveValue('https://www.airbnb.fr/rooms/915825375084506990')

    fireEvent.click(screen.getByRole('button', { name: 'Sauvegarder le brouillon' }))
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0]
    expect(url).toBe('/api/dashboard/lodgings/lodging-1/public-profile')
    expect(JSON.parse(init.body).external_booking_url).toBe('https://www.airbnb.fr/rooms/915825375084506990')
  })

  it('AC-03-01 : sept sections numérotées et un sommaire', () => {
    render(<LodgingShowcaseForm lodgingId="lodging-1" initialProfile={profile} />)
    const nav = within(screen.getByRole('navigation', { name: 'Sommaire du logement' }))
    expect(nav.getAllByRole('link').map(link => link.getAttribute('href'))).toEqual([
      '#presentation', '#caracteristiques', '#equipements', '#photos', '#faq', '#reservation', '#referencement',
    ])
    expect(screen.getByRole('heading', { level: 2, name: 'Référencement' })).toBeInTheDocument()
  })

  it('AC-03-01 : compteur SEO hors plage signalé', () => {
    render(<LodgingShowcaseForm lodgingId="lodging-1" initialProfile={profile} />)
    fireEvent.change(screen.getByLabelText('SEO title'), { target: { value: 'Trop court' } })
    expect(screen.getByTestId('counter-seo-title')).toHaveTextContent('10 · 30–70')
    expect(screen.getByTestId('counter-seo-title')).toHaveClass('text-amber-600')
  })

  it('AC-03-02 : statut en français, état des modifications, publication après sauvegarde', async () => {
    render(<LodgingShowcaseForm lodgingId="lodging-1" initialProfile={profile} />)
    const saveState = () => screen.getByRole('status', { name: 'État de l’enregistrement' })
    expect(screen.getByTestId('publication-status')).toHaveTextContent('Brouillon')
    expect(saveState()).toHaveTextContent('Toutes les modifications sont enregistrées.')

    fireEvent.change(screen.getByLabelText('Titre'), { target: { value: 'Le 305 rénové' } })
    expect(saveState()).toHaveTextContent('Modifications non enregistrées')
    expect(screen.getByRole('button', { name: 'Demander la publication' })).toBeDisabled()

    fireEvent.click(screen.getByRole('button', { name: 'Sauvegarder le brouillon' }))
    await waitFor(() => expect(saveState()).toHaveTextContent('Toutes les modifications sont enregistrées.'))
    expect(screen.getByRole('button', { name: 'Demander la publication' })).toBeEnabled()
  })

  it('AC-03-03 : champs manquants en français', async () => {
    render(<LodgingShowcaseForm lodgingId="lodging-1" initialProfile={profile} />)
    global.fetch = jest.fn(async () => ({
      ok: false, status: 400,
      json: async () => ({ error: { message: 'Fiche incomplète', details: { missingFields: ['photos', 'cover_photo', 'amenities'] } } }),
    })) as unknown as typeof fetch

    fireEvent.click(screen.getByRole('button', { name: 'Demander la publication' }))

    const alert = await screen.findByRole('alert')
    expect(alert).toHaveTextContent('Au moins une photo')
    expect(alert).toHaveTextContent('Une photo de couverture')
    expect(alert).toHaveTextContent('Au moins 3 équipements')
  })

  it('BR-03 : en mode admin, ni demande de publication ni rédaction assistée', () => {
    render(<LodgingShowcaseForm lodgingId="lodging-1" initialProfile={profile} mode="admin" />)
    expect(screen.queryByRole('button', { name: 'Demander la publication' })).not.toBeInTheDocument()
    expect(screen.queryByText('Rédaction assistée')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Sauvegarder le brouillon' })).toBeInTheDocument()
  })
})

describe('079 AC-03-05 — texte alternatif des photos existantes', () => {
  it('applique « <pièce> — <texte> » aux photos et l’enregistre avec le brouillon', async () => {
    const withPhotos = {
      ...profile,
      photos: [
        { id: 'p1', url: 'https://cdn.test/1.webp', alt: 'Pièce de vie — Le 305', room_type: 'common_area', room_label: null, sort_order: 0, is_cover: true },
        { id: 'p2', url: 'https://cdn.test/2.webp', alt: 'Chambre 1 — Le 305', room_type: 'bedroom', room_label: 'Chambre 1', sort_order: 1, is_cover: false },
      ],
    } as unknown as OwnerLodgingPublicProfileDto
    render(<LodgingShowcaseForm lodgingId="lodging-1" initialProfile={withPhotos} />)

    expect(screen.getByRole('button', { name: /Appliquer aux 2 photo/ })).toBeDisabled()
    fireEvent.change(screen.getByLabelText('Texte alternatif (facultatif, commun au lot)'), { target: { value: 'le 305 - saint gervais les bains' } })
    fireEvent.click(screen.getByRole('button', { name: /Appliquer aux 2 photo/ }))

    const descriptions = screen.getAllByLabelText('Description de la photo') as HTMLInputElement[]
    expect(descriptions.map(input => input.value)).toEqual([
      'Pièce de vie — le 305 - saint gervais les bains', 'Chambre 1 — le 305 - saint gervais les bains',
    ])
    expect(screen.getByRole('status', { name: 'État de l’enregistrement' })).toHaveTextContent('Modifications non enregistrées')

    fireEvent.click(screen.getByRole('button', { name: 'Sauvegarder le brouillon' }))
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
    expect(body.photos.map((photo: { alt: string }) => photo.alt)).toEqual([
      'Pièce de vie — le 305 - saint gervais les bains', 'Chambre 1 — le 305 - saint gervais les bains',
    ])
  })
})
