import { sanitizeDescriptionSources } from '@/shared/lib/description-sources'

describe('spec 094 BR-01 / BR-02 — nettoyage des sources', () => {
  it('garde http(s), dédoublonne, titre par défaut = domaine', () => {
    expect(sanitizeDescriptionSources([
      { url: 'https://www.combloux.com/culture', title: 'Office de tourisme de Combloux' },
      { url: 'https://www.combloux.com/culture', title: 'Doublon' },
      { url: 'http://musee.example.fr/', title: '' },
      { url: 'javascript:alert(1)', title: 'x' },
      { url: 'pas une url', title: 'x' },
      null,
    ])).toEqual([
      { url: 'https://www.combloux.com/culture', title: 'Office de tourisme de Combloux' },
      { url: 'http://musee.example.fr/', title: 'musee.example.fr' },
    ])
  })

  it('BR-02 : redirection Google temporaire → lien durable vers le domaine', () => {
    expect(sanitizeDescriptionSources([
      { url: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/AbC123', title: 'visorando.com' },
      { url: 'https://vertexaisearch.cloud.google.com/grounding-api-redirect/Zz', title: 'Un titre sans domaine' },
    ])).toEqual([{ url: 'https://visorando.com', title: 'visorando.com' }])
  })

  it('au plus 8 sources ; entrée invalide → liste vide', () => {
    const many = Array.from({ length: 12 }, (_, index) => ({ url: `https://site${index}.fr/`, title: `Site ${index}` }))
    expect(sanitizeDescriptionSources(many)).toHaveLength(8)
    expect(sanitizeDescriptionSources(null)).toEqual([])
    expect(sanitizeDescriptionSources({ url: 'https://a.fr' })).toEqual([])
  })
})
