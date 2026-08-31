import { test, expect } from '@playwright/test'

/**
 * AC-03-03 — Guide page is readable on 375px width with no horizontal scroll.
 * AC-03-02 — Each category shows icon, name, and poi_count badge.
 *
 * Requires: dev server running + DB seeded with saint-gervais-les-bains.
 * Run: npm run test:e2e
 */

test.describe('042 historical City redirect on mobile', () => {
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
    await expect(
      page.getByRole('heading', { level: 1, name: 'Découvrir Saint-Gervais-les-Bains' }),
    ).toBeVisible()
    expect(new URL(page.url()).pathname).toBe('/decouvrir/saint-gervais-les-bains')
  })

  test('AC-03-02: at least one category chip is visible with a poi_count badge', async ({
    page,
  }) => {
    const categoryLinks = page.locator(
      'a[href^="/decouvrir/saint-gervais-les-bains/"]',
    )
    await expect(categoryLinks.first()).toBeVisible()

    await expect(categoryLinks.first()).toContainText(/\d+ adresses?/)
  })

  test('the redirected public City uses the marketing shell without private navigation', async ({ page }) => {
    await expect(page.getByTestId('marketing-surface')).toBeVisible()
    await expect(page.getByTestId('bottom-navigation')).toHaveCount(0)
  })
})
