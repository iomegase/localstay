/** @jest-environment node */

import { NextRequest } from 'next/server'
import { proxy } from '@/proxy'

jest.mock('@/shared/lib/supabase', () => ({
  createSupabaseMiddlewareClient: jest.fn(),
}))

describe('031-public-marketing-site QR landing', () => {
  it.each([
    '/guide/saint-gervais-les-bains',
    '/guide/saint-gervais-les-bains/diner',
    '/guide/saint-gervais-les-bains/diner/le-serac',
  ])('redirects a valid QR entry %s to the private stay home before rendering a legacy page', async path => {
    const lodgingId = 'dc682b31-d390-4a3b-ae2e-e7342581535f'
    const response = await proxy(
      new NextRequest(
        `http://localhost:3000${path}?lodging=${lodgingId}`,
      ),
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      `http://localhost:3000/sejour?lodging=${lodgingId}`,
    )
    expect(response.cookies.get('lodging_id')?.value).toBe(lodgingId)
    expect(response.headers.get('x-middleware-next')).toBeNull()
    const setCookie = response.headers.get('set-cookie') ?? ''
    expect(setCookie).toContain('Path=/')
    expect(setCookie).toContain('Max-Age=604800')
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).toContain('SameSite=lax')
    expect(setCookie).not.toContain('Secure')
  })

  it('keeps the City QR landing redirect even when the same cookie already exists', async () => {
    const lodgingId = 'dc682b31-d390-4a3b-ae2e-e7342581535f'
    const response = await proxy(new NextRequest(
      `http://localhost:3000/guide/saint-gervais-les-bains?lodging=${lodgingId}`,
      { headers: { cookie: `lodging_id=${lodgingId}` } },
    ))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      `http://localhost:3000/sejour?lodging=${lodgingId}`,
    )
  })

  it.each([
    '/guide/saint-gervais-les-bains/agenda/fete-du-village',
    '/guide/saint-gervais-les-bains/rando/mont-joux/start',
  ])('redirects a private compatibility route %s through the stay home without a matching cookie', async path => {
    const lodgingId = 'dc682b31-d390-4a3b-ae2e-e7342581535f'
    const response = await proxy(
      new NextRequest(`http://localhost:3000${path}?lodging=${lodgingId}`),
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      `http://localhost:3000/sejour?lodging=${lodgingId}`,
    )
    expect(response.cookies.get('lodging_id')?.value).toBe(lodgingId)
  })

  it('evaluates a valid QR before the historical lodging redirect', async () => {
    const lodgingId = 'dc682b31-d390-4a3b-ae2e-e7342581535f'
    const response = await proxy(new NextRequest(
      `http://localhost:3000/guide/saint-gervais-les-bains/logements/chalet-hygge?lodging=${lodgingId}`,
    ))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      `http://localhost:3000/sejour?lodging=${lodgingId}`,
    )
    expect(response.cookies.get('lodging_id')?.value).toBe(lodgingId)
  })

  it('does not activate or redirect an invalid lodging identifier', async () => {
    const response = await proxy(
      new NextRequest(
        'http://localhost:3000/guide/saint-gervais-les-bains/diner/le-serac?lodging=javascript:alert(1)',
      ),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
    expect(response.cookies.get('lodging_id')).toBeUndefined()
  })

  it('applies the normal access gate to an invalid lodging identifier on a private compatibility route', async () => {
    const response = await proxy(
      new NextRequest(
        'http://localhost:3000/guide/saint-gervais-les-bains/contact?lodging=not-a-uuid',
      ),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
    expect(response.headers.get('x-middleware-rewrite')).toBe(
      'http://localhost:3000/acces-reserve',
    )
    expect(response.cookies.get('lodging_id')).toBeUndefined()
  })

  it('forwards only the validated lodging UUID to the canonical stay URL', async () => {
    const lodgingId = 'dc682b31-d390-4a3b-ae2e-e7342581535f'
    const response = await proxy(
      new NextRequest(
        `http://localhost:3000/guide/saint-gervais-les-bains/diner/le-serac?lodging=${lodgingId}&next=https%3A%2F%2Fevil.example&token=private`,
      ),
    )

    expect(response.headers.get('location')).toBe(
      `http://localhost:3000/sejour?lodging=${lodgingId}`,
    )
  })

  it.each([
    '/guide/saint-gervais-les-bains/diner',
    '/guide/saint-gervais-les-bains/diner/le-serac',
    '/guide/saint-gervais-les-bains/contact',
    '/guide/saint-gervais-les-bains/agenda/fete-du-village',
    '/guide/saint-gervais-les-bains/rando/mont-joux/start',
  ])('keeps matching-cookie private navigation on %s and refreshes the bearer cookie', async path => {
    const lodgingId = 'dc682b31-d390-4a3b-ae2e-e7342581535f'
    const response = await proxy(new NextRequest(
      `http://localhost:3000${path}?lodging=${lodgingId}`,
      { headers: { cookie: `lodging_id=${lodgingId}` } },
    ))

    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
    const setCookie = response.headers.get('set-cookie') ?? ''
    expect(setCookie).toContain(`lodging_id=${lodgingId}`)
    expect(setCookie).toContain('Path=/')
    expect(setCookie).toContain('Max-Age=604800')
    expect(setCookie).toContain('HttpOnly')
    expect(setCookie).toContain('SameSite=lax')
    expect(setCookie).not.toContain('Secure')
  })

  it('hands a different-cookie deep request through the canonical stay landing', async () => {
    const lodgingId = 'dc682b31-d390-4a3b-ae2e-e7342581535f'
    const response = await proxy(new NextRequest(
      `http://localhost:3000/guide/saint-gervais-les-bains/diner/le-serac?lodging=${lodgingId}`,
      { headers: { cookie: 'lodging_id=11111111-1111-1111-1111-111111111111' } },
    ))

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      `http://localhost:3000/sejour?lodging=${lodgingId}`,
    )
  })

  it('marks the lodging bearer cookie Secure in production', async () => {
    const previousNodeEnv = process.env.NODE_ENV
    process.env.NODE_ENV = 'production'
    try {
      const lodgingId = 'dc682b31-d390-4a3b-ae2e-e7342581535f'
      const response = await proxy(new NextRequest(
        `https://www.mystay.city/guide/saint-gervais-les-bains?lodging=${lodgingId}`,
      ))

      expect(response.headers.get('set-cookie')).toContain('Secure')
    } finally {
      process.env.NODE_ENV = previousNodeEnv
    }
  })
})
