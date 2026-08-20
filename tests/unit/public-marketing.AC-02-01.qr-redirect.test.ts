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
  })

  it.each([
    '/guide/saint-gervais-les-bains/logements/chalet-hygge',
    '/guide/saint-gervais-les-bains/agenda/fete-du-village',
    '/guide/saint-gervais-les-bains/rando/mont-joux/start',
  ])('keeps the reserved route %s unchanged while refreshing a valid stay cookie', async path => {
    const lodgingId = 'dc682b31-d390-4a3b-ae2e-e7342581535f'
    const response = await proxy(
      new NextRequest(`http://localhost:3000${path}?lodging=${lodgingId}`),
    )

    expect(response.status).toBe(200)
    expect(response.headers.get('location')).toBeNull()
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
})
