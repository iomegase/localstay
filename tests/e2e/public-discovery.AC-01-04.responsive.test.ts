import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const citySlug = process.env.PUBLIC_DISCOVERY_E2E_CITY_SLUG
const categorySlug = process.env.PUBLIC_DISCOVERY_E2E_CATEGORY_SLUG
const poiSlug = process.env.PUBLIC_DISCOVERY_E2E_POI_SLUG

type PublishedRoutes = {
  city: string
  category: string
  poi: string
}

function pathSegments(path: string): string[] {
  return path.split('/').filter(Boolean)
}

async function firstPublishedPath(page: Page, prefix: string, segmentCount: number): Promise<string> {
  const hrefs = await page.locator(`a[href^="${prefix}"]`).evaluateAll(elements =>
    elements.map(element => (element as HTMLAnchorElement).href),
  )
  const path = hrefs
    .map(href => new URL(href).pathname)
    .find(href => pathSegments(href).length === segmentCount)
  if (!path) throw new Error(`No published discovery link found for ${prefix}`)
  return path
}

async function resolvePublishedRoutes(page: Page): Promise<PublishedRoutes> {
  if (citySlug && categorySlug && poiSlug) {
    return {
      city: `/decouvrir/${citySlug}`,
      category: `/decouvrir/${citySlug}/${categorySlug}`,
      poi: `/decouvrir/${citySlug}/${categorySlug}/${poiSlug}`,
    }
  }

  await page.goto('/decouvrir')
  const city = await firstPublishedPath(page, '/decouvrir/', 2)
  await page.goto(city)
  const category = await firstPublishedPath(page, `${city}/`, 3)
  await page.goto(category)
  const poi = await firstPublishedPath(page, `${category}/`, 4)
  return { city, category, poi }
}

test.describe('041 public discovery responsive pages', () => {
  for (const viewport of [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 1000 },
  ] as const) {
    for (const routeKind of ['city', 'category', 'poi'] as const) {
      test(`${routeKind} uses the marketing surface without overflow on ${viewport.name}`, async ({ page }) => {
        const route = (await resolvePublishedRoutes(page))[routeKind]
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
