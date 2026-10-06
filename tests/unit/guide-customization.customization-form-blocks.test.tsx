/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import userEvent from '@testing-library/user-event'
import { CustomizationForm } from '@/features/guide-customization/components/CustomizationForm'

jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: jest.fn() }) }))
jest.mock('next/link', () => ({
  __esModule: true,
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}))
jest.mock('@/shared/components/ImageUpload', () => ({ ImageUpload: () => <div data-testid="image-upload" /> }))

const baseCustomization = {
  lodging_id: 'lodging-1',
  category_order: [],
  featured_pois: [],
  ignored_category_slugs: [],
  cover_photo_url: null, lodging_address: null, wifi_ssid: null, wifi_password: null,
  parking_info: null, checkout_instructions: null,
  trash_location: null, house_rules: null, emergency_contacts: null, useful_services: null,
  presentation_video_url: null, parking_photo_url: null, parking_video_url: null,
  practical_blocks: [],
}

describe('CustomizationForm — practical blocks payload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ...baseCustomization }),
    }) as jest.Mock
  })

  it('does not expose fixed departure instructions or house rules', () => {
    render(
      <CustomizationForm
        lodgingId="lodging-1"
        citySlug="saint-gervais"
        categories={[]}
        pois={[]}
        initialCustomization={{
          ...baseCustomization,
          checkout_instructions: 'Ancienne consigne',
          house_rules: 'Ancienne règle',
        }}
      />,
    )

    expect(
      screen.queryByRole('textbox', { name: 'Consignes de départ' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('textbox', { name: 'Règlement intérieur' }),
    ).not.toBeInTheDocument()
  })

  it('adds a block and includes practical_blocks in the PUT payload', async () => {
    const user = userEvent.setup()
    render(
      <CustomizationForm
        lodgingId="lodging-1"
        citySlug="saint-gervais"
        categories={[]}
        pois={[]}
        initialCustomization={baseCustomization}
      />,
    )

    await user.click(screen.getByRole('button', { name: /ajouter un bloc/i }))
    await user.type(screen.getByLabelText(/titre du bloc/i), 'La plage')
    await user.click(screen.getByRole('button', { name: /enregistrer/i }))

    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    const putCall = (global.fetch as jest.Mock).mock.calls.find(
      ([, init]) => init?.method === 'PUT',
    )
    expect(putCall).toBeTruthy()
    const payload = JSON.parse((putCall![1] as RequestInit).body as string)
    expect(payload.practical_blocks).toEqual([
      expect.objectContaining({ title: 'La plage', icon: 'info', sort_order: 0 }),
    ])
  })

  it('083 : un bloc sans titre est signalé sous le champ et rien n’est envoyé', async () => {
    const user = userEvent.setup()
    render(
      <CustomizationForm
        lodgingId="lodging-1"
        citySlug="saint-gervais"
        categories={[]}
        pois={[]}
        initialCustomization={baseCustomization}
      />,
    )

    await user.click(screen.getByRole('button', { name: /ajouter un bloc/i }))
    await user.click(screen.getByRole('button', { name: /enregistrer/i }))

    expect(global.fetch).not.toHaveBeenCalled()
    expect(screen.getByText('Le titre du bloc est requis.')).toBeInTheDocument()
    expect(screen.getByLabelText(/titre du bloc/i)).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByRole('status', { name: 'État de l’enregistrement' })).toHaveTextContent('1 champ à corriger.')

    // AC-01-03 : le message disparaît dès que le champ est corrigé.
    await user.type(screen.getByLabelText(/titre du bloc/i), 'La plage')
    expect(screen.queryByText('Le titre du bloc est requis.')).not.toBeInTheDocument()
  })

  it('shows API field validation details when customization save is rejected', async () => {
    const user = userEvent.setup()
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({
        error: {
          code: 'INVALID_BODY',
          message: 'Payload invalide',
          details: {
            fieldErrors: {
              presentation_video_url: ['Lien YouTube invalide'],
            },
          },
        },
      }),
    }) as jest.Mock

    render(
      <CustomizationForm
        lodgingId="lodging-1"
        citySlug="saint-gervais"
        categories={[]}
        pois={[]}
        initialCustomization={baseCustomization}
      />,
    )

    await user.click(screen.getByRole('button', { name: /enregistrer/i }))

    expect(await screen.findByText(/Vidéo de présentation - Lien YouTube invalide/i)).toBeInTheDocument()
  })

  it('083 : un lien vidéo non YouTube bloque l’envoi et reste signalé sous le champ', async () => {
    const user = userEvent.setup()
    render(
      <CustomizationForm
        lodgingId="lodging-1"
        citySlug="saint-gervais"
        categories={[]}
        pois={[]}
        initialCustomization={baseCustomization}
      />,
    )

    await user.type(screen.getByLabelText(/vidéo de présentation/i), 'https://vimeo.com/123')
    await user.click(screen.getByRole('button', { name: /enregistrer/i }))

    expect(global.fetch).not.toHaveBeenCalled()
    expect(screen.getByText('Lien YouTube invalide')).toBeInTheDocument()
    expect(screen.getByRole('status', { name: 'État de l’enregistrement' })).toHaveTextContent('1 champ à corriger.')
  })

  it('preserves an existing owner note across save and response refresh', async () => {
    const user = userEvent.setup()
    const customizationWithNote = {
      ...baseCustomization,
      featured_pois: [{
        poi_id: 'poi-1',
        category_id: 'cat-1',
        owner_note: 'Notre terrasse préférée.',
        sort_order: 0,
      }],
    }
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => customizationWithNote,
    }) as jest.Mock

    render(
      <CustomizationForm
        lodgingId="lodging-1"
        citySlug="saint-gervais"
        categories={[]}
        pois={[]}
        initialCustomization={customizationWithNote}
      />,
    )

    await user.click(screen.getByRole('button', { name: /enregistrer/i }))
    await screen.findByText('Guide enregistré.')
    await user.click(screen.getByRole('button', { name: /enregistrer/i }))
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(2))

    const payloads = (global.fetch as jest.Mock).mock.calls.map(([, init]) =>
      JSON.parse((init as RequestInit).body as string),
    )
    expect(payloads[0].featured_pois).toEqual([{
      poi_id: 'poi-1',
      owner_note: 'Notre terrasse préférée.',
      sort_order: 0,
    }])
    expect(payloads[1].featured_pois).toEqual([{
      poi_id: 'poi-1',
      owner_note: 'Notre terrasse préférée.',
      sort_order: 0,
    }])
  })
})
