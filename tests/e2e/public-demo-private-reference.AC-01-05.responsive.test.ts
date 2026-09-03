import { expect, test, type Page } from '@playwright/test'

const viewports = [
  { name: '320px mobile', width: 320, height: 700 },
  { name: '375px mobile', width: 375, height: 812 },
  { name: 'desktop', width: 1440, height: 1000 },
] as const

const ALLOWED_SAME_ORIGIN_RESOURCE_TYPES = new Set([
  'document',
  'stylesheet',
  'script',
  'image',
  'font',
  'media',
])

const ALLOWED_BOOTSTRAP_FETCH_PATHS = new Set([
  '/',
  '/auth/login',
  '/blog',
  '/concept',
  '/confier-mon-logement',
  '/logements',
  '/seminaires',
])

const FORBIDDEN_PRIVATE_PATH =
  /^\/(?:api(?:\/|$)|sejour(?:\/|$)|le-logement(?:\/|$)|nos-recommandations(?:\/|$)|map(?:\/|$)|mes-favoris(?:\/|$)|guide(?:\/|$))/

const ALLOWED_PUBLIC_MEDIA_ORIGINS = new Set([
  'https://cftqqyqfhlvobtsatxdq.supabase.co',
  'https://lerelaisdescommunailles.com',
  'https://static.apidae-tourisme.com',
  'https://static.wixstatic.com',
  'https://woody.cloudly.space',
  'https://www.3serac.fr',
  'https://www.thermes-saint-gervais.com',
  'https://www.tramwaydumontblanc.fr',
])

const ALLOWED_EXTERNAL_PRESENTATION_REQUESTS = [
  {
    origin: 'https://va.vercel-scripts.com',
    resourceTypes: new Set(['script']),
  },
  {
    origin: 'https://api.mapbox.com',
    resourceTypes: new Set(['fetch', 'image', 'script', 'stylesheet']),
  },
  {
    origin: 'https://events.mapbox.com',
    resourceTypes: new Set(['beacon']),
  },
] as const

function isAllowedPresentationRequest(
  request: Parameters<Page['on']>[1] extends (arg: infer T) => void ? T : never,
  sameOrigin: string,
  bootstrapPhase: boolean,
) {
  const url = new URL(request.url())
  const resourceType = request.resourceType()

  if (url.origin === sameOrigin) {
    if (FORBIDDEN_PRIVATE_PATH.test(url.pathname)) {
      return false
    }

    if (resourceType === 'document') {
      return /^\/concept\/?$/.test(url.pathname)
    }

    if (resourceType === 'fetch') {
      return bootstrapPhase && ALLOWED_BOOTSTRAP_FETCH_PATHS.has(url.pathname)
    }

    return ALLOWED_SAME_ORIGIN_RESOURCE_TYPES.has(resourceType)
  }

  if (
    ALLOWED_PUBLIC_MEDIA_ORIGINS.has(url.origin) &&
    (resourceType === 'image' || resourceType === 'media')
  ) {
    return true
  }

  return ALLOWED_EXTERNAL_PRESENTATION_REQUESTS.some(
    rule =>
      url.origin === rule.origin && rule.resourceTypes.has(resourceType),
  )
}

async function expectDocumentDoesNotOverflow(page: Page) {
  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }))

  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
}

async function expectElementDoesNotOverflowHorizontally(
  locator: ReturnType<Page['locator']>,
) {
  const dimensions = await locator.evaluate(element => ({
    clientWidth: element.clientWidth,
    scrollWidth: element.scrollWidth,
  }))

  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
}

async function expectBoxContainedWithin(
  outer: ReturnType<Page['locator']>,
  inner: ReturnType<Page['locator']>,
) {
  const boxes = await Promise.all([outer.boundingBox(), inner.boundingBox()])
  const [outerBox, innerBox] = boxes
  expect(outerBox).not.toBeNull()
  expect(innerBox).not.toBeNull()
  const tolerance = 1

  expect(innerBox?.x).toBeGreaterThanOrEqual((outerBox?.x ?? 0) - tolerance)
  expect(innerBox?.y).toBeGreaterThanOrEqual((outerBox?.y ?? 0) - tolerance)
  expect((innerBox?.x ?? 0) + (innerBox?.width ?? 0)).toBeLessThanOrEqual(
    (outerBox?.x ?? 0) + (outerBox?.width ?? 0) + tolerance,
  )
  expect((innerBox?.y ?? 0) + (innerBox?.height ?? 0)).toBeLessThanOrEqual(
    (outerBox?.y ?? 0) + (outerBox?.height ?? 0) + tolerance,
  )
}

