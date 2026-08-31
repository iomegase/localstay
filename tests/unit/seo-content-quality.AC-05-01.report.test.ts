import { renderSeoContentAuditReport } from '@/features/seo-content-audit/lib/report'
import type { SeoContentAuditFinding } from '@/features/seo-content-audit/types'

function finding(
  overrides: Partial<SeoContentAuditFinding> = {},
): SeoContentAuditFinding {
  return {
    publicUrl: '/decouvrir/annecy/restaurants/le-serac',
    entityType: 'poi',
    entityId: 'public-poi-id',
    code: 'CONTENT_TOO_THIN',
    evidence: ['POI : Le Sérac', 'Description inférieure à 80 caractères.'],
    updatedAt: '2026-08-20T10:00:00.000Z',
    requiresOwnerDecision: true,
    ...overrides,
  }
}

function render(findings: SeoContentAuditFinding[] = []): string {
  return renderSeoContentAuditReport({
    generatedAt: '2026-08-28T12:00:00.000Z',
    auditedPoiCount: 12,
    auditedLodgingCount: 4,
    findings,
  })
}

describe('043 privacy-safe Markdown report', () => {
  it('renders every required section and the documented editorial proposal', () => {
    const report = render()

    for (const heading of [
      '# Audit qualité SEO / GEO des contenus publics',
      '## Résumé',
      '## Méthode reproductible',
      '## Résultats POI',
      '## Contradictions logements',
      '## Structure éditoriale recommandée',
      '## Décisions Product Owner requises',
    ]) {
      expect(report).toContain(heading)
    }
    for (const role of [
      'description factuelle',
      'conseil MyStay',
      'informations pratiques',
      'source externe éventuelle',
      'date de mise à jour',
    ]) {
      expect(report).toContain(role)
    }
    expect(report).toContain('proposition documentaire')
    expect(report).toContain('aucune migration Prisma')
  })

  it('documents the reproducible method constants', () => {
    const report = render()

    for (const method of ['80 caractères', '120 caractères', 'NFKD', 'trigrammes de mots', '0.85']) {
      expect(report).toContain(method)
    }
    expect(report.toLowerCase()).toContain('indicateur de similarité')
    expect(report.toLowerCase()).not.toContain('preuve de plagiat')
  })

  it('counts every audited entity but details findings only', () => {
    const report = render([
      finding(),
      finding({
        publicUrl: '/logements/chalet-hygge',
        entityType: 'lodging',
        entityId: 'public-profile-id',
        code: 'LODGING_STRUCTURED_TEXT_CONFLICT',
      }),
    ])

    expect(report).toContain('POI publics audités : **12**')
    expect(report).toContain('Logements publics audités : **4**')
    expect(report).toContain('Constats détaillés : **2**')
    expect(report).not.toContain('16 fiches détaillées')
  })

  it('sorts findings by code then public URL', () => {
    const report = render([
      finding({ publicUrl: '/decouvrir/z', code: 'PLACEHOLDER_CONTENT' }),
      finding({ publicUrl: '/decouvrir/b', code: 'CONTENT_TOO_THIN' }),
      finding({ publicUrl: '/decouvrir/a', code: 'CONTENT_TOO_THIN' }),
    ])

    expect(report.indexOf('/decouvrir/a')).toBeLessThan(report.indexOf('/decouvrir/b'))
    expect(report.indexOf('/decouvrir/b')).toBeLessThan(report.indexOf('/decouvrir/z'))
  })

  it('escapes table separators/newlines and truncates evidence excerpts to 180 characters', () => {
    const report = render([
      finding({ evidence: [`ligne | sensible\n${'x'.repeat(240)}`] }),
    ])

    expect(report).toContain('ligne \\| sensible')
    expect(report).not.toContain('\nsensible')
    expect(report).not.toContain('x'.repeat(181))
  })

  it.each([
    'https://example.test/?lodging=550e8400-e29b-41d4-a716-446655440000',
    'stay_lodging_id=550e8400-e29b-41d4-a716-446655440000',
    'token=secret-value',
    'password: secret-value',
    "code d'accès : 1234",
    'lodging_id: 550e8400-e29b-41d4-a716-446655440000',
  ])('rejects private or secret evidence: %s', (privateEvidence) => {
    expect(() => render([finding({ evidence: [privateEvidence] })])).toThrow(
      /donnée privée/i,
    )
  })

  it('allows a public entity identifier required for traceability', () => {
    const report = render([
      finding({ entityId: '550e8400-e29b-41d4-a716-446655440000' }),
    ])

    expect(report).toContain('550e8400-e29b-41d4-a716-446655440000')
  })

  it('lists only owner-decision findings in the final section without choosing a value', () => {
    const decision = finding({ publicUrl: '/decouvrir/decision', requiresOwnerDecision: true })
    const automatic = finding({
      publicUrl: '/decouvrir/sans-decision',
      requiresOwnerDecision: false,
    })
    const report = render([automatic, decision])
    const decisions = report.split('## Décisions Product Owner requises')[1]

    expect(decisions).toContain('/decouvrir/decision')
    expect(decisions).not.toContain('/decouvrir/sans-decision')
    expect(decisions).toContain('Aucune valeur n’est corrigée automatiquement')
  })

  it('renders Aucune for empty finding sections', () => {
    const report = render()

    expect(report.match(/Aucune\./g)).toHaveLength(3)
  })
})
