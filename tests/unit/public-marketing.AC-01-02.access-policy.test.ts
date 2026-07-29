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
    '/guide/saint-gervais-les-bains/logements/le-chalet-hygge',
  ])('allows the marketing route %s without a lodging cookie', pathname => {
    expect(isAnonymousMarketingPath(pathname)).toBe(true)
  })

  test.each([
    '/le-logement',
    '/nos-recommandations',
    '/map',
    '/mes-favoris',
    '/services-prives',
    '/guide/saint-gervais-les-bains/logements',
  ])('keeps the guest route %s behind the invitation gate', pathname => {
    expect(isAnonymousMarketingPath(pathname)).toBe(false)
  })

  it('marks a public lodging detail request so the layout skips the 430px guide shell', async () => {
    const response = await proxy(
      new NextRequest(
        'http://localhost:3000/guide/saint-gervais-les-bains/logements/le-chalet-hygge',
      ),
    )

    expect(
      response.headers.get(
        'x-middleware-request-x-staylocal-marketing-route',
      ),
    ).toBe('1')
  })
})
