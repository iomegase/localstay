import { expect, test } from '@playwright/test'

const citySlug = process.env.SEO_ROUTING_E2E_CITY_SLUG ?? 'saint-gervais-les-bains'
const lodgingId =
  process.env.SEO_MAP_E2E_LODGING_ID ?? '6700c643-053d-43b9-9ee4-22c3d832acd7'

test('AC-07 keeps page zoom available and the guest discovery map interactive', async ({ page }) => {
  const qrResponse = await page.goto(`/guide/${citySlug}?lodging=${lodgingId}`)

  expect(qrResponse?.status()).toBe(200)
  await expect(page).toHaveURL(new RegExp(`/sejour\\?lodging=${lodgingId}$`))

  const response = await page.goto('/map')
  expect(response?.status()).toBe(200)

  const viewport = await page.locator('meta[name="viewport"]').getAttribute('content')
  expect(viewport).not.toContain('maximum-scale=1')
  expect(viewport).not.toContain('user-scalable=no')

  const map = page.getByTestId('guest-map')
  const canvas = map.locator('canvas.mapboxgl-canvas')
  const zoomIn = map.locator('.mapboxgl-ctrl-zoom-in')
  const zoomOut = map.locator('.mapboxgl-ctrl-zoom-out')

  await expect(map).toBeVisible()
  await expect(canvas).toBeVisible({ timeout: 15_000 })
  await expect(zoomIn).toBeVisible()
  await expect(zoomOut).toBeVisible()

  await zoomIn.click()

  await expect(canvas).toBeVisible()
  await expect(zoomIn).toBeEnabled()
  await expect(zoomOut).toBeEnabled()
})
