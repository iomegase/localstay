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
  parking_info: null, equipment_info: null, checkout_instructions: null, trash_info: null,
  trash_location: null, house_rules: null, emergency_contacts: null, useful_services: null,
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
