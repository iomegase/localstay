import {
  auditTextQuality,
  compareAuditDescriptions,
  normalizeAuditText,
  wordTrigramJaccard,
} from '@/features/seo-content-audit/lib/text-audit'

describe('043 SEO content quality text audit', () => {
  it('normalizes Unicode, case, punctuation and repeated whitespace deterministically', () => {
    expect(normalizeAuditText('  École,  de  Ski ! ')).toBe('ecole de ski')
  })

  it.each([
    ['', 'CONTENT_TOO_THIN'],
    ['   ', 'CONTENT_TOO_THIN'],
    ['a'.repeat(79), 'CONTENT_TOO_THIN'],
    ['Lorem ipsum dolor sit amet', 'PLACEHOLDER_CONTENT'],
    ['TODO', 'PLACEHOLDER_CONTENT'],
    ['TBD', 'PLACEHOLDER_CONTENT'],
    ['placeholder', 'PLACEHOLDER_CONTENT'],
    ['description des principes', 'PLACEHOLDER_CONTENT'],
    ['...', 'PLACEHOLDER_CONTENT'],
    ['……', 'PLACEHOLDER_CONTENT'],
  ])('flags editorial text %j as %s', (description, expectedCode) => {
    expect(auditTextQuality(description).map((finding) => finding.code)).toContain(
      expectedCode,
    )
  })

  it('does not flag an 80-character description as thin', () => {
    expect(auditTextQuality('a'.repeat(80))).not.toContainEqual(
      expect.objectContaining({ code: 'CONTENT_TOO_THIN' }),
    )
  })

  it('does not treat normal editorial prose about a form as a placeholder marker', () => {
    const prose =
      'Le formulaire de contact permet de préparer votre venue et de préciser vos besoins simplement.'

    expect(auditTextQuality(prose)).toEqual([])
  })

  it('reports normalized equality only as an exact duplicate', () => {
    const comparison = compareAuditDescriptions(
      'École de ski, au centre du village.',
      'ecole de ski au centre du village',
    )

    expect(comparison).toEqual({
      code: 'EXACT_INTERNAL_DUPLICATE',
      score: 1,
      evidence: expect.stringContaining('normalisation'),
    })
  })

  it('computes a reproducible Jaccard score from word trigrams', () => {
    expect(wordTrigramJaccard('un deux trois quatre', 'un deux trois cinq')).toBeCloseTo(
      1 / 3,
      10,
    )
    expect(wordTrigramJaccard('deux mots', 'deux mots')).toBe(0)
  })

  it('reports high similarity for non-identical normalized descriptions of at least 120 characters', () => {
    const shared = Array.from(
      { length: 30 },
      (_, index) => `mot${String(index).padStart(2, '0')}`,
    )
    const left = shared.join(' ')
    const right = [...shared.slice(0, 29), 'variation'].join(' ')

    const comparison = compareAuditDescriptions(left, right)

    expect(left.length).toBeGreaterThanOrEqual(120)
    expect(right.length).toBeGreaterThanOrEqual(120)
    expect(comparison).toMatchObject({
      code: 'HIGH_INTERNAL_SIMILARITY',
      score: expect.any(Number),
    })
    expect(comparison?.score).toBeGreaterThanOrEqual(0.85)
    expect(comparison?.evidence).toContain('indicateur de similarité')
    expect(comparison?.evidence.toLowerCase()).not.toContain('plagiat')
  })

  it('does not compare descriptions shorter than 120 normalized characters', () => {
    expect(
      compareAuditDescriptions(
        'Une courte description presque identique.',
        'Une courte description presque identique ici.',
      ),
    ).toBeNull()
  })
})
