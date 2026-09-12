const mockRevalidatePath = jest.fn()

jest.mock('next/cache', () => ({
  revalidatePath: (...args: unknown[]) => mockRevalidatePath(...args),
}))

import { revalidatePublicLodgingPaths } from '@/features/lodging-showcase/lib/revalidation'

describe('042 BR-15 public lodging revalidation', () => {
  beforeEach(() => {
    mockRevalidatePath.mockClear()
  })

  it('revalidates affected vacation destinations and their hubs with the lodging surfaces', () => {
    revalidatePublicLodgingPaths(
      ['megeve', 'combloux', 'megeve'],
      ['chalet-public', 'chalet-public'],
    )

    expect(mockRevalidatePath).toHaveBeenCalledWith('/locations-vacances/megeve', 'page')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/locations-vacances/combloux', 'page')
    expect(mockRevalidatePath.mock.calls.filter(([path]) => path === '/locations-vacances/megeve')).toHaveLength(1)
    expect(mockRevalidatePath).toHaveBeenCalledWith('/confier-mon-logement', 'page')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/seminaires', 'page')
    expect(mockRevalidatePath).toHaveBeenCalledWith('/logements/chalet-public', 'page')
    expect(mockRevalidatePath.mock.calls.filter(([path]) => path === '/logements/chalet-public')).toHaveLength(1)
    expect(mockRevalidatePath).toHaveBeenNthCalledWith(1, '/logements', 'page')
    expect(mockRevalidatePath).toHaveBeenNthCalledWith(
      2,
      '/logements/[lodging-slug]',
      'page',
    )
    expect(mockRevalidatePath).toHaveBeenNthCalledWith(3, '/sitemap.xml')
  })
})
