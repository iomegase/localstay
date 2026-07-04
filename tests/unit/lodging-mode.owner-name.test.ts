const mockCookies = jest.fn()
const mockFindFirst = jest.fn()

jest.mock('next/headers', () => ({
  cookies: () => mockCookies(),
}))

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodging: {
      findFirst: (...args: unknown[]) => mockFindFirst(...args),
    },
  },
}))

import { getActiveLodgingContext, LODGING_COOKIE_NAME } from '@/features/public-menu/lib/lodging-mode'

const lodgingId = 'dc682b31-d390-4a3b-ae2e-e7342581535f'

describe('getActiveLodgingContext owner display name', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCookies.mockResolvedValue({
      get: (name: string) => name === LODGING_COOKIE_NAME ? { value: lodgingId } : undefined,
    })
  })

  it('exposes only the owner first name publicly', async () => {
    mockFindFirst.mockResolvedValue({
      id: lodgingId,
      name: 'Le 305',
      city: { slug: 'saint-gervais-les-bains', name: 'Saint-Gervais-les-Bains' },
      owner: { first_name: 'Marlene', last_name: 'Hourcade' },
    })

    await expect(getActiveLodgingContext()).resolves.toMatchObject({
      ownerName: 'Marlene',
    })
  })
})
