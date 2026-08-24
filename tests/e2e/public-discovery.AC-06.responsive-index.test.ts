import { expect, test } from '@playwright/test'

test.describe('041 public discovery index responsive page', () => {
  for (const viewport of [
    { name: 'mobile', width: 375, height: 812 },
    { name: 'tablet', width: 768, height: 1024 },
    { name: 'desktop', width: 1440, height: 1000 },
  ] as const) {
    test(`renders the public index without overflow on ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height })
      const response = await page.goto('/decouvrir')

      expect(response?.status()).toBe(200)
      await expect(page.getByTestId('marketing-stage')).toBeVisible()
      const surface = page.getByTestId('marketing-surface')
      await expect(surface).toBeVisible()

      const h1 = page.getByRole('heading', {
        level: 1,
        name: 'Découvrir les bonnes adresses locales.',
        exact: true,
      })
      await expect(page.getByRole('heading', { level: 1 })).toHaveCount(1)
      await expect(h1).toHaveCount(1)
      await expect(h1).toBeVisible()
      await expect(page.getByTestId('bottom-navigation')).toHaveCount(0)

      const dimensions = await page.evaluate(() => ({
        clientWidth: document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
      }))
      const surfaceWidth = await surface.evaluate(
        element => element.getBoundingClientRect().width,
      )

      expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth)
      expect(surfaceWidth).toBe(
        viewport.name === 'desktop'
          ? 1184
          : viewport.name === 'tablet'
            ? viewport.width - 40
            : viewport.width,
      )

      const citySections = page.locator('[data-city-slug]')
      if (await citySections.count() > 0) {
        await expect(citySections.first()).toBeVisible()
      } else {
        await expect(page.getByText('De nouvelles adresses arrivent bientôt.', { exact: true })).toBeVisible()
      }
    })
  }
})
