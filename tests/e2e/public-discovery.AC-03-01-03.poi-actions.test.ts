import { expect, test } from '@playwright/test'
import type { Page } from '@playwright/test'

const configuredPoiPath = process.env.PUBLIC_DISCOVERY_ACTIONS_E2E_POI_PATH
const configuredPhonePoiPath =
  process.env.PUBLIC_DISCOVERY_PHONE_E2E_POI_PATH ?? configuredPoiPath
const configuredWebsitePoiPath =
  process.env.PUBLIC_DISCOVERY_WEBSITE_E2E_POI_PATH ?? configuredPoiPath

function segmentCount(path: string): number {
  return path.split('/').filter(Boolean).length
}

async function hrefPaths(page: Page, prefix: string, count: number): Promise<string[]> {
  const hrefs = await page.locator(`a[href^="${prefix}"]`).evaluateAll(elements =>
    elements.map(element => new URL((element as HTMLAnchorElement).href).pathname),
  )
  return [...new Set(hrefs.filter(path => segmentCount(path) === count))]
}

async function publishedPoiPaths(page: Page): Promise<string[]> {
  if (configuredPoiPath) return [configuredPoiPath]

  await page.goto('/decouvrir', { waitUntil: 'domcontentloaded' })
  const hubPoiPaths = await hrefPaths(page, '/decouvrir/', 4)
  if (hubPoiPaths.length > 0) return hubPoiPaths

  const cityPaths = await hrefPaths(page, '/decouvrir/', 2)
  const poiPaths = new Set<string>()

  for (const cityPath of cityPaths) {
    await page.goto(cityPath, { waitUntil: 'domcontentloaded' })
    const categoryPaths = await hrefPaths(page, `${cityPath}/`, 3)
    for (const categoryPath of categoryPaths) {
      await page.goto(categoryPath, { waitUntil: 'domcontentloaded' })
      for (const poiPath of await hrefPaths(page, `${categoryPath}/`, 4)) {
        poiPaths.add(poiPath)
      }
    }
  }

  if (poiPaths.size === 0) {
    return []
  }
  return [...poiPaths]
}

async function findPoiWithAction(
  page: Page,
  actionName: 'Appeler' | 'Site officiel',
  configuredPath: string | undefined,
): Promise<string | null> {
  const paths = configuredPath ? [configuredPath] : await publishedPoiPaths(page)
  for (const path of paths) {
    await page.goto(path, { waitUntil: 'domcontentloaded' })
    if (await page.getByRole('link', { name: actionName }).count()) return path
  }
  return null
}

test.describe('041 public discovery POI actions', () => {
  test('Itinéraire opens Google Maps in a new tab', async ({ page }) => {
    const paths = await publishedPoiPaths(page)
    test.skip(
      paths.length === 0,
      'No published POI fixture found; publish one or set PUBLIC_DISCOVERY_ACTIONS_E2E_POI_PATH',
    )
    const [poiPath] = paths
    if (!poiPath) return
    await page.goto(poiPath, { waitUntil: 'domcontentloaded' })

    const directions = page.getByRole('link', { name: 'Itinéraire' })
    await expect(directions).toBeVisible()
    await expect(directions).toHaveAttribute('target', '_blank')
    await expect(directions).toHaveAttribute('href', /google\.com\/maps\/dir/)
    await expect(directions).toHaveAttribute('href', /destination=/)
    await expect(page.getByLabel('Partager')).toHaveCount(0)
  })

  test('Appeler exposes a native telephone link when available', async ({ page }) => {
    const poiPath = await findPoiWithAction(page, 'Appeler', configuredPhonePoiPath)
    test.skip(
      poiPath === null,
      'No published POI with a phone found; publish one or set PUBLIC_DISCOVERY_PHONE_E2E_POI_PATH',
    )
    if (!poiPath) return

    const call = page.getByRole('link', { name: 'Appeler' })
    await expect(call).toBeVisible()
    await expect(call).toHaveAttribute('href', /^tel:\S+/)
  })

  test('Site officiel opens the validated website in a new tab when available', async ({ page }) => {
    const poiPath = await findPoiWithAction(page, 'Site officiel', configuredWebsitePoiPath)
    test.skip(
      poiPath === null,
      'No published POI with a website found; publish one or set PUBLIC_DISCOVERY_WEBSITE_E2E_POI_PATH',
    )
    if (!poiPath) return

    const website = page.getByRole('link', { name: 'Site officiel' })
    await expect(website).toBeVisible()
    await expect(website).toHaveAttribute('target', '_blank')
    await expect(website).toHaveAttribute('href', /^https?:\/\//)
  })
})