async function openDemo(page: Page) {
  await page.goto('/concept?preview=demo#guide')
  const initialUrl = page.url()
  const trigger = page.getByRole('button', { name: 'Voir le guide voyageur' })

  await trigger.scrollIntoViewIfNeeded()
  await trigger.click()

  const dialog = page.getByRole('dialog', {
    name: 'Guide MyStay de démonstration',
  })
  await expect(dialog).toBeVisible()
  await expect(dialog.locator('[data-guide-mode="demo"]')).toBeVisible()
  await expect(page).toHaveURL(initialUrl)

  return { dialog, initialUrl, trigger }
}

for (const viewport of viewports) {
  test(`045 AC-01-05 keeps the autonomous demo contained and stable on ${viewport.name}`, async ({
    page,
  }) => {
    const forbiddenRequests: string[] = []
    const sameOrigin = new URL(
      process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:3000',
    ).origin
    let bootstrapPhase = true

    page.on('request', request => {
      if (!isAllowedPresentationRequest(request, sameOrigin, bootstrapPhase)) {
        const url = new URL(request.url())
        forbiddenRequests.push(
          `${request.method()} ${request.resourceType()} ${url.origin}${url.pathname}`,
        )
      }
    })

    await page.setViewportSize({
      width: viewport.width,
      height: viewport.height,
    })

    const { dialog, initialUrl, trigger } = await openDemo(page)
    bootstrapPhase = false

    const modalBox = await dialog.boundingBox()
    expect(modalBox).not.toBeNull()
    expect(modalBox?.width).toBeLessThanOrEqual(360.5)
    expect(modalBox?.height).toBeLessThanOrEqual(720.5)
    expect(modalBox?.x).toBeGreaterThanOrEqual(0)
    expect(modalBox?.y).toBeGreaterThanOrEqual(0)
    expect((modalBox?.x ?? 0) + (modalBox?.width ?? 0)).toBeLessThanOrEqual(
      viewport.width,
    )
    expect((modalBox?.y ?? 0) + (modalBox?.height ?? 0)).toBeLessThanOrEqual(
      viewport.height,
    )
    const guideApp = dialog.getByTestId('autonomous-demo-guide')
    const main = dialog.locator('main')
    await expectDocumentDoesNotOverflow(page)
    await expectElementDoesNotOverflowHorizontally(dialog)
    await expectElementDoesNotOverflowHorizontally(guideApp)
    await expectElementDoesNotOverflowHorizontally(main)
    await expectBoxContainedWithin(dialog, main)

    await dialog.getByRole('button', { name: 'Guide logement' }).click()
    await expect(dialog.getByRole('heading', { name: 'Le 305' })).toBeVisible()
    await expectElementDoesNotOverflowHorizontally(main)
    await dialog.getByRole('button', { name: /^Départ/ }).click()
    const departureRegion = dialog.getByRole('region', { name: /^Départ/ })
    await expect(departureRegion.getByText('Checklist du départ')).toBeVisible()
    const mainOverflow = await main.evaluate(element => ({
      clientHeight: element.clientHeight,
      scrollHeight: element.scrollHeight,
    }))
    expect(mainOverflow.scrollHeight).toBeGreaterThan(mainOverflow.clientHeight)

    const scrolledMain = await main.evaluate(element => {
      element.scrollTop = element.scrollHeight
      return {
        clientHeight: element.clientHeight,
        scrollHeight: element.scrollHeight,
        scrollTop: element.scrollTop,
      }
    })
    expect(scrolledMain.scrollHeight).toBeGreaterThan(scrolledMain.clientHeight)
    expect(scrolledMain.scrollTop).toBeGreaterThan(0)
    await expect(departureRegion.getByText('Tri des déchets')).toBeVisible()
    const trashTarget = departureRegion.getByText(
      'Point de tri public du centre de Saint-Gervais',
    )
    await expect(trashTarget).toBeVisible()
    const [mainBox, trashBox] = await Promise.all([
      main.boundingBox(),
      trashTarget.boundingBox(),
    ])
    expect(mainBox).not.toBeNull()
    expect(trashBox).not.toBeNull()
    expect(trashBox?.y).toBeGreaterThanOrEqual((mainBox?.y ?? 0) - 1)
    expect((trashBox?.y ?? 0) + (trashBox?.height ?? 0)).toBeLessThanOrEqual(
      (mainBox?.y ?? 0) + (mainBox?.height ?? 0) + 1,
    )

    await dialog.getByRole('button', { name: 'Coups de cœur' }).click()
    const header = dialog.locator('header')
    const filterBar = dialog.getByRole('group', {
      name: 'Filtrer les catégories',
    })
    await expect(filterBar).toBeVisible()
    await main.evaluate(element => {
      element.scrollTop = 240
    })
    await expect.poll(async () => {
      const geometry = await Promise.all([
        header.boundingBox(),
        main.boundingBox(),
        filterBar.boundingBox(),
      ])
      const [headerBox, mainBox, filterBox] = geometry
      if (!headerBox || !mainBox || !filterBox) return Number.NaN

      return Math.max(
        Math.abs(filterBox.y - (headerBox.y + headerBox.height)),
        Math.abs(filterBox.y - mainBox.y),
      )
    }).toBeLessThanOrEqual(1)
    await expectBoxContainedWithin(main, filterBar)
    await expectElementDoesNotOverflowHorizontally(main)

    const compactCard = dialog
      .getByText('Bistrotsérac')
      .locator('xpath=ancestor::article[1]')
    await expect(compactCard).toHaveAttribute('data-variant', 'compact')
    await expectBoxContainedWithin(main, compactCard)
    const compactBox = await compactCard.boundingBox()
    expect(compactBox).not.toBeNull()
    expect(Math.abs((compactBox?.width ?? 0) - (compactBox?.height ?? 0))).toBeLessThanOrEqual(
      1,
    )
    for (const controlName of [
      'Ouvrir Bistrotsérac',
      'Afficher Bistrotsérac sur la carte',
    ]) {
      const controlBox = await compactCard
        .getByRole('button', { name: controlName })
        .boundingBox()
      expect(controlBox).not.toBeNull()
      expect(controlBox?.x).toBeGreaterThanOrEqual(compactBox?.x ?? 0)
      expect(controlBox?.y).toBeGreaterThanOrEqual(compactBox?.y ?? 0)
      expect((controlBox?.x ?? 0) + (controlBox?.width ?? 0)).toBeLessThanOrEqual(
        (compactBox?.x ?? 0) + (compactBox?.width ?? 0),
      )
      expect((controlBox?.y ?? 0) + (controlBox?.height ?? 0)).toBeLessThanOrEqual(
        (compactBox?.y ?? 0) + (compactBox?.height ?? 0),
      )
    }
    await expectDocumentDoesNotOverflow(page)
    await expectElementDoesNotOverflowHorizontally(main)

    await dialog.getByRole('button', { name: 'Ouvrir le menu' }).click()
    await expect(
      dialog.getByRole('navigation', { name: 'Menu de démonstration' }),
    ).toBeVisible()
    await dialog.getByRole('button', { name: 'Blog' }).click()
    await expect(dialog.getByRole('heading', { name: 'Blog' })).toBeVisible()
    await expect(page).toHaveURL(initialUrl)

    await dialog.getByRole('button', { name: 'Ouvrir le menu' }).click()
    await dialog.getByRole('button', { name: 'Nous contacter' }).click()
    await expect(
      dialog.getByRole('heading', { name: 'Votre hôte' }),
    ).toBeVisible()
    await expect(page).toHaveURL(initialUrl)

    await dialog.getByRole('button', { name: 'Carte' }).click()
    await expect(
      dialog.getByRole('heading', { name: 'Carte des coups de cœur' }),
    ).toBeVisible()
    await expect(page).toHaveURL(initialUrl)

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()
    expect(forbiddenRequests).toEqual([])
  })
}
