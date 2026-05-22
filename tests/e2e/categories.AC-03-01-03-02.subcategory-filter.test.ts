import { test, expect } from '@playwright/test'

/**
 * AC-03-01 — Selecting a subcategory filter shows only POIs from that subcategory.
 * AC-03-02 — Deselecting filter ("Tous") shows all POIs again.
 *
 * Requires: dev server running + DB seeded with restaurants subcategories.
 * Run: npm run test:e2e
 */

test.describe('Categories — subcategory filter (AC-03-01, AC-03-02)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/guide/saint-gervais-les-bains/restaurants')
    await page.waitForLoadState('networkidle')
  })

  test('AC-03-01: selecting a subcategory filters the POI list', async ({ page }) => {
    const allPois = page.locator('[data-testid^="poi-card-"]')
    const totalCount = await allPois.count()
    expect(totalCount).toBeGreaterThan(1)

    // Click the Gastronomique subcategory chip and wait for URL + RSC re-render
    await page.getByTestId('subcategory-gastronomique').click()
    await page.waitForURL('**/restaurants?sub=gastronomique')
    await page.waitForLoadState('networkidle')

    const filteredPois = page.locator('[data-testid^="poi-card-"]')
    const filteredCount = await filteredPois.count()

    // Should show fewer results than unfiltered
    expect(filteredCount).toBeLessThan(totalCount)
    expect(filteredCount).toBeGreaterThan(0)

    // "Café de la Vallée" belongs to Snacking, should not appear
    await expect(page.getByText('Café de la Vallée')).not.toBeVisible()
    // "Le Bistrot du Mont-Blanc" belongs to Gastronomique, should appear
    await expect(page.getByText('Le Bistrot du Mont-Blanc')).toBeVisible()
  })

  test('AC-03-02: clicking "Tous" after filtering shows all POIs again', async ({ page }) => {
    // First, apply a filter
    await page.getByTestId('subcategory-gastronomique').click()
    await page.waitForURL('**/restaurants?sub=gastronomique')
    const filteredCount = await page.locator('[data-testid^="poi-card-"]').count()

    // Then deselect by clicking "Tous"
    await page.getByText('Tous').click()
    await page.waitForURL(/\/restaurants$/)
    await page.waitForLoadState('networkidle')
    const allCount = await page.locator('[data-testid^="poi-card-"]').count()

    expect(allCount).toBeGreaterThan(filteredCount)

    // Both POIs should now be visible
    await expect(page.getByText('Le Bistrot du Mont-Blanc')).toBeVisible()
    await expect(page.getByText('Café de la Vallée')).toBeVisible()
  })
})
