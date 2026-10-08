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

describe('Mes coups de cœur — vignettes (PO 2026-10-08)', () => {
  it('affiche la photo du POI ou son image de remplacement à côté de son nom', () => {
    render(
      <CustomizationForm
        lodgingId="lodging-1"
        citySlug="saint-gervais-les-bains"
        categories={[{ id: 'cat-1', name: 'Restaurants', slug: 'restaurants', sort_order: 1 }]}
        pois={[
          { id: 'poi-1', name: 'Bistrotsérac', category_id: 'cat-1', category_slug: 'restaurants', category_name: 'Restaurants', photo_url: 'https://cdn.test/bistro.jpg', photo_is_fallback: false },
          { id: 'poi-2', name: 'Casa nostra', category_id: 'cat-1', category_slug: 'restaurants', category_name: 'Restaurants', photo_url: '/fallback/restaurant.jpg', photo_is_fallback: true },
        ]}
        initialCustomization={customization}
      />,
    )
    const thumbs = screen.getAllByTestId('owner-poi-thumb')
    expect(thumbs.map(thumb => thumb.getAttribute('src'))).toEqual(['https://cdn.test/bistro.jpg', '/fallback/restaurant.jpg'])
    expect(thumbs[1]).toHaveClass('opacity-80')
    expect(screen.getByLabelText('Casa nostra')).toHaveAttribute('type', 'checkbox')
  })
})
