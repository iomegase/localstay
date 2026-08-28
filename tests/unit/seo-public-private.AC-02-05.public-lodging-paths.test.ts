import { publicLodgingPath, publicLodgingsPath } from '@/features/lodging-showcase/lib/public-paths'

describe('042-seo-public-private-architecture public lodging paths', () => {
  it('builds the canonical public lodging namespace and slug path', () => {
    expect(publicLodgingsPath()).toBe('/logements')
    expect(publicLodgingPath('chalet-hygge')).toBe('/logements/chalet-hygge')
  })
})
