import { expect, test } from '@playwright/test'

// Spec 097 AC-13. Le parcours admin écrit en base : il ne tourne qu'en local avec une session admin.
const storageState = process.env.PLAYWRIGHT_ADMIN_STORAGE_STATE
const citySlug = process.env.PLAYWRIGHT_SEMINAR_CITY_SLUG ?? 'saint-gervais-les-bains'
const fixtureBase = process.env.PLAYWRIGHT_BASE_URL
const local = Boolean(fixtureBase && ['localhost', '127.0.0.1', '[::1]'].includes(new URL(fixtureBase).hostname))

test('seminar pages render the activity menu without overflow, prices or providers', async ({ page }) => {
  test.setTimeout(120000)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of ['/seminaires', `/seminaires/${citySlug}`]) {
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBe(200)
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      const menu = page.getByRole('region', { name: 'Le menu d’activités.' })
      if (await menu.count()) {
        await expect(menu).not.toContainText(/€|devis|prestataire/i)
        await expect(menu.getByRole('link')).toHaveCount(0)
        await menu.screenshot({ path: test.info().outputPath(`menu-${path.replace(/\W+/g, '-')}-${width}.png`) })
      }
    }
  }
  expect(errors).toEqual([])
})

test.describe('admin flow', () => {
  test.skip(!storageState || !local, 'Requires PLAYWRIGHT_ADMIN_STORAGE_STATE and a local PLAYWRIGHT_BASE_URL')
  test.use({ storageState })

  test('admin opens the catalogue, sees the simulator at 10 participants and the internal-only notice', async ({ page }) => {
    await page.goto('/admin/seminar-activities')
    await expect(page.getByRole('heading', { name: 'Activités séminaire' })).toBeVisible()
    await page.getByTestId('seminar-activity-row').first().getByRole('button', { name: 'Modifier' }).click()
    const editor = page.getByTestId('seminar-activity-editor')
    await expect(editor.getByTestId('seminar-price-simulator').getByLabel('Participants')).toHaveValue('10')
    await expect(page.getByText('Les prix et les prestataires restent internes')).toBeVisible()
  })
})
