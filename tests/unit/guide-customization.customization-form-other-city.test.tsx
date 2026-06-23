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

const otherCityPoi = {
  poi_id: 'p1',
  name: 'Le Lac',
  category_name: 'Nature',
  city_slug: 'annecy',
  city_name: 'Annecy',
  owner_note: 'Notre promenade preferee au coucher du soleil.',
}

function mockCustomizationFetch(response = baseCustomization) {
  global.fetch = jest.fn((url: string, init?: RequestInit) => {
    if (init?.method === 'PUT') {
      return Promise.resolve({ ok: true, json: async () => response })
    }
    if (url.includes('/api/dashboard/cities/annecy/pois')) {
      return Promise.resolve({
        ok: true,
        json: async () => ({
          data: {
            city: { slug: 'annecy', name: 'Annecy' },
            pois: [{
              id: 'p1',
              name: 'Le Lac',
              category_slug: 'nature',
              category_name: 'Nature',
            }],
          },
        }),
      })
    }
    return Promise.resolve({ ok: false, json: async () => ({}) })
  }) as jest.Mock
}

describe('CustomizationForm — other-city payload', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCustomizationFetch()
  })

  it('includes the normalized other-city comment in the PUT payload', async () => {
    const user = userEvent.setup()
    render(
      <CustomizationForm
        lodgingId="lodging-1"
        citySlug="saint-gervais"
        categories={[]}
        pois={[]}
        initialCustomization={baseCustomization}
        initialOtherCityPois={[otherCityPoi]}
      />,
    )

    await user.click(screen.getByRole('button', { name: /enregistrer/i }))

    await waitFor(() => expect(global.fetch).toHaveBeenCalled())
    const putCall = (global.fetch as jest.Mock).mock.calls.find(([, init]) => init?.method === 'PUT')
    expect(putCall).toBeTruthy()
    const payload = JSON.parse((putCall![1] as RequestInit).body as string)
    expect(payload.featured_pois).toEqual([{
      poi_id: 'p1',
      owner_note: 'Notre promenade preferee au coucher du soleil.',
      sort_order: 0,
    }])
  })

  it('disables save when an other-city comment exceeds 300 words', async () => {
    const longNote = Array.from({ length: 301 }, () => 'mot').join(' ')
    render(
      <CustomizationForm
        lodgingId="lodging-1"
        citySlug="saint-gervais"
        categories={[]}
        pois={[]}
        initialCustomization={baseCustomization}
        initialOtherCityPois={[{ ...otherCityPoi, owner_note: longNote }]}
      />,
    )

    expect(await screen.findByText('301 / 300 mots')).toHaveClass('text-rose-500')
    expect(screen.getByRole('button', { name: /enregistrer/i })).toBeDisabled()
  })

  it('does not duplicate an other-city POI across two consecutive saves', async () => {
    const user = userEvent.setup()
    mockCustomizationFetch({
      ...baseCustomization,
      featured_pois: [{
        poi_id: 'p1',
        category_id: 'cat-nature',
        owner_note: otherCityPoi.owner_note,
        sort_order: 0,
      }],
    })

    render(
      <CustomizationForm
        lodgingId="lodging-1"
        citySlug="saint-gervais"
        categories={[]}
        pois={[]}
        initialCustomization={baseCustomization}
        initialOtherCityPois={[otherCityPoi]}
      />,
    )

    await user.click(screen.getByRole('button', { name: /enregistrer/i }))
    await screen.findByText('Personnalisation sauvegardée.')
    await user.click(screen.getByRole('button', { name: /enregistrer/i }))

    await waitFor(() => {
      const putCalls = (global.fetch as jest.Mock).mock.calls.filter(([, init]) =>
        init?.method === 'PUT',
      )
      expect(putCalls).toHaveLength(2)
    })

    const putCalls = (global.fetch as jest.Mock).mock.calls.filter(([, init]) =>
      init?.method === 'PUT',
    )
    const secondPayload = JSON.parse(
      (putCalls[1][1] as RequestInit).body as string,
    )
    expect(secondPayload.featured_pois).toHaveLength(1)
    expect(secondPayload.featured_pois[0].poi_id).toBe('p1')
  })
})
