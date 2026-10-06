import {
  blocksForIntent,
  fieldIssues,
  isLandingDraftDirty,
  issueCountByIntent,
  LANDING_TABS,
  landingPublicPath,
  seoLength,
  tabFromParam,
} from '@/features/local-seo/lib/landing-editor'
import type { LandingContentIssue, LocalLandingPageInput } from '@/features/local-seo/types/landing-pages'

// Spec 076 — modèle de l'éditeur de landings.
describe('076 AC-02-01 — onglets', () => {
  it('trois pages + avis, onglet lu depuis l’URL (défaut Conciergerie)', () => {
    expect(LANDING_TABS.map(tab => tab.key)).toEqual(['conciergerie', 'seminaires', 'locations', 'avis'])
    expect(tabFromParam('seminaires')).toBe('seminaires')
    expect(tabFromParam('avis')).toBe('avis')
    expect(tabFromParam('inconnu')).toBe('conciergerie')
    expect(tabFromParam(null)).toBe('conciergerie')
  })
})

describe('076 AC-02-02 / BR-03 — blocs', () => {
  const fieldsOf = (intent: LocalLandingPageInput['intent']) => blocksForIntent(intent).flatMap(block => block.fields.map(field => field.field))

  it('blocs dans l’ordre de la page publique', () => {
    expect(blocksForIntent('CONCIERGE').map(block => block.title)).toEqual([
      'Référencement', 'Bandeau', 'Section principale', 'Étapes', 'Ancrage local', 'Appel à l’action', 'FAQ',
    ])
    expect(blocksForIntent('VACATION_RENTAL').map(block => block.title)).toContain('Sans logement')
  })

  it('tous les champs sont éditables une seule fois ; « Texte sans logement » seulement en Locations', () => {
    const all = ['seo_title', 'meta_description', 'eyebrow', 'h1', 'hero_title', 'hero_copy', 'reassurance', 'section_title', 'section_copy', 'process_title', 'local_title', 'local_copy', 'cta_label', 'cta_href']
    expect([...fieldsOf('CONCIERGE')].sort()).toEqual([...all].sort())
    expect([...fieldsOf('VACATION_RENTAL')].sort()).toEqual([...all, 'empty_copy'].sort())
    expect(blocksForIntent('SEMINAR').flatMap(block => block.repeatable ? [block.repeatable] : [])).toEqual(['highlights', 'steps', 'faq'])
  })
})

describe('076 AC-02-03 — compteurs SEO', () => {
  it('signale le dépassement de la longueur recommandée', () => {
    expect(seoLength('Conciergerie à Saint-Gervais', 60)).toEqual({ length: 28, over: false })
    expect(seoLength('x'.repeat(61), 60)).toEqual({ length: 61, over: true })
  })
})

describe('076 AC-02-04 — URL publique', () => {
  it('par intention', () => {
    expect(landingPublicPath('CONCIERGE', 'saint-gervais-les-bains')).toBe('/conciergerie/saint-gervais-les-bains')
    expect(landingPublicPath('SEMINAR', 'combloux')).toBe('/seminaires/combloux')
    expect(landingPublicPath('VACATION_RENTAL', 'megeve')).toBe('/locations-vacances/megeve')
  })
})

describe('076 AC-02-05 — champs à compléter', () => {
  const issues: LandingContentIssue[] = [
    { intent: 'CONCIERGE', field: 'h1', message: 'String must contain at least 3 character(s)' },
    { intent: 'CONCIERGE', field: 'faq.0.answer', message: 'Required' },
    { intent: 'CONCIERGE', field: 'h1', message: 'doublon' },
    { intent: 'SEMINAR', field: 'cta_href', message: 'Invalid' },
  ]

  it('par champ pour une intention', () => {
    expect([...fieldIssues(issues, 'CONCIERGE')]).toEqual(['h1', 'faq.0.answer'])
  })

  it('nombre de champs par onglet', () => {
    expect(issueCountByIntent(issues)).toEqual({ CONCIERGE: 2, SEMINAR: 1, VACATION_RENTAL: 0 })
  })
})

describe('076 AC-02-06 — modifications non enregistrées', () => {
  const page = { intent: 'CONCIERGE', h1: 'A', faq: [] } as unknown as LocalLandingPageInput
  it('compare le brouillon à la version enregistrée', () => {
    expect(isLandingDraftDirty([page], [{ ...page }])).toBe(false)
    expect(isLandingDraftDirty([page], [{ ...page, h1: 'B' }])).toBe(true)
  })
})
