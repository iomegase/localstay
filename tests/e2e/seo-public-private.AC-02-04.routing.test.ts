import { expect, test } from '@playwright/test'

const citySlug = process.env.SEO_ROUTING_E2E_CITY_SLUG ?? 'saint-gervais-les-bains'
const lodgingSlug = process.env.SEO_ROUTING_E2E_LODGING_SLUG ?? 'le-chalet-hygge'
const categorySlug = process.env.SEO_ROUTING_E2E_CATEGORY_SLUG ?? 'rando'
const poiSlug = process.env.SEO_ROUTING_E2E_POI_SLUG ?? 'col-de-tricot'
const lodgingId = 'dc682b31-d390-4a3b-ae2e-e7342581535f'
const absentLodgingId = 'a4f87d13-317b-4ce5-8c9f-1bc33581b194'
const forgedLodgingCookie = 'forged-cookie'

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

  test('keeps direct and rewritten access-gate HTML non-indexable', async ({ request }) => {
    const directAccessGate = await request.get('/acces-reserve', {
      maxRedirects: 0,
    })
    expect(directAccessGate.status()).toBe(200)
    expect(await directAccessGate.text()).toContain('noindex')

    const rewrittenAccessGate = await request.get('/sejour', {
      maxRedirects: 0,
    })
    expect(rewrittenAccessGate.status()).toBe(200)
    expect(await rewrittenAccessGate.text()).toContain('noindex')
  })

  test('rejects a syntactically valid but absent stay before private routes render', async ({ request }) => {
    for (const path of [
      '/contact',
      '/mes-favoris',
      `/guide/${citySlug}/agenda`,
      `/guide/${citySlug}/agenda/evenement-inexistant`,
      `/guide/${citySlug}/${categorySlug}/${poiSlug}`,
      `/guide/${citySlug}/${categorySlug}/${poiSlug}/start`,
    ]) {
      const response = await request.get(path, {
        headers: { cookie: `lodging_id=${absentLodgingId}` },
        maxRedirects: 0,
      })

      expect(response.status(), path).toBe(307)
      expect(locationPath(response), path).toBe('/acces-reserve')
    }
  })

  test('does not treat a forged stay cookie as anonymous public discovery', async ({ request }) => {
    for (const path of [
      `/guide/${citySlug}/${categorySlug}`,
      `/guide/${citySlug}/${categorySlug}/${poiSlug}`,
    ]) {
      const response = await request.get(path, {
        headers: { cookie: `lodging_id=${forgedLodgingCookie}` },
        maxRedirects: 0,
      })

      expect(response.status(), path).toBe(307)
      expect(locationPath(response), path).toBe('/acces-reserve')
    }
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
