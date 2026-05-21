/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CitySearchInput } from '@/features/city-guide/components/CitySearchInput'
import type { CitySearchResult } from '@/features/city-guide/types'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

global.fetch = jest.fn()

const mockCity: CitySearchResult = {
  id: 'city-1',
  name: 'Saint-Gervais-les-Bains',
  slug: 'saint-gervais-les-bains',
  postal_code: '74170',
  department: 'Haute-Savoie',
}

describe('CitySearchInput redirect (AC-02-01)', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockPush.mockClear()
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [mockCity] }),
    })
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  it('AC-02-01: redirects to /guide/[city-slug] when user selects a result', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<CitySearchInput />)

    await user.type(
      screen.getByPlaceholderText('Votre ville ou code postal…'),
      'sai'
    )
    act(() => jest.advanceTimersByTime(400))

    await waitFor(() =>
      expect(screen.getByText('Saint-Gervais-les-Bains')).toBeInTheDocument()
    )

    await user.click(screen.getByText('Saint-Gervais-les-Bains'))

    expect(mockPush).toHaveBeenCalledTimes(1)
    expect(mockPush).toHaveBeenCalledWith('/guide/saint-gervais-les-bains')
  })

  it('AC-02-01: shows postal code alongside city name in results', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<CitySearchInput />)

    await user.type(
      screen.getByPlaceholderText('Votre ville ou code postal…'),
      'sai'
    )
    act(() => jest.advanceTimersByTime(400))

    await waitFor(() =>
      expect(screen.getByText('74170')).toBeInTheDocument()
    )
  })
})
