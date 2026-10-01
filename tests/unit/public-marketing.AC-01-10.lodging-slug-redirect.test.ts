import nextConfig from '../../next.config.mjs'

describe('031 AC-01-10 (8) — renamed lodging slug', () => {
  it('permanently redirects the former URL to /logements/les-hauts-de-saint-gervais', async () => {
    const redirects = await nextConfig.redirects!()

    expect(redirects).toContainEqual({
      source: '/logements/t2-cosy-le-mont-joly-saint-gervais-les-bains',
      destination: '/logements/les-hauts-de-saint-gervais',
      permanent: true,
    })
  })
})
