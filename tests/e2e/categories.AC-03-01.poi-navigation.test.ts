import { test, expect } from '@playwright/test'

/**
 * AC-03-01 — Clicking a POI card navigates to /guide/[city]/[category]/[poi-slug].
 *
 * Requires: dev server running + DB seeded.
 * Run: npm run test:e2e
 */

test('042: legacy POI navigation permanently reaches its canonical detail', async ({ request }) => {
  const response = await request.get(
    '/guide/saint-gervais-les-bains/rando/col-de-tricot',
    { maxRedirects: 0 },
  )
  expect(response.status()).toBe(308)
  expect(new URL(response.headers().location, 'http://staylocal.test').pathname).toBe(
    '/decouvrir/saint-gervais-les-bains/rando/col-de-tricot',
  )
})
