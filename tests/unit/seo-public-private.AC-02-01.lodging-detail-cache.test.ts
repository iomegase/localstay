const mockFindFirstProfile = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodgingPublicProfile: {
      findFirst: (...args: unknown[]) => mockFindFirstProfile(...args),
    },
  },
}))

jest.mock('react', () => {
  const actual = jest.requireActual<typeof import('react')>('react')

  return {
    ...actual,
    cache: <Args extends unknown[], Result>(reader: (...args: Args) => Result) => {
      const values = new Map<string, Result>()
      return (...args: Args): Result => {
        const key = JSON.stringify(args)
        if (!values.has(key)) values.set(key, reader(...args))
        return values.get(key) as Result
      }
    },
  }
})

import { getPublishedLodgingDetailBySlug } from '@/features/lodging-showcase/queries/public-lodgings'

describe('short lodging detail request cache', () => {
  beforeEach(() => mockFindFirstProfile.mockClear())
  it('resolves the renamed lodging before its data migration', async () => {
    mockFindFirstProfile.mockResolvedValue(null)
    await getPublishedLodgingDetailBySlug('appartement-vue-mont-blanc-6-p')
    expect(mockFindFirstProfile).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ slug: { in: ['appartement-vue-mont-blanc-6-p', 'appart-luxe-vue-mont-blanc-6-p'] } }) }))
    mockFindFirstProfile.mockClear()
  })
  it('shares one Prisma read between metadata and page consumers for the same slug', async () => {
    mockFindFirstProfile.mockResolvedValue(null)

    await getPublishedLodgingDetailBySlug('chalet-hygge')
    await getPublishedLodgingDetailBySlug('chalet-hygge')

    expect(mockFindFirstProfile).toHaveBeenCalledTimes(1)
  })
})
