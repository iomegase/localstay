const mockRevalidatePath = jest.fn()

jest.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}))

import { revalidatePublicLodgingPaths } from '@/features/lodging-showcase/lib/revalidation'

describe('042 BR-15 public lodging revalidation', () => {
  beforeEach(() => {
    mockRevalidatePath.mockClear()
  })

  it('revalidates only the short listing, detail pattern, and sitemap in order', () => {
    revalidatePublicLodgingPaths()

    expect(mockRevalidatePath).toHaveBeenCalledTimes(3)
    expect(mockRevalidatePath).toHaveBeenNthCalledWith(1, '/logements', 'page')
    expect(mockRevalidatePath).toHaveBeenNthCalledWith(
      2,
      '/logements/[lodging-slug]',
      'page',
    )
    expect(mockRevalidatePath).toHaveBeenNthCalledWith(3, '/sitemap.xml')
  })
})
