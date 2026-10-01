import { expect, test } from '@playwright/test'

const storageState = process.env.PLAYWRIGHT_ADMIN_STORAGE_STATE
const lodgingId = process.env.PLAYWRIGHT_SEMINAR_LODGING_ID
const citySlug = process.env.PLAYWRIGHT_SEMINAR_CITY_SLUG ?? 'saint-gervais-les-bains'
const lodgingSlug = process.env.PLAYWRIGHT_SEMINAR_LODGING_SLUG
const fixtureBase = process.env.PLAYWRIGHT_BASE_URL
const local = Boolean(fixtureBase && ['localhost', '127.0.0.1', '[::1]'].includes(new URL(fixtureBase).hostname))

test('seminar hub and city render without errors or horizontal overflow', async ({ page }) => {
  test.setTimeout(120000)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  for (const width of [375, 1280]) {
    await page.setViewportSize({ width, height: 900 })
    for (const path of ['/seminaires', `/seminaires/${citySlug}`]) {
      const response = await page.goto(path, { waitUntil: 'domcontentloaded' })
      expect(response?.status()).toBe(200)
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
      const refuseAnalytics = page.getByRole('button', { name: 'Refuser', exact: true })
      if (await refuseAnalytics.isVisible()) await refuseAnalytics.click()
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true)
      const selection = page.getByRole('region', { name: 'Le cadre idéal pour votre séminaire.' })
      if (path === '/seminaires' && await selection.count()) {
        await selection.screenshot({ path: test.info().outputPath(`selection-${width}.png`) })
      }
    }
  }
  expect(errors).toEqual([])
})

test.describe('Admin selection lifecycle with an authenticated fixture', () => {
  test.use({ ...(storageState ? { storageState } : {}) })
  test.skip(!storageState || !lodgingId || !lodgingSlug || !local, 'Requires an authenticated local fixture: PLAYWRIGHT_ADMIN_STORAGE_STATE, PLAYWRIGHT_SEMINAR_LODGING_ID and PLAYWRIGHT_SEMINAR_LODGING_SLUG.')

  test('selects a published lodging, shows it on both surfaces and removes it', async ({ page, request }) => {
    await page.goto('/admin/lodgings')
    const row = page.getByRole('row').filter({ has: page.locator(`a[href="/admin/lodgings/${lodgingId}/edit"]`) })
    // Dedicated fixture must start unselected; never change an existing selection.
    await expect(row.getByRole('button', { name: 'Ajouter à la page Séminaires' })).toBeVisible()
    try {
      await row.getByRole('button', { name: 'Ajouter à la page Séminaires' }).click()
      await expect(row.getByText('Sélectionné pour les séminaires')).toBeVisible()
      for (const path of ['/seminaires', `/seminaires/${citySlug}`]) {
        await page.goto(path)
        const section = page.getByRole('region', { name: 'Le cadre idéal pour votre séminaire.' })
        const link = section.locator(`a[href="/logements/${lodgingSlug}"]`)
        await expect(link).toBeVisible()
        await link.click()
        await expect(page).toHaveURL(new RegExp(`/logements/${lodgingSlug}$`))
      }
      await page.goto('/admin/lodgings')
      await row.getByRole('button', { name: 'Retirer de la page Séminaires' }).click()
      await expect(row.getByRole('button', { name: 'Ajouter à la page Séminaires' })).toBeVisible()
      for (const path of ['/seminaires', `/seminaires/${citySlug}`]) {
        await page.goto(path)
        await expect(page.getByRole('region', { name: 'Le cadre idéal pour votre séminaire.' }).locator(`a[href="/logements/${lodgingSlug}"]`)).toHaveCount(0)
      }
    } finally {
      const result = await request.patch(`/api/admin/lodgings/${lodgingId}/seminar-selection`, { data: { seminar_selected: false } })
      expect(result.ok()).toBe(true)
    }
  })
})
