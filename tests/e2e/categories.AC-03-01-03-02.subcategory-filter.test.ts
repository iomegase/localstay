import { test, expect } from '@playwright/test'

/**
 * AC-03-01 — Selecting a subcategory filter shows only POIs from that subcategory.
 * AC-03-02 — Deselecting filter ("Tous") shows all POIs again.
 *
 * Requires: dev server running + DB seeded with restaurants subcategories.
 * Run: npm run test:e2e
 */

test.describe('042 legacy category query compatibility', () => {
  test('legacy filters are not propagated to the canonical public category', async ({ request }) => {
    const response = await request.get(
      '/guide/saint-gervais-les-bains/rando?sub=facile',
      { maxRedirects: 0 },
    )
    expect(response.status()).toBe(308)
    const location = new URL(response.headers().location, 'http://staylocal.test')
    expect(location.pathname).toBe('/decouvrir/saint-gervais-les-bains/rando')
    expect(location.search).toBe('')
  })

  test('canonical category exposes only canonical /decouvrir POI links', async ({ page }) => {
    await page.goto('/decouvrir/saint-gervais-les-bains/rando')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    const links = page.locator('a[href^="/decouvrir/saint-gervais-les-bains/rando/"]')
    expect(await links.count()).toBeGreaterThan(0)
    await expect(page.locator('a[href^="/guide/"]')).toHaveCount(0)
  })
})
