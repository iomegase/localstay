/** @jest-environment jsdom */
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { LodgingShowcaseForm } from '@/features/lodging-showcase/components/LodgingShowcaseForm'
import type { OwnerLodgingPublicProfileDto } from '@/features/lodging-showcase/types'

const profile = (publication_status: string) => ({
  id: 'profile-1', lodging_id: 'lodging-1', city_id: 'city-1', slug: 'le-305', publication_status,
  title: 'Le 305', short_description: 'Appartement lumineux', description: 'x'.repeat(120), property_type: 'Appartement',
  max_guests: 4, bedroom_count: 2, bathroom_count: 1, bed_count: 3, surface_m2: 52, public_area_label: null,
  precise_location_public: false, public_latitude: null, public_longitude: null,
  external_booking_url: null, external_booking_platform: null, public_contact_enabled: true, availability_ical_url: null,
  source_listing_url: null, source_listing_platform: null, source_listing_identifier: null, source_metadata_status: 'not_checked',
  source_description_text: null, content_rights_confirmed_at: null, content_rights_confirmed_by_user_id: null,
  content_rights_statement_version: null, rewrite_status: 'not_requested', rewrite_suggestion: null,
  seo_title: null, seo_description: null, photos: [], amenities: [], faq: [],
}) as unknown as OwnerLodgingPublicProfileDto

function mockSave(publication_status: string) {
  global.fetch = jest.fn(async (_url: string, init?: RequestInit) => ({
    ok: true, status: 200,
    json: async () => ({ ...profile(publication_status), ...JSON.parse(String(init?.body ?? '{}')), publication_status }),
  })) as unknown as typeof fetch
}

describe('spec 090 AC-04 — logement déjà en ligne', () => {
  it('propose « Enregistrer », sans demande de publication, et confirme la mise en ligne', async () => {
    mockSave('published')
    render(<LodgingShowcaseForm lodgingId="lodging-1" initialProfile={profile('published')} />)

    expect(screen.queryByRole('button', { name: 'Demander la publication' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Sauvegarder le brouillon' })).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    expect(await screen.findByText('Modifications en ligne.')).toBeInTheDocument()
  })

  it('AC-05 : une fiche jamais publiée garde le brouillon et la demande de publication', () => {
    mockSave('draft')
    render(<LodgingShowcaseForm lodgingId="lodging-1" initialProfile={profile('draft')} />)
    expect(screen.getByRole('button', { name: 'Sauvegarder le brouillon' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Demander la publication' })).toBeInTheDocument()
  })
})
