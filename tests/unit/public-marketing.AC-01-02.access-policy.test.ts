import { NextRequest } from 'next/server'
import { isAnonymousMarketingPath, proxy } from '@/proxy'

describe('031-public-marketing-site anonymous access policy', () => {
  test.each([
    '/',
    '/concept',
    '/seminaires',
    '/confier-mon-logement',
    '/connexion',
    '/logements',
    '/logements/chalet-hygge',
    '/blog',
    '/blog/bien-preparer-son-sejour',
    '/decouvrir',
  ])('allows the marketing route %s without a lodging cookie', pathname => {
    expect(isAnonymousMarketingPath(pathname)).toBe(true)
  })

  it('keeps the public discovery root outside the invitation gate', async () => {
    const response = await proxy(new NextRequest('http://localhost:3000/decouvrir'))

    expect(response.status).toBe(200)
    expect(response.headers.get('x-middleware-rewrite')).toBeNull()
    expect(
      response.headers.get('x-middleware-request-x-staylocal-marketing-route'),
    ).toBe('1')
  })

  test.each([
    '/le-logement',
    '/nos-recommandations',
    '/map',
    '/mes-favoris',
    '/services-prives',
    '/sejour',
    '/guide/saint-gervais-les-bains/logements',
    '/guide/saint-gervais-les-bains/logements/le-chalet-hygge',
  ])('does not classify the private or historical guide route %s as current marketing', pathname => {
    expect(isAnonymousMarketingPath(pathname)).toBe(false)
  })

  it('lets a historical lodging detail reach its 308 page without classifying it as public marketing', async () => {
    const response = await proxy(
      new NextRequest(
        'http://localhost:3000/guide/saint-gervais-les-bains/logements/le-chalet-hygge',
      ),
    )

    expect(response.headers.get('x-middleware-rewrite')).toBeNull()
    expect(response.headers.get('x-middleware-next')).toBe('1')
    expect(response.headers.get(
      'x-middleware-request-x-staylocal-marketing-route',
    )).toBeNull()
  })
})
