import { test, expect } from '@playwright/test'

/**
 * AC-01-01 — Scan → /guide/[city-slug] (no redirect chain)
 * AC-01-02 — No intermediate step required (login, splash, etc.)
 *
 * Strategy: verify the public guide URL (which the QR encodes) loads
 * directly without any auth prompt or intermediate page.
 */

const GUIDE_URL = '/guide/saint-gervais-les-bains'

test.describe('QR Code redirect (AC-01-01, AC-01-02)', () => {
  test('AC-01-01: public guide URL loads and shows city name', async ({ page }) => {
    await page.goto(GUIDE_URL)
    await page.waitForLoadState('networkidle')
    await expect(page.getByRole('heading', { name: /saint-gervais/i })).toBeVisible()
    expect(page.url()).toContain('/guide/saint-gervais-les-bains')
  })

  test('AC-01-02: guide page requires no login (no auth form in DOM)', async ({ page }) => {
    await page.goto(GUIDE_URL)
    await page.waitForLoadState('networkidle')
    expect(await page.locator('input[type="password"]').count()).toBe(0)
    expect(await page.locator('form[action*="login"]').count()).toBe(0)
    expect(page.url()).not.toContain('/login')
    expect(page.url()).not.toContain('/auth')
  })
})
