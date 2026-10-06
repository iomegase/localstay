/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { LodgingShowcaseForm } from '@/features/lodging-showcase/components/LodgingShowcaseForm'
import type { OwnerLodgingPublicProfileDto } from '@/features/lodging-showcase/types'

const profile = {
  id: 'profile-1', lodging_id: 'lodging-1', city_id: 'city-1', slug: 'chalet-megeve', publication_status: 'draft',
  title: 'Chalet Megève', short_description: 'Chalet', description: 'x'.repeat(120), property_type: 'Chalet',
  max_guests: 6, bedroom_count: 3, bathroom_count: 2, bed_count: 4, surface_m2: 90, public_area_label: null,
  precise_location_public: false, public_latitude: null, public_longitude: null,
  external_booking_url: null, external_booking_platform: null, public_contact_enabled: true,
  source_listing_url: null, source_listing_platform: null, source_listing_identifier: null, source_metadata_status: 'not_checked',
  source_description_text: null, content_rights_confirmed_at: null, content_rights_confirmed_by_user_id: null,
  content_rights_statement_version: null, rewrite_status: 'not_requested', rewrite_suggestion: null,
  seo_title: null, seo_description: null, photos: [], amenities: [],
  faq: [{ question: 'Les animaux sont-ils acceptés ?', answer: 'Non, désolé.', sort_order: 0 }],
} as unknown as OwnerLodgingPublicProfileDto

beforeEach(() => {
  global.fetch = jest.fn(async (_url: string, init?: RequestInit) => ({
    ok: true, status: 200, json: async () => ({ ...profile, ...JSON.parse(String(init?.body ?? '{}')) }),
  })) as unknown as typeof fetch
})

// Spec 082 US-02 — ajout depuis la bibliothèque.
describe('082 — bibliothèque de FAQ dans la page Logement', () => {
  it('AC-02-01 / AC-02-02 : propose les questions absentes, les ajoute remplies, sans doublon', async () => {
    render(<LodgingShowcaseForm lodgingId="lodging-1" initialProfile={profile} cityName="Megève" />)

    fireEvent.click(screen.getByRole('button', { name: 'Ajouter depuis la bibliothèque (12)' }))
    const library = within(screen.getByRole('group', { name: 'Bibliothèque de questions' }))
    expect(library.queryByLabelText('Les animaux sont-ils acceptés ?')).not.toBeInTheDocument()

    fireEvent.click(library.getByLabelText('Quelle est la capacité maximale du logement ?'))
    fireEvent.click(library.getByLabelText('Comment sont répartis les couchages ?'))
    fireEvent.click(library.getByRole('button', { name: 'Ajouter (2)' }))

    expect(screen.queryByRole('group', { name: 'Bibliothèque de questions' })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Question 2')).toHaveValue('Quelle est la capacité maximale du logement ?')
    expect((screen.getByLabelText('Réponse 2') as HTMLTextAreaElement).value).toContain('jusqu’à 6 personnes')
    expect((screen.getByLabelText('Réponse 3') as HTMLTextAreaElement).value).toContain('3 chambres')
    // AC-01-03 : la répartition des couchages reste à préciser.
    expect(screen.getAllByText('À adapter')).toHaveLength(1)
    expect(screen.getByRole('button', { name: 'Ajouter depuis la bibliothèque (10)' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Sauvegarder le brouillon' }))
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
    expect(body.faq.map((row: { question: string }) => row.question)).toEqual([
      'Les animaux sont-ils acceptés ?', 'Quelle est la capacité maximale du logement ?', 'Comment sont répartis les couchages ?',
    ])
  })

  it('« Tout sélectionner » ajoute toutes les questions manquantes', () => {
    render(<LodgingShowcaseForm lodgingId="lodging-1" initialProfile={profile} cityName="Megève" />)
    fireEvent.click(screen.getByRole('button', { name: /Ajouter depuis la bibliothèque/ }))
    fireEvent.click(screen.getByRole('button', { name: 'Tout sélectionner' }))
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter (12)' }))

    expect(screen.getAllByLabelText(/^Question \d+$/)).toHaveLength(13)
    expect(screen.getByRole('button', { name: 'Ajouter depuis la bibliothèque' })).toBeDisabled()
  })
})
