import { test, expect } from '@playwright/test'

/**
 * AC-03-01 — Clicking a POI card navigates to /guide/[city]/[category]/[poi-slug].
 *
 * Requires: dev server running + DB seeded.
 * Run: npm run test:e2e
 */

test('AC-03-01: clicking a POI card navigates to the POI detail URL', async ({ page }) => {
  await page.goto('/guide/saint-gervais-les-bains/restaurants')
  await page.waitForLoadState('networkidle')

  const card = page.getByTestId('poi-card-restaurants-gastro-demo')
  await expect(card).toBeVisible()

  await Promise.all([
    page.waitForURL('**/restaurants/restaurants-gastro-demo'),
    card.click(),
  ])

  expect(page.url()).toContain('/guide/saint-gervais-les-bains/restaurants/restaurants-gastro-demo')
})
