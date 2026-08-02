/** @jest-environment node */

import { NextRequest } from 'next/server'
import { proxy } from '@/proxy'

jest.mock('@/shared/lib/supabase', () => ({
  createSupabaseMiddlewareClient: jest.fn(),
}))

describe('031-public-marketing-site QR landing', () => {
  it('redirects a valid city QR to the private stay home', async () => {
    const lodgingId = 'dc682b31-d390-4a3b-ae2e-e7342581535f'
    const response = await proxy(
      new NextRequest(
        `http://localhost:3000/guide/saint-gervais-les-bains?lodging=${lodgingId}`,
      ),
    )

    expect(response.status).toBe(307)
    expect(response.headers.get('location')).toBe(
      `http://localhost:3000/sejour?lodging=${lodgingId}`,
    )
    expect(response.cookies.get('lodging_id')?.value).toBe(lodgingId)
  })
})
