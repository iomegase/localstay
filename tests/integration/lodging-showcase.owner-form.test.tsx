/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { LodgingShowcaseForm } from '@/features/lodging-showcase/components/LodgingShowcaseForm'

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

describe('028 lodging showcase owner form', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('AC-05-11: applies the generated rewrite into draft fields before save', () => {
    render(<LodgingShowcaseForm lodgingId="lodging-1" initialProfile={baseProfile} />)

    fireEvent.click(screen.getByRole('button', { name: /Appliquer le brouillon MyStay/i }))

    expect(screen.getByDisplayValue('Brouillon MyStay plus premium pour Annecy.')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Chalet Hygge a Annecy | MyStay')).toBeInTheDocument()
    expect(screen.getByText(/Le brouillon MyStay a ete applique localement/i)).toBeInTheDocument()
  })

  it.each([
    ['owner', undefined],
    ['admin', 'admin' as const],
  ])('shows the canonical short public preview in %s mode', (_label, mode) => {
    render(
      <LodgingShowcaseForm
        lodgingId="lodging-1"
        initialProfile={baseProfile}
        mode={mode}
      />,
    )

    expect(screen.getByText('/logements/chalet-hygge')).toBeInTheDocument()
  })

  it('keeps a new profile preview under the short public namespace before slug allocation', () => {
    render(
      <LodgingShowcaseForm
        lodgingId="lodging-1"
        initialProfile={{ ...baseProfile, slug: null }}
      />,
    )

    expect(screen.getByText('/logements/...')).toBeInTheDocument()
  })

  it('shows field-level validation guidance when draft save is rejected', async () => {
    global.fetch = jest.fn().mockResolvedValue(
      {
        ok: false,
        json: async () => ({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Parametre manquant ou invalide',
            details: {
              fieldErrors: {
                title: ['Le titre doit contenir entre 5 et 90 caracteres.'],
                short_description: ['La description courte doit contenir entre 40 et 180 caracteres.'],
              },
            },
          },
        }),
      },
    )

    render(<LodgingShowcaseForm lodgingId="lodging-1" initialProfile={baseProfile} />)

    fireEvent.click(screen.getByRole('button', { name: /Sauvegarder le brouillon/i }))

    expect(await screen.findByText(/Titre - Le titre doit contenir entre 5 et 90 caracteres\./i)).toBeInTheDocument()
    expect(
      screen.getByText(/Description courte - La description courte doit contenir entre 40 et 180 caracteres\./i),
    ).toBeInTheDocument()
  })
})
