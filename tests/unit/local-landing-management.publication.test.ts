import {
  getLandingContentMissingFields,
  resolveLandingPublication,
} from '@/features/local-seo/services/landing-publication'
import type { LocalLandingPageInput } from '@/features/local-seo/types/landing-pages'

const completePage = (intent: LocalLandingPageInput['intent']): LocalLandingPageInput => ({
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

describe('local landing publication policy', () => {
  it('returns missing fields by intent', () => {
    expect(getLandingContentMissingFields({ intent: 'CONCIERGE' })).toEqual([
      'seo_title', 'meta_description', 'eyebrow', 'h1', 'hero_title', 'hero_copy',
      'section_title', 'section_copy', 'local_title', 'local_copy', 'cta_label', 'cta_href',
      'highlights', 'steps', 'faq',
    ])
    expect(getLandingContentMissingFields(completePage('SEMINAR'))).toEqual([])
    expect(getLandingContentMissingFields({ ...completePage('VACATION_RENTAL'), empty_copy: null })).toContain('empty_copy')
  })

  it('publishes service pages but not locations without public lodging', () => {
    expect(resolveLandingPublication({ destinationActive: true, serviceContentComplete: true, vacationContentComplete: true, publicLodgingCount: 0 }))
      .toEqual({ concierge: true, seminar: true, vacationRental: false })
  })

  it('publishes no surface while the destination is off', () => {
    expect(resolveLandingPublication({ destinationActive: false, serviceContentComplete: true, vacationContentComplete: true, publicLodgingCount: 2 }))
      .toEqual({ concierge: false, seminar: false, vacationRental: false })
  })

  it('requires complete content before publishing any surface', () => {
    expect(resolveLandingPublication({ destinationActive: true, serviceContentComplete: false, vacationContentComplete: true, publicLodgingCount: 3 }))
      .toEqual({ concierge: false, seminar: false, vacationRental: false })
    expect(resolveLandingPublication({ destinationActive: true, serviceContentComplete: true, vacationContentComplete: false, publicLodgingCount: 3 }))
      .toEqual({ concierge: true, seminar: true, vacationRental: false })
  })
})
