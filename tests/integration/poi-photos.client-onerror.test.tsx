/**
 * @jest-environment jsdom
 */
import { render, screen, fireEvent } from '@testing-library/react'
import { PoiCard } from '@/features/categories/components/PoiCard'
import { PoiDetailHeroCarousel } from '@/features/categories/components/PoiDetailHeroCarousel'
import type { PoiCard as PoiCardType } from '@/features/categories/types'

jest.mock('@/shared/components/MarkdownText', () => ({ MarkdownText: () => <div /> }))

const poi: PoiCardType = {
  id: 'p1',
  name: 'Café Test',
  slug: 'cafe-test',
  address: '1 rue',
  subcategory_name: null,
  rating: null,
  rating_count: 0,
  is_open_now: null,
  distance_km: 1,
  photo_url: null,
  photos: ['https://x/dead.jpg'],
  phone: null,
  website: null,
  description: null,
  closes_at_label: null,
  next_open_label: null,
  latitude: 45,
  longitude: 6,
  trail_detail: null,
}

it('reports the photo and hides it when the header image fails to load', () => {
  const fetchMock = jest.fn().mockResolvedValue({ ok: true })
  global.fetch = fetchMock as unknown as typeof fetch

  render(<PoiCard poi={poi} citySlug="annecy" categorySlug="cafes" />)
  const img = screen.getByRole('img', { name: 'Café Test' })
  fireEvent.error(img)

  expect(fetchMock).toHaveBeenCalledWith(
    '/api/pois/p1/report-dead-photo',
    expect.objectContaining({ method: 'POST', body: JSON.stringify({ url: 'https://x/dead.jpg' }) }),
  )
  expect(screen.queryByRole('img', { name: 'Café Test' })).not.toBeInTheDocument()
})

it('reports and hides a dead hero photo in the detail carousel (with poiId)', () => {
  const fetchMock = jest.fn().mockResolvedValue({ ok: true })
  global.fetch = fetchMock as unknown as typeof fetch

  render(<PoiDetailHeroCarousel photos={['https://x/dead.jpg']} name="Resto Test" poiId="p9" />)
  const img = screen.getByRole('img', { name: 'Resto Test' })
  fireEvent.error(img)

  expect(fetchMock).toHaveBeenCalledWith(
    '/api/pois/p9/report-dead-photo',
    expect.objectContaining({ method: 'POST', body: JSON.stringify({ url: 'https://x/dead.jpg' }) }),
  )
  expect(screen.queryByRole('img', { name: 'Resto Test' })).not.toBeInTheDocument()
})
