import { expect, test } from '@playwright/test'

const citySlug = process.env.SEO_ROUTING_E2E_CITY_SLUG ?? 'saint-gervais-les-bains'
const lodgingSlug = process.env.SEO_ROUTING_E2E_LODGING_SLUG ?? 'le-chalet-hygge'
const categorySlug = process.env.SEO_ROUTING_E2E_CATEGORY_SLUG ?? 'rando'
const poiSlug = process.env.SEO_ROUTING_E2E_POI_SLUG ?? 'col-de-tricot'
const lodgingId = 'dc682b31-d390-4a3b-ae2e-e7342581535f'

function locationPath(response: { headers(): Record<string, string> }): string | null {
  const location = response.headers().location
  return location ? new URL(location, 'http://staylocal.test').pathname : null
}

test.describe('042 SEO public/private HTTP routing', () => {
  test('permanently redirects historical lodging and discovery URLs', async ({ request }) => {
    const oldLodgingDetail = await request.get(
      `/guide/${citySlug}/logements/${lodgingSlug}`,
      { maxRedirects: 0 },
    )
    expect(oldLodgingDetail.status()).toBe(308)
    expect(locationPath(oldLodgingDetail)).toBe(`/logements/${lodgingSlug}`)

    const oldLodgingList = await request.get(`/guide/${citySlug}/logements`, {
      maxRedirects: 0,
    })
    expect(oldLodgingList.status()).toBe(308)
    expect(locationPath(oldLodgingList)).toBe('/logements')

    const oldPoi = await request.get(
      `/guide/${citySlug}/${categorySlug}/${poiSlug}`,
      { maxRedirects: 0 },
    )
    expect(oldPoi.status()).toBe(308)
    expect(locationPath(oldPoi)).toBe(
      `/decouvrir/${citySlug}/${categorySlug}/${poiSlug}`,
    )
  })

  test('serves the canonical lodging detail', async ({ request }) => {
    const response = await request.get(`/logements/${lodgingSlug}`, {
      maxRedirects: 0,
    })

    expect(response.status()).toBe(200)
  })

  test('keeps private and rewritten access-gate HTML non-indexable', async ({ request }) => {
    const privateResponse = await request.get('/contact', {
      headers: { cookie: `lodging_id=${lodgingId}` },
      maxRedirects: 0,
    })
    expect(privateResponse.status()).toBe(200)
    expect(await privateResponse.text()).toContain('noindex')

    const accessGateResponse = await request.get('/sejour', { maxRedirects: 0 })
    expect(accessGateResponse.status()).toBe(200)
    expect(await accessGateResponse.text()).toContain('noindex')
  })

  test('routes a valid QR to the stay namespace before any public redirect', async ({ request }) => {
    const response = await request.get(
      `/guide/${citySlug}/logements/${lodgingSlug}?lodging=${lodgingId}&token=private`,
      { maxRedirects: 0 },
    )

    expect(response.status()).toBe(307)
    expect(locationPath(response)).toBe('/sejour')
    expect(response.headers().location).toContain(`lodging=${lodgingId}`)
    expect(response.headers().location).not.toContain('token=')
    expect(response.headers().location).not.toContain('/decouvrir')
  })
})
