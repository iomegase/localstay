import { test, expect } from '@playwright/test'

/**
 * AC-01-01 — LCP < 3s on /guide/[city-slug] on Fast 4G (spec: Lighthouse Mobile preset).
 * AC-01-02 — Invalid slug shows a 404 page with a back-to-home link.
 *
 * Requires: dev server running + DB seeded with saint-gervais-les-bains.
 * Run: npm run test:e2e
 */

test.describe('City guide — QR code access (AC-01-01, AC-01-02)', () => {
  test('AC-01-01: LCP < 3000ms on /guide/saint-gervais-les-bains at Fast 4G', async ({
    page,
    context,
  }) => {
    // Throttle to Fast 4G: 4 Mbps down, 3 Mbps up, 20ms RTT
    const cdp = await context.newCDPSession(page)
    await cdp.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: (4 * 1024 * 1024) / 8,
      uploadThroughput: (3 * 1024 * 1024) / 8,
      latency: 20,
    })

    // Capture LCP via PerformanceObserver injected before navigation
    await page.addInitScript(() => {
      window.__lcp = 0
      new PerformanceObserver((list) => {
        const entries = list.getEntries()
        const last = entries[entries.length - 1]
        if (last) window.__lcp = last.startTime
      }).observe({ type: 'largest-contentful-paint', buffered: true })
    })

    await page.goto('/guide/saint-gervais-les-bains')
    await page.waitForLoadState('networkidle')

    const lcp = await page.evaluate(() => window.__lcp ?? 0)

    // LCP must be > 0 (something was painted) and < 3000ms
    expect(lcp).toBeGreaterThan(0)
    expect(lcp).toBeLessThan(3000)
  })

  test('AC-01-02: invalid slug shows 404 page with back-to-home link', async ({ page }) => {
    await page.goto('/guide/this-city-does-not-exist-xyz')

    await expect(page.getByText(/ville introuvable/i)).toBeVisible()
    await expect(page.getByRole('link', { name: /retour/i })).toBeVisible()
    await expect(page.getByRole('link', { name: /retour/i })).toHaveAttribute('href', '/')
  })
})
