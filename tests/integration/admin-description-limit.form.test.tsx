/** @jest-environment jsdom */
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { AdminPoiEditForm } from '@/features/admin-pois/components/AdminPoiEditForm'
import type { AdminPoiDetail } from '@/features/admin-pois/types'

const mockRefresh = jest.fn()
jest.mock('next/navigation', () => ({ useRouter: () => ({ refresh: mockRefresh }) }))

jest.mock('@/features/trail-navigation/components/TrailPreviewMap', () => ({ TrailPreviewMap: () => null }))
jest.mock('@/shared/components/ImageUpload', () => ({ ImageUpload: () => null }))

const poi: AdminPoiDetail = {
  id: '44444444-4444-4444-8444-444444444444', name: 'Refuge du Mont-Joly', slug: 'refuge-mont-joly',
  address: 'Saint-Gervais-les-Bains', description: 'Description actuelle.', website: null, phone: null,
  status: 'active', city: { id: 'city', name: 'Saint-Gervais-les-Bains', slug: 'saint-gervais' },
  category: { id: 'category', name: 'Refuges', slug: 'refuges' }, subcategory: null,
  photos: [], tags: [], latitude: 45.8, longitude: 6.7, geocode_status: 'success', photo_count: 0,
  primary_photo_url: null, has_usable_photo: false, photos_status: 'ok', review_source: 'MANUAL', merchant_attached: false,
  has_trail_detail: false, updated_at: '2026-09-28T10:00:00.000Z', discovery_status: 'DRAFT',
  discovery_published_at: null, public_url: null, slug_editable: false, trail_fields_locked: false,
  trail_detail: null, discovery_public_url: null,
  discovery_eligibility: { eligible: false, checks: { active: true, city: true, category: true, subcategory: true, description: true, photo: false, address: true, geocode: true, contact: false } },
}
const proposal = { description: 'Ce chalet accueille les randonneurs. Une restauration familiale y est proposée.', source_mode: 'web_search', sources: [{ title: 'Office de tourisme', url: 'https://tourisme.example/refuge' }], search_entry_point: '<div>Google Search</div>' }
const mockFetch = jest.fn()
const originalFetch = global.fetch
beforeEach(() => { jest.clearAllMocks(); global.fetch = mockFetch; mockFetch.mockResolvedValue({ ok: true, json: async () => ({ data: proposal }) }) })
afterAll(() => { global.fetch = originalFetch })
function mount(value = poi) { return render(<AdminPoiEditForm poi={value} categories={[poi.category]} />) }
async function generate() {
  fireEvent.click(screen.getByRole('button', { name: 'Proposer une description' }))
  return screen.findByRole('textbox', { name: 'Proposition à relire' })
}

it('compteur de caractères sous la description, en rouge au-delà de 5 000', () => {
  mount()
  const field = screen.getByRole('textbox', { name: 'Description', exact: true })
  fireEvent.change(field, { target: { value: '**Gras** et liste :\n\n- un\n- deux' } })
  expect(screen.getByTestId('description-length')).toHaveTextContent(/^32 \/ 5\s?000 caractères$/)
  expect(screen.getByTestId('description-length')).not.toHaveClass('text-rose-600')
  fireEvent.change(field, { target: { value: 'x'.repeat(5001) } })
  expect(screen.getByTestId('description-length')).toHaveClass('text-rose-600')
  expect(screen.getByTestId('description-length')).toHaveTextContent(/La description dépasse 5\s?000 caractères\./)
})
