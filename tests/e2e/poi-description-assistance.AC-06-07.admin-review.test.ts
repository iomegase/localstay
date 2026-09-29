import { expect, test } from '@playwright/test'

// Authenticated local UI; provider requests and PATCH are intercepted, so the
// fixture POI is never changed and this test cannot incur generation costs.
const storageState = process.env.PLAYWRIGHT_ADMIN_STORAGE_STATE
const poiId = process.env.PLAYWRIGHT_POI_ID
const baseUrl = process.env.PLAYWRIGHT_BASE_URL
const local = Boolean(baseUrl && ['localhost', '127.0.0.1', '[::1]'].includes(new URL(baseUrl).hostname))
test.use({ ...(storageState ? { storageState } : {}) })

test.describe('049 description review', () => {
  test.skip(!storageState || !poiId || !local, 'Requires a local PLAYWRIGHT_BASE_URL, PLAYWRIGHT_ADMIN_STORAGE_STATE and existing PLAYWRIGHT_POI_ID.')

  test('AC-06/07: cancel preserves edits; accepting then saving sends reviewed text', async ({ page }) => {
    const patchBodies: Record<string, unknown>[] = []
    await page.route(`**/api/admin/pois/${poiId}/suggest-description`, route => route.fulfill({ json: {
      data: { description: 'Ce chalet accueille les randonneurs. Il propose une restauration familiale.', source_mode: 'web_search', sources: [{ title: 'Office de tourisme', url: 'https://tourisme.example/refuge' }], search_entry_point: null },
    } }))
    await page.route(`**/api/admin/pois/${poiId}`, async route => {
      if (route.request().method() !== 'PATCH') return route.continue()
      patchBodies.push(route.request().postDataJSON() as Record<string, unknown>)
      await route.fulfill({ json: { data: { id: poiId } } })
    })
    await page.goto(`/admin/pois/${poiId}`)
    const description = page.getByRole('textbox', { name: 'Description', exact: true })
    await description.fill('Saisie admin en cours.')
    await page.getByRole('button', { name: 'Proposer une description' }).click()
    await expect(page.getByRole('textbox', { name: 'Proposition à relire' })).toBeVisible()
    await expect(description).toHaveValue('Saisie admin en cours.')
    await page.getByRole('button', { name: 'Annuler', exact: true }).click()
    await expect(description).toHaveValue('Saisie admin en cours.')
    expect(patchBodies).toHaveLength(0)

    await page.getByRole('button', { name: 'Proposer une description' }).click()
    await page.getByRole('textbox', { name: 'Proposition à relire' }).fill('Texte relu et corrigé par un admin.')
    await page.getByRole('button', { name: 'Utiliser cette proposition' }).click()
    await expect(description).toHaveValue('Texte relu et corrigé par un admin.')
    expect(patchBodies).toHaveLength(0)
    await page.getByRole('button', { name: 'Enregistrer la fiche' }).click()
    await expect(page.getByText('Modifications enregistrées avec succès')).toBeVisible()
    expect(patchBodies).toHaveLength(1)
    expect(patchBodies[0].description).toBe('Texte relu et corrigé par un admin.')
    expect(patchBodies[0]).not.toHaveProperty('discovery_status')
  })
})
