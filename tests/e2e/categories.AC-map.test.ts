import { expect, test } from '@playwright/test'

const citySlug = 'saint-gervais-les-bains'
const categorySlug = 'rando'
const poiSlug = 'col-de-tricot'
const lodgingId =
  process.env.SEO_MAP_E2E_LODGING_ID ?? '6700c643-053d-43b9-9ee4-22c3d832acd7'

function locationPath(response: { headers(): Record<string, string> }): string | null {
  const location = response.headers().location
  return location ? new URL(location, 'http://staylocal.test').pathname : null
}

test.describe('042 private /guide compatibility', () => {
  test('active stay redirects the historical City landing to /sejour', async ({ request }) => {
    const response = await request.get(`/guide/${citySlug}`, {
      headers: { cookie: `lodging_id=${lodgingId}` },
      maxRedirects: 0,
    })
    expect(response.status()).toBe(307)
    expect(locationPath(response)).toBe('/sejour')
  })

  test('active stay redirects the historical category listing to /sejour', async ({ request }) => {
    const response = await request.get(`/guide/${citySlug}/${categorySlug}`, {
      headers: { cookie: `lodging_id=${lodgingId}` },
      maxRedirects: 0,
    })
    expect(response.status()).toBe(307)
    expect(locationPath(response)).toBe('/sejour')
  })

  test('active stay keeps a compatible historical POI detail private and functional', async ({ request }) => {
    const response = await request.get(`/guide/${citySlug}/${categorySlug}/${poiSlug}`, {
      headers: { cookie: `lodging_id=${lodgingId}` },
      maxRedirects: 0,
    })
    expect(response.status()).toBe(200)
    expect(await response.text()).toContain('noindex')
  })

  test('anonymous historical category permanently redirects to discovery', async ({ request }) => {
    const response = await request.get(`/guide/${citySlug}/${categorySlug}`, {
      maxRedirects: 0,
    })
    expect(response.status()).toBe(308)
    expect(locationPath(response)).toBe(`/decouvrir/${citySlug}/${categorySlug}`)
  })

  test('anonymous historical POI permanently redirects to discovery', async ({ request }) => {
    const response = await request.get(`/guide/${citySlug}/${categorySlug}/${poiSlug}`, {
      maxRedirects: 0,
    })
    expect(response.status()).toBe(308)
    expect(locationPath(response)).toBe(
      `/decouvrir/${citySlug}/${categorySlug}/${poiSlug}`,
    )
  })
})
