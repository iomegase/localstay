import { expect, test } from '@playwright/test'

for (const viewport of [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 1000 },
] as const) {
  test(`public guide demo stays in its smartphone modal on ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto('/')
    const initialUrl = page.url()

    const trigger = page.getByRole('button', {
      name: 'Voir le guide d’exemple',
    })
    await trigger.scrollIntoViewIfNeeded()
    await trigger.click()

    const dialog = page.getByRole('dialog', {
      name: 'Guide MyStay de démonstration',
    })
    await expect(dialog).toBeVisible()
    await expect(page).toHaveURL(initialUrl)
    await expect(dialog.locator('[data-guide-mode="demo"]')).toBeVisible()

    const metrics = await dialog.evaluate(element => {
      const rect = element.getBoundingClientRect()
      const styles = window.getComputedStyle(element)
      return {
        width: rect.width,
        height: rect.height,
        borderWidth: styles.borderTopWidth,
        borderRadius: styles.borderRadius,
        boxShadow: styles.boxShadow,
      }
    })

    expect(metrics.width).toBeLessThanOrEqual(360)
    expect(metrics.height).toBeLessThanOrEqual(720)
    expect(metrics.borderWidth).toBe('5px')
    expect(metrics.borderRadius).toBe('40px')
    expect(metrics.boxShadow).not.toBe('none')

    const carousel = dialog.getByTestId('guide-featured-carousel')
    const featuredCards = dialog.getByTestId('guide-featured-card')
    await expect(carousel).toBeVisible()
    await expect(featuredCards).toHaveCount(3)

    const featuredImages = [
      'Rond de Carotte',
      'Le Relais des Communailles',
      'Maison forte de Hautetour',
    ]
    for (const poiName of featuredImages) {
      const image = dialog.getByRole('img', { name: poiName })
      await expect(image).toBeVisible()
      await expect
        .poll(() =>
          image.evaluate(element => (element as HTMLImageElement).naturalWidth),
        )
        .toBeGreaterThan(0)
    }

    const scrollMetrics = await carousel.evaluate(element => ({
      clientWidth: element.clientWidth,
      scrollWidth: element.scrollWidth,
      scrollbarWidth: getComputedStyle(element).scrollbarWidth,
    }))
    expect(scrollMetrics.scrollWidth).toBeGreaterThan(scrollMetrics.clientWidth)
    expect(scrollMetrics.scrollbarWidth).toBe('none')

    await carousel.evaluate(element => {
      element.scrollLeft = 120
    })
    await expect
      .poll(() => carousel.evaluate(element => element.scrollLeft))
      .toBeGreaterThan(0)

    await dialog.getByRole('button', { name: 'Coups de cœur' }).click()
    const guideMain = dialog.locator('main')
    const header = dialog.locator('header')
    const filters = dialog.getByLabel('Filtrer les catégories')
    const favoritesTitle = dialog.getByRole('heading', {
      name: 'Nos coups de cœur',
    })
    await expect(favoritesTitle).toBeVisible()
    await expect(dialog.getByText('L’Alpage de Porcherey')).toBeVisible()

    await guideMain.evaluate(element => {
      element.scrollTop = 320
    })

    await expect
      .poll(async () => {
        const [headerBox, filtersBox] = await Promise.all([
          header.boundingBox(),
          filters.boundingBox(),
        ])
        if (!headerBox || !filtersBox) return Number.POSITIVE_INFINITY
        return Math.abs(filtersBox.y - (headerBox.y + headerBox.height))
      })
      .toBeLessThanOrEqual(2)

    await expect
      .poll(async () => {
        const [mainBox, titleBox] = await Promise.all([
          guideMain.boundingBox(),
          favoritesTitle.boundingBox(),
        ])
        if (!mainBox || !titleBox) return false
        return titleBox.y + titleBox.height <= mainBox.y
      })
      .toBe(true)

    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toBeFocused()

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
  })
}
