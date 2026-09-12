import { expect, test } from '@playwright/test'

// Requires a dedicated LOCAL app/database with an admin session, an eligible
// City and no pre-existing destination for that City. Never run against production.
// This fixture is opt-in because creating/archiving/deleting landings are real writes.
const storageState = process.env.PLAYWRIGHT_ADMIN_STORAGE_STATE
const fixtureCity = process.env.PLAYWRIGHT_LANDING_CITY
const fixtureBaseUrl = process.env.PLAYWRIGHT_BASE_URL
const localFixture = Boolean(fixtureBaseUrl && ['localhost', '127.0.0.1', '[::1]'].includes(new URL(fixtureBaseUrl).hostname))

test.use({ ...(storageState ? { storageState } : {}) })
test.describe('048 Admin landing lifecycle', () => {
  test.skip(!storageState || !fixtureCity || !localFixture, 'Requires PLAYWRIGHT_ADMIN_STORAGE_STATE, PLAYWRIGHT_LANDING_CITY and a dedicated local PLAYWRIGHT_BASE_URL.')

  test('creates, edits, activates, archives and soft-deletes one City group at mobile and desktop widths', async ({ page }) => {
    const city = fixtureCity!
    let creationAttempted = false

    try {
      await page.setViewportSize({ width: 375, height: 812 })
      await page.goto('/admin/landing-pages')
      await expect(page.getByRole('heading', { name: 'Landing pages', exact: true })).toBeVisible()
      await page.getByRole('button', { name: 'Ajouter une ville', exact: true }).click()
      await page.getByRole('combobox', { name: 'Ville existante' }).click()
      await page.getByRole('option', { name: city, exact: true }).click()
      creationAttempted = true
      await page.getByRole('button', { name: 'Créer les landings', exact: true }).click()
      const mobile = page.getByTestId('landing-mobile-cards')
      await expect(mobile.getByRole('button', { name: `Modifier ${city}`, exact: true })).toBeVisible()
      await mobile.getByRole('switch', { name: `Activer ${city}`, exact: true }).click()
      await expect(page.getByRole('alert')).toContainText('contenus obligatoires')
      await expect(mobile.getByRole('switch', { name: `Activer ${city}`, exact: true })).not.toBeChecked()

      const editor = page.getByRole('form', { name: `Contenus de ${city}` })
      const fields = [
        ['Titre SEO', `Séjour et accompagnement à ${city}`], ['Description SEO', `Découvrez notre accompagnement pour votre séjour à ${city}.`],
        ['Surtitre', city], ['H1', `Organiser votre séjour à ${city}`], ['Titre du bandeau', 'Un projet pensé avec vous'],
        ['Texte du bandeau', 'Nous vous accompagnons dans les étapes de votre projet local.'],
        ['Titre de section', 'Un accompagnement local'], ['Texte de section', 'Un service adapté à votre projet.'],
        ['Titre local', 'Les repères de votre séjour'], ['Texte local', 'Découvrez les services et les repères utiles autour de votre séjour.'],
        ['Libellé du CTA', 'Nous contacter'], ['Lien du CTA', '/contact'],
      ] as const
      for (const intent of ['Conciergerie', 'Séminaires', 'Locations de vacances']) {
        await editor.getByRole('button', { name: intent, exact: true }).click()
        for (const [label, value] of fields) await editor.getByLabel(label, { exact: true }).fill(value)
        if (intent === 'Locations de vacances') {
          await editor.getByLabel('Texte sans logement', { exact: true }).fill('Aucun logement public disponible pour cette ville.')
        } else {
          await editor.getByRole('button', { name: 'Ajouter un point fort', exact: true }).click()
          await editor.getByLabel('Point fort 1 — Titre').fill('Une équipe locale')
          await editor.getByLabel('Point fort 1 — Texte').fill('Un accompagnement adapté à votre demande.')
          await editor.getByRole('button', { name: 'Ajouter une étape', exact: true }).click()
          await editor.getByLabel('Étape 1 — Titre').fill('Parlons de votre projet')
          await editor.getByLabel('Étape 1 — Texte').fill('Contactez notre équipe pour préparer votre projet.')
          await editor.getByRole('button', { name: 'Ajouter une FAQ', exact: true }).click()
          await editor.getByLabel('FAQ 1 — Question').fill('Comment nous contacter ?')
          await editor.getByLabel('FAQ 1 — Réponse').fill('Utilisez le formulaire de contact pour nous écrire.')
        }
      }
      await editor.getByRole('button', { name: 'Enregistrer les trois pages' }).click()
      await expect(page.getByRole('status')).toHaveText('Contenus enregistrés.')
      await mobile.getByRole('switch', { name: `Activer ${city}`, exact: true }).click()
      await expect(page.getByRole('status')).toHaveText('Landings activées.')

      for (const width of [375, 1440]) {
        await page.setViewportSize({ width, height: 900 })
        const surface = width < 768 ? mobile : page.getByRole('table', { name: 'Landings par ville' })
        await expect(surface.getByRole('switch', { name: `Archiver ${city}`, exact: true })).toBeChecked()
        const sizes = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }))
        expect(sizes.scroll).toBeLessThanOrEqual(sizes.client)
      }
      const table = page.getByRole('table', { name: 'Landings par ville' })
      await table.getByRole('switch', { name: `Archiver ${city}`, exact: true }).click()
      await expect(page.getByRole('status')).toHaveText('Landings archivées.')
    } finally {
      if (creationAttempted) {
        await page.setViewportSize({ width: 1440, height: 900 })
        await page.goto('/admin/landing-pages')
        const table = page.getByRole('table', { name: 'Landings par ville' })
        const deleteButton = table.getByRole('button', { name: `Supprimer les landings de ${city}`, exact: true })

        if (await deleteButton.count()) {
          await deleteButton.click()
          await page.getByRole('alertdialog').getByRole('button', { name: 'Supprimer les landings', exact: true }).click()
          await expect(page.getByRole('status')).toHaveText('Landings supprimées.')
          await expect(page.getByRole('button', { name: `Modifier ${city}`, exact: true })).toHaveCount(0)
          await expect(page.getByRole('heading', { name: `Avis de ${city}`, exact: true })).toHaveCount(0)
        }
      }
    }
  })
})
