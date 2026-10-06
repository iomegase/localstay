import { test, expect } from '@playwright/test'

/**
 * AC-02-01 — Clicking a category on the guide page navigates to /guide/[city]/[category].
 *
 * Requires: dev server running + DB seeded (npm run db:seed).
 * Run: npm run test:e2e
 */

test.describe('042 legacy category compatibility', () => {
  test('legacy category answers 410 Gone without redirect (spec 064)', async ({ request }) => {
    const response = await request.get('/guide/saint-gervais-les-bains/rando', {
      maxRedirects: 0,
    })
    expect(response.status()).toBe(410)
    expect(response.headers().location).toBeUndefined()
  })
})
