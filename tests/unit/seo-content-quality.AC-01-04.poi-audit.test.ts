import { auditPublicPois } from '@/features/seo-content-audit/lib/poi-audit'
import type { PublicPoiAuditRow } from '@/features/seo-content-audit/queries/audit-data'

function poi(overrides: Partial<PublicPoiAuditRow> = {}): PublicPoiAuditRow {
  return {
    id: 'poi-1',
    name: 'Le Sérac',
    description: 'Une description éditoriale locale suffisamment détaillée pour être utile aux visiteurs.',
    publicUrl: '/decouvrir/annecy/restaurants/le-serac',
    cityName: 'Annecy',
    categoryName: 'Restaurants',
    updatedAt: '2026-08-20T10:00:00.000Z',
    provenance: [],
    ...overrides,
  }
}

describe('043 POI content audit', () => {
  it('adds traceable public context to a description finding', () => {
    const findings = auditPublicPois([poi({ description: 'TODO' })])

    expect(findings).toContainEqual({
      publicUrl: '/decouvrir/annecy/restaurants/le-serac',
      entityType: 'poi',
      entityId: 'poi-1',
      code: 'PLACEHOLDER_CONTENT',
      evidence: expect.arrayContaining([
        'POI : Le Sérac',
        'City : Annecy',
        'Catégorie : Restaurants',
      ]),
      updatedAt: '2026-08-20T10:00:00.000Z',
      requiresOwnerDecision: true,
    })
  })

  it('reports exact duplicate pairs against both sorted public URLs', () => {
    const first = poi({
      id: 'poi-b',
      publicUrl: '/decouvrir/annecy/restaurants/zeta',
      description: 'École de ski, au centre du village.',
    })
    const second = poi({
      id: 'poi-a',
      publicUrl: '/decouvrir/annecy/restaurants/alpha',
      description: 'ecole de ski au centre du village',
    })

    const findings = auditPublicPois([first, second]).filter(
      ({ code }) => code === 'EXACT_INTERNAL_DUPLICATE',
    )

    expect(findings).toHaveLength(2)
    for (const finding of findings) {
      expect(finding.evidence.join(' ')).toContain(second.publicUrl)
      expect(finding.evidence.join(' ')).toContain(first.publicUrl)
    }
    expect(findings.map(({ publicUrl }) => publicUrl)).toEqual([
      second.publicUrl,
      first.publicUrl,
    ])
  })

  it('reports a reproducible rounded similarity indicator without alleging copying', () => {
    const words = Array.from({ length: 30 }, (_, index) => `terme${index}`)
    const left = poi({
      id: 'poi-a',
      publicUrl: '/decouvrir/annecy/culture/alpha',
      description: words.join(' '),
    })
    const right = poi({
      id: 'poi-b',
      publicUrl: '/decouvrir/annecy/culture/beta',
      description: [...words.slice(0, 29), 'variation'].join(' '),
    })

    const findings = auditPublicPois([right, left]).filter(
      ({ code }) => code === 'HIGH_INTERNAL_SIMILARITY',
    )

    expect(findings).toHaveLength(2)
    expect(findings[0].evidence.join(' ')).toContain('0.9310')
    expect(findings[0].evidence.join(' ').toLowerCase()).not.toContain('plagiat')
  })

  it('flags declared external provenance without reproducing the candidate description', () => {
    const secretSourceText = 'Texte tiers complet qui ne doit jamais apparaître dans le rapport.'
    const findings = auditPublicPois([
      poi({
        provenance: [
          {
            source: 'google_places',
            candidateDescriptionPresent: true,
            website: 'https://source.example.com/page',
            runSource: 'google_places',
          },
        ],
      }),
    ])

    const finding = findings.find(
      ({ code }) => code === 'EXTERNAL_SOURCE_REVIEW_REQUIRED',
    )
    expect(finding).toMatchObject({
      entityId: 'poi-1',
      requiresOwnerDecision: true,
    })
    expect(finding?.evidence.join(' ')).toContain('google_places')
    expect(finding?.evidence.join(' ')).toContain('source.example.com')
    expect(finding?.evidence.join(' ')).toContain('texte source présent')
    expect(finding?.evidence.join(' ')).not.toContain(secretSourceText)
  })

  it('deduplicates identical acquisition provenance evidence', () => {
    const provenance = {
      source: 'google_places',
      candidateDescriptionPresent: true,
      website: 'https://source.example.com/page',
      runSource: 'google_places_primary',
    }
    const finding = auditPublicPois([
      poi({ provenance: [provenance, { ...provenance }] }),
    ]).find(({ code }) => code === 'EXTERNAL_SOURCE_REVIEW_REQUIRED')

    expect(
      finding?.evidence.filter(value => value.startsWith('Provenance déclarée')),
    ).toHaveLength(1)
    expect(
      finding?.evidence.filter(value => value.startsWith('Site source déclaré')),
    ).toHaveLength(1)
  })
})
