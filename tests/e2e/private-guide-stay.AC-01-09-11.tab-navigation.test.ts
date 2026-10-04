import { expect, test } from '@playwright/test'

const lodgingId = process.env.SEO_MAP_E2E_LODGING_ID ?? '6700c643-053d-43b9-9ee4-22c3d832acd7'

test('054 AC-01-09–11: private tabs stay local, preserve the latest selection and browser history', async ({ page, context, baseURL }) => {
  test.setTimeout(60_000)
  await context.addCookies([{ name: 'lodging_id', value: lodgingId, url: baseURL ?? 'http://localhost:3000' }])
  await page.goto('/sejour', { waitUntil: 'domcontentloaded' })
  const nav = page.getByRole('navigation', { name: 'Navigation du guide' })
  await expect(nav).toBeVisible()
  // Le contrôle PWA passe à ok après hydration du guide.
  await expect(page.locator('[data-pwa-gate="ok"]')).toBeVisible()
  await page.getByRole('region', { name: 'Consentement analytics' }).getByRole('button', { name: 'Refuser' }).click()
  await nav.getByRole('button', { name: 'Réglages et infos' }).click()
  await expect(page.getByRole('heading', { name: 'Réglages et infos' })).toBeVisible()
  await nav.getByRole('button', { name: 'Accueil', exact: true }).click()

  const documentStart = await page.evaluate(() => performance.timeOrigin)
  const serverTransitions: string[] = []
  page.on('request', request => {
    if (new URL(request.url()).pathname.startsWith('/sejour') &&
      (request.isNavigationRequest() || request.headers().rsc === '1')) {
      serverTransitions.push(request.url())
    }
  })
  await nav.getByRole('button', { name: 'Coups de cœur' }).click()
  await expect(page.getByRole('button', { name: 'Tous', exact: true })).toBeVisible()
  await expect(page).toHaveURL(/\/sejour\/coups-de-coeur$/)

  for (let i = 0; i < 3; i += 1) {
    await nav.getByRole('button', { name: 'Carte', exact: true }).click()
    await nav.getByRole('button', { name: 'Réglages et infos' }).click()
    await expect(page.getByRole('heading', { name: 'Réglages et infos' })).toBeVisible()
    await nav.getByRole('button', { name: 'Accueil', exact: true }).click()
    await nav.getByRole('button', { name: 'Coups de cœur' }).click()
  }
  await nav.getByRole('button', { name: 'Réglages et infos' }).click()
  await expect(page).toHaveURL(/#reglages$/)
  await page.goBack()
  await expect(page.getByRole('button', { name: 'Tous', exact: true })).toBeVisible()
  await page.goForward()
  await expect(page.getByRole('heading', { name: 'Réglages et infos' })).toBeVisible()
  expect(await page.evaluate(() => performance.timeOrigin)).toBe(documentStart)
  expect(serverTransitions).toEqual([])
})
