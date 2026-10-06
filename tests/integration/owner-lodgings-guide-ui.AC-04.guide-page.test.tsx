/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import '@testing-library/jest-dom'
import { CustomizationForm } from '@/features/guide-customization/components/CustomizationForm'
import type { LodgingCustomizationResponse } from '@/features/guide-customization/types'

jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: jest.fn() }) }))
jest.mock('@/shared/components/ImageUpload', () => ({ ImageUpload: () => <div data-testid="image-upload" /> }))

const customization = {
  lodging_id: 'lodging-1',
  category_order: [],
  featured_pois: [],
  ignored_category_slugs: [],
  cover_photo_url: null, presentation_video_url: null, lodging_address: null, wifi_ssid: 'Chalet', wifi_password: null,
  key_box_code: null, checkout_instructions: null, trash_location: 'Place du marché', house_rules: null,
  emergency_contacts: null, useful_services: null, practical_blocks: [], arrival_instructions: [],
} as LodgingCustomizationResponse

function renderForm() {
  return render(
    <CustomizationForm
      lodgingId="lodging-1"
      citySlug="saint-gervais-les-bains"
      categories={[{ id: 'cat-1', name: 'Restaurants', slug: 'restaurants', sort_order: 1 }]}
      pois={[]}
      initialCustomization={customization}
    />,
  )
}

beforeEach(() => {
  global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ ...customization, wifi_ssid: 'Chalet 2' }) }) as jest.Mock
})

// Spec 077 — page Guide.
describe('077 — page Guide', () => {
  it('AC-04-01 : quatre sections numérotées et un sommaire à ancres', () => {
    renderForm()
    const nav = within(screen.getByRole('navigation', { name: 'Sommaire du guide' }))
    expect(nav.getAllByRole('link').map(link => [link.textContent, link.getAttribute('href')])).toEqual([
      ['1Le logement', '#logement'], ['2Arrivée', '#arrivee'], ['3Sur place', '#sur-place'], ['4Recommandations', '#recommandations'],
    ])
    for (const title of ['Le logement', 'Arrivée', 'Sur place', 'Recommandations']) {
      expect(screen.getByRole('heading', { level: 2, name: title })).toBeInTheDocument()
    }
    expect(screen.getByLabelText('Code de la boîte à clés')).toBeInTheDocument()
    expect(screen.getByLabelText('Nom du réseau (SSID)')).toHaveValue('Chalet')
  })

  it('AC-02-01 / AC-03-01 : plus de message d’accueil ni de bacs, la localisation du point de tri reste', () => {
    renderForm()
    expect(screen.queryByText(/Message d.accueil/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Poubelle jaune/)).not.toBeInTheDocument()
    expect(screen.getByLabelText('Point de tri (adresse ou lien Google Maps)')).toHaveValue('Place du marché')
  })

  it('AC-02-02 / AC-03-02 : le formulaire n’envoie plus ces champs', async () => {
    renderForm()
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    const body = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)
    expect(body).not.toHaveProperty('welcome_message')
    expect(body).not.toHaveProperty('trash_bins')
    expect(body).not.toHaveProperty('trash_info')
    expect(body.trash_location).toBe('Place du marché')
  })

  it('AC-04-02 : barre d’état — modifié, puis enregistré ; confirmation avant de quitter', async () => {
    renderForm()
    const status = () => screen.getByRole('status', { name: 'État de l’enregistrement' })
    expect(status()).toHaveTextContent('Toutes les modifications sont enregistrées.')

    fireEvent.change(screen.getByLabelText('Nom du réseau (SSID)'), { target: { value: 'Chalet 2' } })
    expect(status()).toHaveTextContent('Modifications non enregistrées')
    const leave = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(leave)
    expect(leave.defaultPrevented).toBe(true)

    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    await waitFor(() => expect(status()).toHaveTextContent('Guide enregistré.'))
    const after = new Event('beforeunload', { cancelable: true })
    window.dispatchEvent(after)
    expect(after.defaultPrevented).toBe(false)
  })

  it('AC-04-01 : l’aperçu voyageur reste accessible', () => {
    renderForm()
    expect(screen.getByRole('link', { name: /Aperçu voyageur/ })).toHaveAttribute('href', '/guide/saint-gervais-les-bains?lodging=lodging-1')
  })
})

