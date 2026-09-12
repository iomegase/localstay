import {
  LandingDestinationInputSchema,
  LandingPageIdSchema,
  LandingPagesUpdateSchema,
  LandingPublicationInputSchema,
  landingPageInputSchema,
} from '@/features/local-seo/schemas/landing-pages'

const page = (intent: 'CONCIERGE' | 'SEMINAR' | 'VACATION_RENTAL') => ({
  intent,
  seo_title: 'Une page locale à Megève',
  meta_description: 'Un accompagnement local pour préparer votre séjour à Megève.',
  eyebrow: 'Megève',
  h1: 'Préparer votre séjour à Megève',
  hero_title: 'Un séjour pensé avec vous',
  hero_copy: 'Partagez votre projet et recevez des informations locales utiles.',
  reassurance: null,
  section_title: 'Un accompagnement de proximité',
  section_copy: 'Nous vous aidons à organiser les détails importants de votre séjour.',
  process_title: null,
  local_title: 'Les repères locaux',
  local_copy: 'Découvrez les quartiers, activités et services qui correspondent à votre projet.',
  cta_label: 'Échanger avec nous',
  cta_href: '/contact',
  empty_copy: intent === 'VACATION_RENTAL' ? 'Aucun logement public n’est encore disponible.' : null,
  highlights: intent === 'VACATION_RENTAL' ? [] : [{ title: 'Sur mesure', copy: 'Un accompagnement adapté à votre besoin.' }],
  steps: intent === 'VACATION_RENTAL' ? [] : [{ title: 'Échange', copy: 'Nous commençons par comprendre votre projet.' }],
  faq: intent === 'VACATION_RENTAL' ? [] : [{ question: 'Comment démarrer ?', answer: 'Écrivez-nous depuis cette page.' }],
})

describe('local landing validation', () => {
  it('accepts a City id and publication boolean, and rejects empty ids', () => {
    expect(LandingDestinationInputSchema.safeParse({ city_id: 'city-1' }).success).toBe(true)
    expect(LandingDestinationInputSchema.safeParse({ city_id: '' }).success).toBe(false)
    expect(LandingPublicationInputSchema.safeParse({ is_active: true }).success).toBe(true)
    expect(LandingPublicationInputSchema.safeParse({ is_active: 'true' }).success).toBe(false)
  })

  it('validates UUID route ids', () => {
    expect(LandingPageIdSchema.safeParse({ id: '8c6f2e23-29a0-4e8e-8d3e-7c4e68b5f4ef' }).success).toBe(true)
    expect(LandingPageIdSchema.safeParse({ id: 'not-a-uuid' }).success).toBe(false)
  })

  it('requires content and repeatable blocks for service pages', () => {
    expect(landingPageInputSchema.safeParse({ intent: 'CONCIERGE' }).success).toBe(false)
    expect(landingPageInputSchema.safeParse(page('CONCIERGE')).success).toBe(true)
  })

  it('rejects empty service repeatable blocks', () => {
    expect(landingPageInputSchema.safeParse({ ...page('CONCIERGE'), highlights: [] }).success).toBe(false)
    expect(landingPageInputSchema.safeParse({ ...page('SEMINAR'), steps: [] }).success).toBe(false)
    expect(landingPageInputSchema.safeParse({ ...page('CONCIERGE'), faq: [] }).success).toBe(false)
  })

  it('rejects malformed typed repeatable blocks', () => {
    expect(landingPageInputSchema.safeParse({
      ...page('SEMINAR'),
      highlights: [{ title: 'Brief', copy: '' }],
    }).success).toBe(false)
  })

  it('allows an empty vacation-rental page only with empty_copy', () => {
    expect(landingPageInputSchema.safeParse(page('VACATION_RENTAL')).success).toBe(true)
    expect(landingPageInputSchema.safeParse({ ...page('VACATION_RENTAL'), empty_copy: null }).success).toBe(false)
  })

  it('accepts only internal paths or mailto CTAs', () => {
    expect(landingPageInputSchema.safeParse({ ...page('CONCIERGE'), cta_href: '/conciergerie/megeve' }).success).toBe(true)
    expect(landingPageInputSchema.safeParse({ ...page('CONCIERGE'), cta_href: 'mailto:contact@mystay.city' }).success).toBe(true)
    expect(landingPageInputSchema.safeParse({ ...page('CONCIERGE'), cta_href: 'https://evil.example/phishing' }).success).toBe(false)
    expect(landingPageInputSchema.safeParse({ ...page('CONCIERGE'), cta_href: 'javascript:alert(1)' }).success).toBe(false)
  })

  it('requires exactly one page for each landing intent', () => {
    expect(LandingPagesUpdateSchema.safeParse({ pages: [page('CONCIERGE'), page('SEMINAR'), page('VACATION_RENTAL')] }).success).toBe(true)
    expect(LandingPagesUpdateSchema.safeParse({ pages: [page('CONCIERGE'), page('CONCIERGE'), page('VACATION_RENTAL')] }).success).toBe(false)
    expect(LandingPagesUpdateSchema.safeParse({ pages: [page('CONCIERGE'), page('SEMINAR')] }).success).toBe(false)
  })

  it('saves typed incomplete drafts including empty strings and repeatable items', () => {
    const draft = { ...page('CONCIERGE'), h1: '', cta_href: ' ', highlights: [{ title: '', copy: '' }], faq: [] }
    expect(LandingPagesUpdateSchema.safeParse({ pages: [draft, page('SEMINAR'), { ...page('VACATION_RENTAL'), empty_copy: null }] }).success).toBe(true)
  })

  it.each([
    { cta_href: 'javascript:alert(1)' }, { cta_href: '//evil.example' }, { h1: 'x'.repeat(181) },
    { hero_copy: 12 }, { highlights: [{ title: '', copy: 12 }] }, { faq: Array(21).fill({ question: '', answer: '' }) },
  ])('rejects unsafe or malformed drafts: %j', invalid => {
    expect(LandingPagesUpdateSchema.safeParse({ pages: [{ ...page('CONCIERGE'), ...invalid }, page('SEMINAR'), page('VACATION_RENTAL')] }).success).toBe(false)
  })

  it.each([' TODO ', 'tBd', ' À   COMPLÉTER ', 'lOrEm\n  IPSUM', 'Placeholder'])('allows %s in drafts but rejects its publication with a field path', placeholder => {
    const draft = { ...page('CONCIERGE'), h1: placeholder }
    expect(LandingPagesUpdateSchema.safeParse({ pages: [draft, page('SEMINAR'), page('VACATION_RENTAL')] }).success).toBe(true)
    const result = landingPageInputSchema.safeParse(draft)
    expect(result.success).toBe(false)
    if (!result.success) expect(result.error.issues).toContainEqual(expect.objectContaining({ path: ['h1'], message: expect.stringMatching(/placeholder/i) }))
  })

  it.each([
    { highlights: [{ title: 'TODO', copy: 'Un accompagnement local.' }] },
    { steps: [{ title: 'Échange', copy: 'à compléter' }] },
    { faq: [{ question: 'Question locale ?', answer: 'Lorem ipsum dolor sit amet.' }] },
    { reassurance: 'TBD' }, { process_title: 'placeholder' },
  ])('rejects placeholder repeatable and optional text during publication: %j', invalid => {
    expect(landingPageInputSchema.safeParse({ ...page('CONCIERGE'), ...invalid }).success).toBe(false)
  })
})
