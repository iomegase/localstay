const mockRevalidatePath = jest.fn()

jest.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}))

import { safelyRevalidateDiscoveryPaths } from '@/features/public-discovery/lib/revalidation'

describe('041 AC-06-06 discovery revalidation', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('revalidates the public hub and each deduplicated local path once without changing the input', () => {
    const paths = [
      '/decouvrir/saint-gervais',
      '/decouvrir',
      '/decouvrir/saint-gervais/manger',
      '/decouvrir/saint-gervais',
    ]
    const originalPaths = [...paths]

    safelyRevalidateDiscoveryPaths(paths)

    expect(paths).toEqual(originalPaths)
    expect(mockRevalidatePath.mock.calls).toEqual([
      ['/decouvrir', 'page'],
      ['/decouvrir/saint-gervais', 'page'],
      ['/decouvrir/saint-gervais/manger', 'page'],
      ['/sitemap.xml'],
    ])
  })

  it('does not revalidate the hub or sitemap when no local discovery path changed', () => {
    safelyRevalidateDiscoveryPaths([])

    expect(mockRevalidatePath).not.toHaveBeenCalled()
  })
})
