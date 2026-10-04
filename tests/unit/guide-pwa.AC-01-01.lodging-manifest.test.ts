import { buildLodgingManifest, guideManifestHref, pwaStartUrl } from '@/features/guide-pwa/lib/manifest'
import manifest from '@/app/manifest'

const LODGING_ID = '11111111-1111-4111-8111-111111111111'

describe('guide-pwa AC-01-01 — manifest propre au logement', () => {
  it('ouvre le séjour du logement et garde l’identité visuelle du manifest racine', () => {
    const root = manifest()
    const result = buildLodgingManifest({ lodgingId: LODGING_ID, lodgingName: 'Chalet des Aravis' })

    expect(result.id).toBe(`/sejour?lodging=${LODGING_ID}&source=pwa`)
    expect(result.start_url).toBe(`/sejour?lodging=${LODGING_ID}&source=pwa`)
    expect(result.scope).toBe('/')
    expect(result.display).toBe('standalone')
    expect(result.name).toBe('MyStay — Chalet des Aravis')
    expect(result.short_name).toBe('MyStay')
    expect(result.icons).toEqual(root.icons)
    expect(result.background_color).toBe(root.background_color)
    expect(result.theme_color).toBe(root.theme_color)
    expect(result.orientation).toBe(root.orientation)
  })

  it('expose les URLs du manifest et de démarrage', () => {
    expect(pwaStartUrl(LODGING_ID)).toBe(`/sejour?lodging=${LODGING_ID}&source=pwa`)
    expect(guideManifestHref(LODGING_ID)).toBe(`/api/guide/manifest?lodging=${LODGING_ID}`)
  })
})
