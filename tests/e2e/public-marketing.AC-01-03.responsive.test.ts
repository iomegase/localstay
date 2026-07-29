import { expect, test } from '@playwright/test'

for (const viewport of [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 1000 },
] as const) {
  test(`marketing home has no horizontal overflow on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto('/')

    await expect(page.getByRole('heading', { level: 1, name: /Votre logement, géré avec soin/i })).toBeVisible()

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    const surface = page.getByTestId('marketing-surface')
    const stage = page.getByTestId('marketing-stage')
    const hero = page.getByTestId('editorial-hero')
    const heroContent = page.getByTestId('editorial-hero-content')
    const surfaceStyles = await surface.evaluate(element => {
      const styles = window.getComputedStyle(element)

      return {
        borderRadius: styles.borderRadius,
        boxShadow: styles.boxShadow,
        width: element.getBoundingClientRect().width,
      }
    })
    const heroStyles = await hero.evaluate(element => {
      const styles = window.getComputedStyle(element)

      return {
        borderRadius: styles.borderRadius,
        minHeight: styles.minHeight,
        width: element.getBoundingClientRect().width,
      }
    })
    const heroContentStyles = await heroContent.evaluate(element => {
      const styles = window.getComputedStyle(element)

      return {
        minHeight: styles.minHeight,
        padding: [
          styles.paddingTop,
          styles.paddingRight,
          styles.paddingBottom,
          styles.paddingLeft,
        ],
      }
    })
    const stageBackground = await stage.evaluate(
      element => window.getComputedStyle(element).backgroundColor,
    )

    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)

    if (viewport.width < 768) {
      expect(surfaceStyles.borderRadius).toBe('0px')
      expect(surfaceStyles.boxShadow).toBe('none')
      expect(surfaceStyles.width).toBe(viewport.width)
      expect(stageBackground).toBe('rgb(255, 255, 255)')
    } else {
      expect(surfaceStyles.borderRadius).toBe(
        viewport.name === 'desktop' ? '34px' : '42px',
      )
      expect(surfaceStyles.boxShadow).not.toBe('none')
      expect(surfaceStyles.width).toBe(
        viewport.name === 'desktop' ? 1184 : viewport.width - 40,
      )
      expect(stageBackground).toBe('rgb(244, 244, 243)')

      if (viewport.name === 'desktop') {
        expect(heroStyles).toEqual({
          borderRadius: '26px',
          minHeight: '560px',
          width: 944,
        })
        expect(heroContentStyles).toEqual({
          minHeight: '560px',
          padding: ['60px', '52px', '43px', '52px'],
        })
      }
    }
  })
}

for (const viewport of [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 1000 },
] as const) {
  test(`seminar and blog detail follow the mockup without overflow on ${viewport.name}`, async ({
    page,
  }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto('/seminaires')

    const seminarHero = page.getByTestId('seminar-hero')
    await expect(seminarHero).toBeVisible()
    const seminarMetrics = await seminarHero.evaluate(element => {
      const styles = window.getComputedStyle(element)
      return {
        minHeight: styles.minHeight,
        padding: [
          styles.paddingTop,
          styles.paddingRight,
          styles.paddingBottom,
          styles.paddingLeft,
        ],
      }
    })
    let dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))

    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
    expect(seminarMetrics).toEqual(
      viewport.name === 'mobile'
        ? {
            minHeight: '690px',
            padding: ['48px', '28px', '32px', '28px'],
          }
        : {
            minHeight: '590px',
            padding: ['58px', '54px', '42px', '54px'],
          },
    )

    await page.goto('/blog/article-3aa3a774')
    await expect(page.getByTestId('blog-article-intro')).toBeVisible()
    const blogCover = page.getByTestId('blog-article-cover')
    await expect(blogCover).toBeVisible()
    const blogMinHeight = await blogCover.evaluate(
      element => window.getComputedStyle(element).minHeight,
    )
    dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))

    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
    expect(blogMinHeight).toBe(
      viewport.name === 'mobile' ? '430px' : viewport.name === 'tablet' ? '540px' : '620px',
    )
  })
}

for (const viewport of [
  { name: 'mobile', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1440, height: 1000 },
] as const) {
  test(`public lodging detail matches the marketing home width on ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize({ width: viewport.width, height: viewport.height })
    await page.goto(
      '/guide/saint-gervais-les-bains/logements/le-chalet-hygge',
    )

    const surface = page.getByTestId('marketing-surface')
    await expect(surface).toBeVisible()
    await expect(page.getByTestId('lodging-detail-heading')).toBeVisible()
    await expect(page.getByTestId('lodging-marketing-gallery')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Les essentiels, en un coup d’œil.' })).toBeVisible()

    const dimensions = await page.evaluate(() => ({
      clientWidth: document.documentElement.clientWidth,
      scrollWidth: document.documentElement.scrollWidth,
    }))
    const surfaceWidth = await surface.evaluate(
      element => element.getBoundingClientRect().width,
    )
    const galleryWidth = await page.getByTestId('lodging-marketing-gallery').evaluate(
      element => element.getBoundingClientRect().width,
    )
    const essentialsHeight = await page.getByTestId('lodging-essentials').evaluate(
      element => element.getBoundingClientRect().height,
    )

    expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
    expect(surfaceWidth).toBe(
      viewport.name === 'desktop'
        ? 1184
        : viewport.name === 'tablet'
          ? viewport.width - 40
          : viewport.width,
    )
    expect(galleryWidth).toBe(
      viewport.name === 'desktop'
        ? 944
        : viewport.name === 'tablet'
          ? viewport.width - 40
          : viewport.width,
    )
    expect(essentialsHeight).toBeLessThanOrEqual(
      viewport.name === 'desktop' ? 240 : viewport.name === 'tablet' ? 300 : 360,
    )
  })
}
