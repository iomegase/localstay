/**
 * @jest-environment jsdom
 */
import { render, screen, within } from '@testing-library/react'
import '@testing-library/jest-dom'

jest.mock('next/navigation', () => ({
  notFound: jest.fn(),
}))

jest.mock('@/features/dashboard-owner/lib/get-page-owner', () => ({
  getPageOwner: jest.fn(async () => ({ id: 'owner-1', role: 'owner' })),
}))

jest.mock('@/features/guide-customization/queries/customization', () => ({
  getLodgingAddressParts: jest.fn(async () => ({ address_number: '12', address_street: 'rue des Alpages', address_postal_code: '74170', address_city: 'Saint-Gervais-les-Bains', lodging_address: '12 rue des Alpages, 74170 Saint-Gervais-les-Bains' })),
}))

jest.mock('@/features/lodging-showcase/queries/owner-public-profile', () => ({
  getOwnedLodgingShowcasePageData: jest.fn(async () => ({
    lodging: {
      id: 'lodging-1',
      name: 'Chalet Hygge',
      city: { name: 'Annecy', slug: 'annecy' },
    },
    profile: {
      id: 'profile-1',
      publication_status: 'draft',
      title: 'Chalet Hygge',
      short_description: 'Un chalet lumineux pour sejourner a Annecy dans l univers MyStay.',
      description: 'Une description detaillee pour la fiche publique du logement dans l univers MyStay.',
      property_type: 'Chalet',
      max_guests: 4,
      photos: [],
      amenities: [],
      faq: [],
      public_contact_enabled: true,
      source_listing_url: null,
      source_description_text: null,
      seo_title: null,
      seo_description: null,
      external_booking_url: null,
      content_rights_confirmed_at: null,
      content_rights_statement_version: null,
      rewrite_status: 'not_requested',
      rewrite_suggestion: null,
    },
  })),
}))

import ShowcasePage from '@/app/(dashboard)/dashboard/lodgings/[id]/showcase/page'

describe('028 lodging showcase owner page', () => {
  it('AC-05-01: renders the owner showcase page for an owned lodging', async () => {
    render(await ShowcasePage({ params: Promise.resolve({ id: 'lodging-1' }) }))

    // Spec 077 AC-04-03 : « Vitrine publique » devient « Logement ».
    expect(screen.getByText('Logement', { selector: 'p' })).toBeInTheDocument()
    expect(screen.getAllByText('Chalet Hygge').length).toBeGreaterThan(0)
    // Spec 079 : plus d'« Annonce externe » ni de « Droits contenus ».
    expect(screen.queryByText(/MyStay ne copie pas automatiquement/i)).not.toBeInTheDocument()
    expect(screen.queryByText('Droits contenus')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Sauvegarder le brouillon/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Demander la publication/i })).toBeInTheDocument()
    // Spec 080 AC-02-01 / AC-02-02 : adresse du Guide en lecture seule, quartier public.
    // Spec 080 AC-03-02 : l'adresse se saisit dans Caractéristiques (4 champs) puis est reprise par le Guide.
    const address = screen.getByTestId('lodging-address-fields')
    expect(within(address).getByLabelText('Numéro')).toHaveValue('12')
    expect(within(address).getByLabelText('Rue')).toHaveValue('rue des Alpages')
    expect(within(address).getByLabelText('Code postal')).toHaveValue('74170')
    expect(within(address).getByLabelText('Ville')).toHaveValue('Saint-Gervais-les-Bains')
    expect(within(address).getByRole('button', { name: 'Enregistrer l’adresse' })).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: /dans le Guide/ })).not.toBeInTheDocument()
    expect(screen.getByLabelText('Quartier affiché (facultatif)')).toBeInTheDocument()
  })
})
