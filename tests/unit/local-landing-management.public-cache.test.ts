const mockFindDestination = jest.fn().mockResolvedValue(null)
jest.mock('@/shared/lib/prisma', () => ({ prisma: { localLandingDestination: { findFirst: (...args: unknown[]) => mockFindDestination(...args) } } }))
// Same request-cache harness used by the public lodging-detail tests.
jest.mock('react', () => ({
  ...jest.requireActual<typeof import('react')>('react'),
  cache: <Args extends unknown[], Result>(reader: (...args: Args) => Result) => {
    const values = new Map<string, Result>()
    return (...args: Args): Result => {
      const key = JSON.stringify(args)
      if (!values.has(key)) values.set(key, reader(...args))
      return values.get(key) as Result
    }
  },
}))
import { getPublishedLocalLanding } from '@/features/local-seo/queries/landing-pages'

it('shares metadata/page reads per slug and intent without combining separate destinations', async () => {
  await getPublishedLocalLanding('megeve', 'CONCIERGE')
  await getPublishedLocalLanding('megeve', 'CONCIERGE')
  expect(mockFindDestination).toHaveBeenCalledTimes(1)
  await getPublishedLocalLanding('megeve', 'SEMINAR')
  await getPublishedLocalLanding('combloux', 'CONCIERGE')
  expect(mockFindDestination).toHaveBeenCalledTimes(3)
})
