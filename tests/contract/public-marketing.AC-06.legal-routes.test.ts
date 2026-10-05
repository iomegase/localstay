import { NextRequest } from 'next/server'

jest.mock('@/shared/lib/supabase', () => ({ createSupabaseMiddlewareClient: jest.fn() }))
jest.mock('@/features/seo/queries/sitemap-data', () => ({
  getSitemapData: jest.fn(async () => ({ cities: [], pois: [], lodgings: [], blogArticles: [] })),
}))
jest.mock('@/features/local-seo/lib/sitemap', () => ({ localSeoSitemapPaths: jest.fn(async () => []) }))

import { proxy, isAnonymousMarketingPath } from '../../src/proxy'
import sitemap from '@/app/sitemap'

const paths = ['/mentions-legales', '/confidentialite', '/cgu']

it.each(paths)('AC-06-01 keeps %s public with and without an active stay', async path => {
  expect(isAnonymousMarketingPath(path)).toBe(true)
  for (const cookie of ['', 'lodging_id=11111111-1111-4111-8111-111111111111']) {
    const response = await proxy(new NextRequest(`http://localhost:3000${path}`, { headers: { cookie } }))
    expect(response.headers.get('location')).toBeNull()
    expect(response.headers.get('x-middleware-rewrite')).toBeNull()
    expect(response.headers.get('x-middleware-request-x-staylocal-marketing-route')).toBe('1')
  }
})

it('AC-06-05 includes each legal page once in the sitemap', async () => {
  const entries = await sitemap()
  for (const path of paths) expect(entries.filter(entry => new URL(entry.url).pathname === path)).toHaveLength(1)
})