// Spec 080 — adresse structurée dans la page Guide.
describe('080 AC-01-01 — adresse en 4 champs', () => {
  it('numéro, rue, code postal, ville (ville du logement en exemple) et envoi des parties', async () => {
    render(
      <CustomizationForm
        lodgingId="lodging-1"
        citySlug="saint-gervais-les-bains"
        cityName="Saint-Gervais-les-Bains"
        categories={[]}
        pois={[]}
        initialCustomization={{ ...customization, address_number: null, address_street: null, address_postal_code: null, address_city: null }}
      />,
    )
    expect(screen.queryByLabelText('Adresse du logement')).not.toBeInTheDocument()
    expect(screen.getByLabelText('Ville')).toHaveAttribute('placeholder', 'Saint-Gervais-les-Bains')
    fireEvent.change(screen.getByLabelText('Numéro'), { target: { value: '12' } })
    fireEvent.change(screen.getByLabelText('Rue'), { target: { value: 'rue des Alpages' } })
    fireEvent.change(screen.getByLabelText('Code postal'), { target: { value: '74 170a' } })
    fireEvent.change(screen.getByLabelText('Ville'), { target: { value: 'Saint-Gervais-les-Bains' } })
    expect(screen.getByLabelText('Code postal')).toHaveValue('74170')

    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    expect(JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body)).toMatchObject({
      address_number: '12', address_street: 'rue des Alpages', address_postal_code: '74170', address_city: 'Saint-Gervais-les-Bains',
    })
  })
})

// Spec 083 — erreurs sous les champs.
describe('083 — erreurs affichées sous les champs du Guide', () => {
  const withArrival = (text: string) => ({
    ...customization,
    arrival_instructions: [{ id: 'step-1', title: 'Portail', text, video_url: null, photos: [], sort_order: 0, kind: 'custom', tip: null, substeps: [], facts: [] }],
  }) as unknown as LodgingCustomizationResponse

  it('AC-01-01 / AC-01-03 : instruction sans texte signalée sous le champ, rien n’est envoyé, effacée à la correction', () => {
    render(<CustomizationForm lodgingId="lodging-1" citySlug="saint-gervais-les-bains" categories={[]} pois={[]} initialCustomization={withArrival('')} />)

    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(global.fetch).not.toHaveBeenCalled()
    const field = screen.getByLabelText('Texte de l\'instruction')
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByText('Le texte de l’instruction est requis.')).toBeInTheDocument()
    expect(screen.queryByText(/arrival_instructions/)).not.toBeInTheDocument()

    fireEvent.change(field, { target: { value: 'Ouvrez le portail.' } })
    expect(screen.queryByText('Le texte de l’instruction est requis.')).not.toBeInTheDocument()
  })

  it('AC-01-02 : une erreur de l’API s’affiche sous le champ désigné par son chemin', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false, status: 400,
      json: async () => ({ error: { message: 'Payload invalide', details: {
        fieldErrors: { wifi_ssid: ['Trop long'] }, issues: [{ path: 'wifi_ssid', message: 'Le nom du réseau est trop long.' }],
      } } }),
    }) as jest.Mock
    render(<CustomizationForm lodgingId="lodging-1" citySlug="saint-gervais-les-bains" categories={[]} pois={[]} initialCustomization={customization} />)

    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer' }))

    expect(await screen.findByText('Le nom du réseau est trop long.')).toBeInTheDocument()
    expect(screen.getByLabelText('Nom du réseau (SSID)')).toHaveAttribute('aria-invalid', 'true')
    fireEvent.change(screen.getByLabelText('Nom du réseau (SSID)'), { target: { value: 'Chalet' + 'x' } })
    expect(screen.queryByText('Le nom du réseau est trop long.')).not.toBeInTheDocument()
  })
})
