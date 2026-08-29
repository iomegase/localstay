/** @jest-environment node */

const mockGetActiveLodgingContext = jest.fn()
const mockRedirect = jest.fn((destination: string) => {
  throw new Error(`REDIRECT:${destination}`)
})

jest.mock('next/navigation', () => ({
  redirect: (destination: string) => mockRedirect(destination),
}))

jest.mock('@/features/public-menu/lib/lodging-mode', () => ({
  getActiveLodgingContext: () => mockGetActiveLodgingContext(),
}))

import { requireActiveLodgingContext } from '@/features/public-menu/lib/private-stay-guard'

const ACTIVE_CONTEXT = {
  lodgingId: 'dc682b31-d390-4a3b-ae2e-e7342581535f',
  lodgingName: 'Chalet MyStay',
  citySlug: 'saint-gervais-les-bains',
  cityName: 'Saint-Gervais-les-Bains',
  ownerName: 'Alice',
}

describe('042 private stay server guard — AC-01-03 / BR-05', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('returns an active lodging context for the expected City', async () => {
    mockGetActiveLodgingContext.mockResolvedValue(ACTIVE_CONTEXT)

    await expect(
      requireActiveLodgingContext('saint-gervais-les-bains'),
    ).resolves.toEqual(ACTIVE_CONTEXT)
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it('redirects when the UUID cookie has no active lodging', async () => {
    mockGetActiveLodgingContext.mockResolvedValue(null)

    await expect(requireActiveLodgingContext()).rejects.toThrow(
      'REDIRECT:/acces-reserve',
    )
  })

  it('redirects when the active lodging belongs to another City', async () => {
    mockGetActiveLodgingContext.mockResolvedValue(ACTIVE_CONTEXT)

    await expect(requireActiveLodgingContext('annecy')).rejects.toThrow(
      'REDIRECT:/acces-reserve',
    )
  })
})
