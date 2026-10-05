import { getBlogSlugCandidates } from '@/features/blog/lib/slug'
import nextConfig from '../../next.config.mjs'
import { normalizeGeographicLabel } from '@/shared/lib/editorial-label'

describe('C-14 URL et territoires', () => {
  it('résout le nouveau slug article pendant la transition', () => {
    expect(getBlogSlugCandidates('restaurants-altitude-saint-nicolas-de-veroce')).toContain('article-f7e6dcbc')
  })
  it.each([
    ['/logements/appart-luxe-vue-mont-blanc-6-p', '/logements/appartement-vue-mont-blanc-6-p'],
    ['/journal/article-f7e6dcbc', '/journal/restaurants-altitude-saint-nicolas-de-veroce'],
    ['/blog/article-f7e6dcbc', '/journal/restaurants-altitude-saint-nicolas-de-veroce'],
  ])('préserve %s par redirection permanente', async (source, destination) => {
    expect(await nextConfig.redirects!()).toContainEqual({ source, destination, permanent: true })
  })
  it.each([['haute savoie', 'Haute-Savoie'], ['Auvergne Rhones Alpes', 'Auvergne-Rhône-Alpes'], ['Auvergne Rhône Alpes', 'Auvergne-Rhône-Alpes']])('corrige %s', (value, expected) => {
    expect(normalizeGeographicLabel(value)).toBe(expected)
  })
})
