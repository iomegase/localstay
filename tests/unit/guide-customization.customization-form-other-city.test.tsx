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

describe('CustomizationForm — other-city payload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn().mockResolvedValue({ ok: true, json: async () => ({ ...baseCustomization }) }) as jest.Mock
  })

  it('includes pre-selected other-city POIs in the PUT payload', async () => {
    const user = userEvent.setup()
    render(
      <CustomizationForm
        lodgingId="lodging-1"
        citySlug="saint-gervais"
        categories={[]}
        pois={[]}
        initialCustomization={baseCustomization}
        initialOtherCityPois={[
          { poi_id: 'p1', name: 'Le Lac', category_name: 'Nature', city_slug: 'annecy', city_name: 'Annecy' },
        ]}
      />,
    )

    await user.click(screen.getByRole('button', { name: /enregistrer/i }))

    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    const putCall = (global.fetch as jest.Mock).mock.calls.find(([, init]) => init?.method === 'PUT')
    expect(putCall).toBeTruthy()
    const payload = JSON.parse((putCall![1] as RequestInit).body as string)
    expect(payload.featured_pois).toEqual([
      expect.objectContaining({ poi_id: 'p1', sort_order: 0 }),
    ])
  })
})
