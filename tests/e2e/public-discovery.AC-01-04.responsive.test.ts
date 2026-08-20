import { expect, test } from '@playwright/test'

const citySlug = process.env.PUBLIC_DISCOVERY_E2E_CITY_SLUG
const categorySlug = process.env.PUBLIC_DISCOVERY_E2E_CATEGORY_SLUG
const poiSlug = process.env.PUBLIC_DISCOVERY_E2E_POI_SLUG
const hasPublishedFixture = Boolean(citySlug && categorySlug && poiSlug)

test.describe('041 public discovery responsive pages', () => {
  test.skip(
    !hasPublishedFixture,
    'Requires PUBLIC_DISCOVERY_E2E_CITY_SLUG, CATEGORY_SLUG and POI_SLUG for an eligible published POI.',
  )

  for (const viewport of [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 1000 },
  ] as const) {
    for (const route of [
      `/decouvrir/${citySlug}`,
      `/decouvrir/${citySlug}/${categorySlug}`,
      `/decouvrir/${citySlug}/${categorySlug}/${poiSlug}`,
    ]) {
      test(`${route} uses the marketing surface without overflow on ${viewport.name}`, async ({ page }) => {
        await page.setViewportSize({ width: viewport.width, height: viewport.height })
        const response = await page.goto(route)

        expect(response?.status()).toBe(200)
        await expect(page.getByTestId('marketing-stage')).toBeVisible()
        await expect(page.getByTestId('marketing-surface')).toBeVisible()
        await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
        await expect(page.getByTestId('bottom-navigation')).toHaveCount(0)

        const dimensions = await page.evaluate(() => ({
          clientWidth: document.documentElement.clientWidth,
          scrollWidth: document.documentElement.scrollWidth,
        }))
        const surfaceWidth = await page.getByTestId('marketing-surface').evaluate(
          element => element.getBoundingClientRect().width,
        )

        expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
        expect(surfaceWidth).toBe(
          viewport.name === 'desktop'
            ? 1184
            : viewport.name === 'tablet'
              ? viewport.width - 40
              : viewport.width,
        )
      })
    }
  }
})
