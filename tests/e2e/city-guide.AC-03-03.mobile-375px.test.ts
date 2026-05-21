import { test, expect } from '@playwright/test'

/**
 * AC-03-03 — Guide page is readable on 375px width with no horizontal scroll.
 * AC-03-02 — Each category shows icon, name, and poi_count badge.
 *
 * Requires: dev server running + DB seeded with saint-gervais-les-bains.
 * Run: npm run test:e2e
 */

test.describe('City guide — mobile layout (AC-03-03, AC-03-02)', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/guide/saint-gervais-les-bains')
    await page.waitForLoadState('networkidle')
  })

  test('AC-03-03: no horizontal scroll at 375px', async ({ page }) => {
    const hasHorizontalScroll = await page.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth
    )
    expect(hasHorizontalScroll).toBe(false)
  })

  test('AC-03-03: city name is visible at 375px', async ({ page }) => {
    await expect(page.getByText('Saint-Gervais-les-Bains')).toBeVisible()
  })

  test('AC-03-02: at least one category chip is visible with a poi_count badge', async ({
    page,
  }) => {
    // Category chips are links; each has a small badge with the count
    const categoryLinks = page.locator('a[href*="/guide/saint-gervais-les-bains/"]')
    await expect(categoryLinks.first()).toBeVisible()

    // Badge is a span inside the link with a numeric value
    const badge = categoryLinks.first().locator('span').filter({ hasText: /^\d+$|^9\+$/ })
    await expect(badge).toBeVisible()
  })

  test('AC-03-03: header is sticky and visible after scroll', async ({ page }) => {
    await page.evaluate(() => window.scrollTo(0, 500))
    const header = page.locator('header')
    await expect(header).toBeVisible()
    // Verify sticky positioning kept it on screen
    const box = await header.boundingBox()
    expect(box?.y).toBe(0)
  })
})
