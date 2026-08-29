/** @jest-environment node */

const mockGetActiveLodgingContext = jest.fn()
const mockCookies = jest.fn()
const mockRedirect = jest.fn((destination: string) => {
  throw new Error(`REDIRECT:${destination}`)
})

jest.mock('next/navigation', () => ({
  redirect: (destination: string) => mockRedirect(destination),
}))

jest.mock('next/headers', () => ({
  cookies: () => mockCookies(),
}))

jest.mock('@/features/public-menu/lib/lodging-mode', () => ({
  getActiveLodgingContext: () => mockGetActiveLodgingContext(),
}))

import {
  getOptionalActiveLodgingContext,
  requireActiveLodgingContext,
} from '@/features/public-menu/lib/private-stay-guard'

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
    mockCookies.mockResolvedValue({ get: jest.fn(() => undefined) })
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

  it('keeps a hybrid legacy route public only when no lodging cookie exists', async () => {
    await expect(
      getOptionalActiveLodgingContext('saint-gervais-les-bains'),
    ).resolves.toBeNull()
    expect(mockGetActiveLodgingContext).not.toHaveBeenCalled()
    expect(mockRedirect).not.toHaveBeenCalled()
  })

  it.each([
    'a4f87d13-317b-4ce5-8c9f-1bc33581b194',
    'forged-cookie',
    '',
  ])('rejects a present %p cookie when it has no active Lodging', async cookieValue => {
    mockCookies.mockResolvedValue({
      get: jest.fn(() => ({ value: cookieValue })),
    })
    mockGetActiveLodgingContext.mockResolvedValue(null)

    await expect(
      getOptionalActiveLodgingContext('saint-gervais-les-bains'),
    ).rejects.toThrow('REDIRECT:/acces-reserve')
  })

  it('rejects a hybrid stay context from another City', async () => {
    mockCookies.mockResolvedValue({
      get: jest.fn(() => ({ value: ACTIVE_CONTEXT.lodgingId })),
    })
    mockGetActiveLodgingContext.mockResolvedValue(ACTIVE_CONTEXT)

    await expect(
      getOptionalActiveLodgingContext('annecy'),
    ).rejects.toThrow('REDIRECT:/acces-reserve')
  })

  it('returns the matching active context on a hybrid route', async () => {
    mockCookies.mockResolvedValue({
      get: jest.fn(() => ({ value: ACTIVE_CONTEXT.lodgingId })),
    })
    mockGetActiveLodgingContext.mockResolvedValue(ACTIVE_CONTEXT)

    await expect(
      getOptionalActiveLodgingContext('saint-gervais-les-bains'),
    ).resolves.toEqual(ACTIVE_CONTEXT)
  })
})
