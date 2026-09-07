import { NextRequest } from 'next/server'
import { isAnonymousMarketingPath, proxy } from '@/proxy'

describe('046-local-seo-city-cluster anonymous access policy', () => {
  test.each([
    '/conciergerie/saint-gervais-les-bains',
    '/seminaires/saint-nicolas-de-veroce',
    '/locations-vacances/combloux',
  ])('allows the local SEO route %s without a lodging cookie', async pathname => {
    expect(isAnonymousMarketingPath(pathname)).toBe(true)

    const response = await proxy(new NextRequest(`http://localhost:3000${pathname}`))

    expect(response.headers.get('x-middleware-rewrite')).toBeNull()
    expect(
      response.headers.get('x-middleware-request-x-staylocal-marketing-route'),
    ).toBe('1')
  })
})
