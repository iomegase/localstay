import { expect, test } from '@playwright/test'

// Spec 068 — parcours réel du panneau (routes interceptées). Lecture seule : aucun
// enregistrement n'est envoyé.
const storageState = process.env.PLAYWRIGHT_ADMIN_STORAGE_STATE
const cityId = process.env.PLAYWRIGHT_CITY_ID
const baseUrl = process.env.PLAYWRIGHT_BASE_URL
const local = Boolean(baseUrl && ['localhost', '127.0.0.1', '[::1]'].includes(new URL(baseUrl).hostname))
test.use({ ...(storageState ? { storageState } : {}) })

test.describe('068 panneau d’édition POI', () => {
  test.skip(!storageState || !cityId || !local, 'Requires a local PLAYWRIGHT_BASE_URL, PLAYWRIGHT_ADMIN_STORAGE_STATE and PLAYWRIGHT_CITY_ID.')

  test('AC-01-01 / AC-01-02 / AC-02-01 : ouvre en panneau, ferme sur la liste filtrée, pleine page en accès direct', async ({ page }) => {
    const listUrl = `/admin/pois?city_id=${cityId}&status=current&discovery_status=ALL`
    await page.goto(listUrl)
    const firstEdit = page.getByRole('link', { name: 'Éditer' }).first()
    const href = await firstEdit.getAttribute('href')
    expect(href).toContain(`city_id=${cityId}`)

    await firstEdit.click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Backoffice POI' })).toBeAttached()

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    expect(new URL(page.url()).search).toBe(new URL(listUrl, 'http://x').search)

    await page.goto(href!)
    await expect(page.getByRole('dialog')).toHaveCount(0)
    await expect(page.getByRole('link', { name: /Retour aux POI/ })).toHaveAttribute('href', expect.stringContaining(`city_id=${cityId}`))
  })
})
