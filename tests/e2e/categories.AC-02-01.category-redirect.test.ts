import { test, expect } from '@playwright/test'

/**
 * AC-02-01 — Clicking a category on the guide page navigates to /guide/[city]/[category].
 *
 * Requires: dev server running + DB seeded (npm run db:seed).
 * Run: npm run test:e2e
 */

test.describe('Categories — navigation (AC-02-01)', () => {
  test('AC-02-01: clicking a category link navigates to the category page', async ({ page }) => {
    await page.goto('/guide/saint-gervais-les-bains')
    await page.waitForLoadState('networkidle')

    // Pick the first category link on the guide page
    const categoryLink = page.locator('a[href*="/guide/saint-gervais-les-bains/"]').first()
    const href = await categoryLink.getAttribute('href')
    expect(href).toMatch(/\/guide\/saint-gervais-les-bains\/\w/)

    await Promise.all([
      page.waitForURL(`**${href}`),
      categoryLink.click(),
    ])

    expect(page.url()).toContain(href)
    // The category page title should be visible
    await expect(page.locator('h1')).toBeVisible()
  })
})
