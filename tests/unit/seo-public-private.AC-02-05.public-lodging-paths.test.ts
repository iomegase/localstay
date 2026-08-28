import { publicLodgingPath, publicLodgingsPath } from '@/features/lodging-showcase/lib/public-paths'

describe('042-seo-public-private-architecture public lodging paths', () => {
  it('builds the canonical public lodging namespace and slug path', () => {
    expect(publicLodgingsPath()).toBe('/logements')
    expect(publicLodgingPath('chalet-hygge')).toBe('/logements/chalet-hygge')
  })

  it('encodes the lodging slug as a single URL path segment', () => {
    expect(publicLodgingPath('cabane/été neige')).toBe('/logements/cabane%2F%C3%A9t%C3%A9%20neige')
  })
})
