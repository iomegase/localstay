/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { useState } from 'react'
import { OtherCityRecommendations } from '@/features/guide-customization/components/OtherCityRecommendations'
import type { OtherCityPoiSelection } from '@/features/guide-customization/types'

function Harness({ initialValue }: { initialValue: OtherCityPoiSelection[] }) {
  const [value, setValue] = useState(initialValue)

  return (
    <>
      <OtherCityRecommendations
        value={value}
        onChange={setValue}
        excludeCitySlug="saint-gervais-les-bains"
      />
      <pre data-testid="state">{JSON.stringify(value)}</pre>
    </>
  )
}

describe('AC-02-05: commentaire Owner inter-ville', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    global.fetch = jest.fn((url: string) => {
      if (url.includes('/api/dashboard/cities/annecy/pois')) {
        return Promise.resolve({
          ok: true,
          json: async () => ({
            data: {
              city: { slug: 'annecy', name: 'Annecy' },
              pois: [
                {
                  id: 'poi-lac',
                  name: 'Le Lac',
                  category_slug: 'nature',
                  category_name: 'Nature',
                },
                {
                  id: 'poi-chateau',
                  name: 'Le Chateau',
                  category_slug: 'culture',
                  category_name: 'Culture',
                },
              ],
            },
          }),
        })
      }

      return Promise.resolve({ ok: false, json: async () => ({}) })
    }) as jest.Mock
  })

  it('rehydrates, edits and counts the selected POI comment', async () => {
    const user = userEvent.setup()
    render(
      <Harness
        initialValue={[{
          poi_id: 'poi-lac',
          name: 'Le Lac',
          category_name: 'Nature',
          city_slug: 'annecy',
          city_name: 'Annecy',
          owner_note: 'Vue magnifique',
        }]}
      />,
    )

    const textarea = await screen.findByLabelText(
      'Votre mot pour les voyageurs - Le Lac',
    )
    expect(textarea).toHaveValue('Vue magnifique')
    expect(screen.getByText('2 / 300 mots')).toBeInTheDocument()

    await user.clear(textarea)
    await user.type(textarea, 'Parfait pour une promenade au coucher du soleil')

    expect(screen.getByText('8 / 300 mots')).toBeInTheDocument()
    expect(screen.getByTestId('state')).toHaveTextContent(
      '"owner_note":"Parfait pour une promenade au coucher du soleil"',
    )
  })

  it('initializes a newly selected POI comment to null', async () => {
    const user = userEvent.setup()
    render(
      <Harness
        initialValue={[{
          poi_id: 'poi-lac',
          name: 'Le Lac',
          category_name: 'Nature',
          city_slug: 'annecy',
          city_name: 'Annecy',
          owner_note: null,
        }]}
      />,
    )

    await user.click(await screen.findByRole('checkbox', { name: /Le Chateau/ }))

    await waitFor(() => {
      expect(screen.getByTestId('state')).toHaveTextContent(
        '"poi_id":"poi-chateau"',
      )
    })
    expect(screen.getByTestId('state')).toHaveTextContent('"owner_note":null')
  })

  it('keeps the comment editor available when the city POI reload fails', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      json: async () => ({}),
    }) as jest.Mock

    render(
      <Harness
        initialValue={[{
          poi_id: 'poi-lac',
          name: 'Le Lac',
          category_name: 'Nature',
          city_slug: 'annecy',
          city_name: 'Annecy',
          owner_note: null,
        }]}
      />,
    )

    expect(await screen.findByLabelText(
      'Votre mot pour les voyageurs - Le Lac',
    )).toBeInTheDocument()
  })
})
