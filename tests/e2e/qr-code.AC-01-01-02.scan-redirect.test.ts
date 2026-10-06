import { test, expect } from '@playwright/test'

/**
 * AC-01-01 — Scan → /guide/[city-slug] (no redirect chain)
 * AC-01-02 — No intermediate step required (login, splash, etc.)
 *
 * Strategy: verify the public guide URL (which the QR encodes) loads
 * directly without any auth prompt or intermediate page.
 */

const GUIDE_URL = '/guide/saint-gervais-les-bains'
const LODGING_ID = 'dc682b31-d390-4a3b-ae2e-e7342581535f'

test.describe('042 QR compatibility', () => {
  test('historical City QR without Lodging answers 410 Gone (spec 064 BR-02)', async ({ request }) => {
    const response = await request.get(GUIDE_URL, { maxRedirects: 0 })
    expect(response.status()).toBe(410)
    expect(response.headers().location).toBeUndefined()
  })

  test('QR with a valid Lodging activates the stay before the public redirect', async ({ request }) => {
    const response = await request.get(`${GUIDE_URL}?lodging=${LODGING_ID}`, {
      maxRedirects: 0,
    })
    expect(response.status()).toBe(307)
    const location = new URL(response.headers().location, 'http://staylocal.test')
    expect(location.pathname).toBe('/sejour')
    expect(location.searchParams.get('lodging')).toBe(LODGING_ID)
    expect(response.headers()['set-cookie']).toContain(`lodging_id=${LODGING_ID}`)
  })
})
