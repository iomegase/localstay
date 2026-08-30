import { test, expect } from '@playwright/test'

const POI_URL = '/guide/saint-gervais-les-bains/rando/col-de-tricot'
const PUBLIC_POI_URL = '/decouvrir/saint-gervais-les-bains/rando/col-de-tricot'

test.describe('042 legacy POI compatibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(POI_URL)
    await page.waitForLoadState('networkidle')
  })

  test('published legacy POI reaches its canonical public page', async ({ page }) => {
    expect(new URL(page.url()).pathname).toBe(PUBLIC_POI_URL)
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
  })

  test('canonical public POI uses the marketing surface without private navigation', async ({ page }) => {
    await expect(page.getByTestId('marketing-surface')).toBeVisible()
    await expect(page.getByTestId('bottom-navigation')).toHaveCount(0)
  })

  test('canonical public POI does not inherit a Lodging query', async ({ page }) => {
    expect(new URL(page.url()).search).toBe('')
  })

  test('legacy POI response is a permanent redirect without a duplicate page', async ({ request }) => {
    const response = await request.get(POI_URL, { maxRedirects: 0 })
    expect(response.status()).toBe(308)
    expect(new URL(response.headers().location, 'http://staylocal.test').pathname).toBe(
      PUBLIC_POI_URL,
    )
  })

  test('legacy unpublished POI returns 404 instead of exposing private data', async ({ request }) => {
    const response = await request.get(
      '/guide/saint-gervais-les-bains/rando/poi-prive-inexistant',
      { maxRedirects: 0 },
    )
    expect(response.status()).toBe(404)
  })
})
