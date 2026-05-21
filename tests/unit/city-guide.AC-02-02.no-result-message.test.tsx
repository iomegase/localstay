/**
 * @jest-environment jsdom
 */
import { render, screen, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CitySearchInput } from '@/features/city-guide/components/CitySearchInput'

const mockPush = jest.fn()
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: mockPush }),
}))

global.fetch = jest.fn()

describe('CitySearchInput (AC-02-02, AC-02-03)', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockPush.mockClear()
  })

  afterEach(() => {
    jest.runOnlyPendingTimers()
    jest.useRealTimers()
    jest.clearAllMocks()
  })

  it('AC-02-03: does not fetch when fewer than 3 characters typed', async () => {
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<CitySearchInput />)

    await user.type(screen.getByPlaceholderText('Votre ville ou code postal…'), 'sa')
    act(() => jest.advanceTimersByTime(400))

    expect(global.fetch).not.toHaveBeenCalled()
  })

  it('AC-02-02: shows no-result message when API returns empty array', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    })
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<CitySearchInput />)

    await user.type(screen.getByPlaceholderText('Votre ville ou code postal…'), 'xyz')
    act(() => jest.advanceTimersByTime(400))

    await waitFor(() =>
      expect(screen.getByText(/Aucune ville trouvée/i)).toBeInTheDocument()
    )
  })

  it('AC-02-03: fetches after debounce when 3+ characters typed', async () => {
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: [] }),
    })
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<CitySearchInput />)

    await user.type(screen.getByPlaceholderText('Votre ville ou code postal…'), 'sai')
    act(() => jest.advanceTimersByTime(400))

    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1))
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/cities/search?q=sai')
    )
  })

  it('AC-02-03: renders up to 10 suggestions', async () => {
    const mockCities = Array.from({ length: 10 }, (_, i) => ({
      id: `city-${i}`,
      name: `Ville ${i}`,
      slug: `ville-${i}`,
      postal_code: `0000${i}`,
      department: null,
    }))
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({ data: mockCities }),
    })
    const user = userEvent.setup({ advanceTimers: jest.advanceTimersByTime })
    render(<CitySearchInput />)

    await user.type(screen.getByPlaceholderText('Votre ville ou code postal…'), 'vil')
    act(() => jest.advanceTimersByTime(400))

    await waitFor(() => expect(screen.getAllByRole('option').length).toBe(10))
  })
})
