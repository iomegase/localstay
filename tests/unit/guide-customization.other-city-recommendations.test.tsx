/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { OtherCityRecommendations } from '@/features/guide-customization/components/OtherCityRecommendations'
import type { OtherCityPoiSelection } from '@/features/guide-customization/types'

function mockFetchOnce() {
  global.fetch = jest.fn((url: string) => {
    if (url.includes('/api/cities/search')) {
      return Promise.resolve({ ok: true, json: async () => ({ data: [{ id: 'cityB', name: 'Annecy', slug: 'annecy' }] }) })
    }
    if (url.includes('/api/dashboard/cities/annecy/pois')) {
      return Promise.resolve({ ok: true, json: async () => ({ data: { city: { slug: 'annecy', name: 'Annecy' }, pois: [{ id: 'p1', name: 'Le Lac', category_slug: 'nature', category_name: 'Nature' }] } }) })
    }
    return Promise.resolve({ ok: false, json: async () => ({}) })
  }) as jest.Mock
}

function Harness() {
  const [value, setValue] = useState<OtherCityPoiSelection[]>([])
  return (
    <>
      <OtherCityRecommendations value={value} onChange={setValue} excludeCitySlug="saint-gervais" />
      <pre data-testid="state">{JSON.stringify(value)}</pre>
    </>
  )
}

describe('OtherCityRecommendations', () => {
  beforeEach(() => { jest.clearAllMocks(); mockFetchOnce() })

  it('searches a city, lists its POIs, and selecting one updates the value', async () => {
    const user = userEvent.setup()
    render(<Harness />)

    await user.type(screen.getByLabelText(/rechercher une ville/i), 'ann')
    await user.click(await screen.findByRole('button', { name: /annecy/i }))

    const poiCheckbox = await screen.findByLabelText(/le lac/i)
    await user.click(poiCheckbox)

    await waitFor(() =>
      expect(screen.getByTestId('state').textContent).toContain('"poi_id":"p1"'),
    )
    expect(screen.getByTestId('state').textContent).toContain('"city_slug":"annecy"')
  })
})
