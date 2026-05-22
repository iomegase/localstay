import { test, expect } from '@playwright/test'

/**
 * AC-02-01 — Appeler button uses tel: link
 * AC-02-02 — Itinéraire button links to Google Maps
 * AC-02-03 — Site button opens in new tab (target=_blank)
 * AC-02-04 — Partager button triggers navigator.share
 *
 * Requires: dev server running + DB seeded (bistrot has phone + website).
 * Run: npm run test:e2e
 */

const POI_URL = '/guide/saint-gervais-les-bains/restaurants/restaurants-gastro-demo'

test.describe('POI Actions (AC-02-01 to AC-02-04)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(POI_URL)
    await page.waitForLoadState('networkidle')
  })

  test('AC-02-01: Appeler button has correct tel: href', async ({ page }) => {
    const callLink = page.getByTestId('btn-call')
    await expect(callLink).toBeVisible()
    const href = await callLink.getAttribute('href')
    expect(href).toMatch(/^tel:/)
    expect(href).toContain('33450782490')
  })

  test('AC-02-02: Itinéraire button links to Google Maps with coordinates', async ({ page }) => {
    const directionsLink = page.getByTestId('btn-directions')
    await expect(directionsLink).toBeVisible()
    const href = await directionsLink.getAttribute('href')
    expect(href).toContain('google.com/maps/dir')
    expect(href).toContain('destination=45.8921')
  })

  test('AC-02-03: Site button opens in new tab with correct href', async ({ page }) => {
    const siteLink = page.getByTestId('btn-site')
    await expect(siteLink).toBeVisible()
    expect(await siteLink.getAttribute('target')).toBe('_blank')
    expect(await siteLink.getAttribute('href')).toBe('https://bistrot-mont-blanc.fr')
  })

  test('AC-02-04: Partager button is visible and calls navigator.share', async ({ page }) => {
    await page.addInitScript(() => {
      Object.defineProperty(navigator, 'share', {
        value: async () => { (window as any).__shareCalled = true },
        configurable: true,
        writable: true,
      })
    })
    await page.goto(POI_URL)
    await page.waitForLoadState('networkidle')

    const shareBtn = page.getByTestId('btn-share')
    await expect(shareBtn).toBeVisible()
    await shareBtn.click()

    const shareCalled = await page.evaluate(() => !!(window as any).__shareCalled)
    expect(shareCalled).toBe(true)
  })
})
