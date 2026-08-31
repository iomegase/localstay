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

  await expect(map).toHaveAttribute('data-map-ready', 'true')
  await expect(map).toHaveAttribute('data-map-zoom', /^\d+(?:\.\d+)?$/)
  const initialZoom = Number(await map.getAttribute('data-map-zoom'))
  expect(initialZoom).toBeGreaterThan(0)

  await zoomIn.click()

  await expect
    .poll(async () => Number(await map.getAttribute('data-map-zoom')))
    .toBeGreaterThan(initialZoom)
  await expect(canvas).toBeVisible()
  await expect(zoomIn).toBeEnabled()
  await expect(zoomOut).toBeEnabled()
})

test('AC-07 preserves the active sans, serif and decorative families', async ({ page }) => {
  test.setTimeout(60_000)
  await page.goto(`/guide/${citySlug}?lodging=${lodgingId}`, {
    waitUntil: 'domcontentloaded',
  })
  await expect(page).toHaveURL(new RegExp(`/sejour\\?lodging=${lodgingId}$`))

  const lodging = await page.goto('/sejour/logement', {
    waitUntil: 'domcontentloaded',
  })
  expect(lodging?.status()).toBe(200)

  const bodyFont = await page.locator('body').evaluate(
    element => getComputedStyle(element).fontFamily,
  )
  const decorativeFont = await page
    .locator('[class*="font-big-shoulders"]')
    .first()
    .evaluate(element => getComputedStyle(element).fontFamily)

  expect(bodyFont.toLocaleLowerCase()).toContain('jakarta')
  expect(decorativeFont.toLocaleLowerCase()).toContain('big shoulders')

  const contact = await page.goto('/contact', { waitUntil: 'domcontentloaded' })
  expect(contact?.status()).toBe(200)

  const serifFont = await page.getByRole('heading', { level: 1 }).evaluate(
    element => getComputedStyle(element).fontFamily,
  )
  expect(serifFont.toLocaleLowerCase()).toContain('playfair')
})
