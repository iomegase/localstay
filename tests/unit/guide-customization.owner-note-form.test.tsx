/**
 * @jest-environment jsdom
 */
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CustomizationForm } from '@/features/guide-customization/components/CustomizationForm'

jest.mock('next/link', () => ({
  __esModule: true,
  default: ({
    href,
    children,
  }: {
    href: string
    children: React.ReactNode
  }) => <a href={href}>{children}</a>,
}))

jest.mock('@/shared/components/ImageUpload', () => ({
  ImageUpload: () => <div data-testid="image-upload" />,
}))

const baseCustomization = {
  lodging_id: 'lodging-1',
  welcome_message: null,
  category_order: ['restaurants'],
  featured_pois: [{
    poi_id: 'poi-1',
    category_id: 'cat-1',
    owner_note: null,
    sort_order: 0,
  }],
  ignored_category_slugs: [],
  cover_photo_url: null,
  lodging_address: null,
  wifi_ssid: null,
  wifi_password: null,
  parking_info: null,
  equipment_info: null,
  checkout_instructions: null,
  trash_info: null,
  trash_location: null,
  house_rules: null,
  emergency_contacts: null,
  useful_services: null,
  practical_blocks: [],
}

function renderSelectedPoi() {
  return render(
    <CustomizationForm
      lodgingId="lodging-1"
      citySlug="saint-gervais"
      categories={[{
        id: 'cat-1',
        name: 'Restaurants',
        slug: 'restaurants',
        sort_order: 0,
      }]}
      pois={[{
        id: 'poi-1',
        name: 'Bistrot du Centre',
        category_id: 'cat-1',
        category_slug: 'restaurants',
        category_name: 'Restaurants',
      }]}
      initialCustomization={baseCustomization}
    />,
  )
}

describe('CustomizationForm — owner recommendation comment', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ...baseCustomization,
        featured_pois: [{
          ...baseCustomization.featured_pois[0],
          owner_note: 'Une adresse chaleureuse après la randonnée.',
        }],
      }),
    }) as jest.Mock
  })

  it('AC-02-04: shows and submits a word-counted comment for a selected POI', async () => {
    const user = userEvent.setup()
    renderSelectedPoi()

    await user.click(screen.getAllByText('Restaurants')[1])
    const textarea = screen.getByLabelText(/votre mot pour les voyageurs/i)
    await user.type(textarea, '  Une adresse chaleureuse après la randonnée.  ')

    expect(screen.getByText('6 / 300 mots')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /enregistrer/i }))
    await waitFor(() => expect(global.fetch).toHaveBeenCalled())

    const payload = JSON.parse(
      ((global.fetch as jest.Mock).mock.calls[0][1] as RequestInit).body as string,
    )
    expect(payload.featured_pois[0].owner_note).toBe(
      'Une adresse chaleureuse après la randonnée.',
    )
  })

  it('AC-02-04: disables save above 300 words', async () => {
    const user = userEvent.setup()
    renderSelectedPoi()

    await user.click(screen.getAllByText('Restaurants')[1])
    const textarea = screen.getByLabelText(/votre mot pour les voyageurs/i)
    fireEvent.change(textarea, {
      target: { value: Array.from({ length: 301 }, () => 'mot').join(' ') },
    })

    expect(screen.getByText('301 / 300 mots')).toHaveClass('text-rose-500')
    expect(screen.getByRole('button', { name: /enregistrer/i })).toBeDisabled()
  })
})
