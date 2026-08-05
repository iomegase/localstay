/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
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
  welcome_message: null,
  category_order: [],
  featured_pois: [],
  ignored_category_slugs: [],
  cover_photo_url: null, lodging_address: null, wifi_ssid: null, wifi_password: null,
  parking_info: null, checkout_instructions: null, trash_info: null,
  trash_location: null, house_rules: null, emergency_contacts: null, useful_services: null,
  presentation_video_url: null, parking_photo_url: null, parking_video_url: null,
  practical_blocks: [],
  trash_bins: [],
}

describe('CustomizationForm — practical blocks payload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ ...baseCustomization }),
    }) as jest.Mock
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

  it('disables save and explains when a custom practical block has no title', async () => {
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

    expect(screen.getByRole('button', { name: /enregistrer/i })).toBeDisabled()
    expect(screen.getByText(/un bloc personnalisé doit avoir un titre/i)).toBeInTheDocument()
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

  it('disables save when a presentation video URL is not a YouTube link', async () => {
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

    expect(screen.getByRole('button', { name: /enregistrer/i })).toBeDisabled()
    expect(screen.getByText(/les liens vidéo doivent être des URL YouTube valides/i)).toBeInTheDocument()
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
    await screen.findByText('Personnalisation sauvegardée.')
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
