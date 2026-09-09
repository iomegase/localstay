import type { LocalLandingPage } from '@prisma/client'
import { LOCAL_LANDING_INTENTS, type LocalLandingIntent, type LocalLandingPageInput } from '@/features/local-seo/types/landing-pages'

export const landingDate = new Date('2026-09-08T12:00:00.000Z')

export function landingPageInput(intent: LocalLandingIntent): LocalLandingPageInput {
  return {
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
    local_copy: 'Découvrez les quartiers et les services qui correspondent à votre projet.',
    cta_label: 'Échanger avec nous',
    cta_href: '/contact',
    empty_copy: intent === 'VACATION_RENTAL' ? 'Aucun logement public n’est encore disponible.' : null,
    highlights: intent === 'VACATION_RENTAL' ? [] : [{ title: 'Sur mesure', copy: 'Un accompagnement adapté à votre besoin.' }],
    steps: intent === 'VACATION_RENTAL' ? [] : [{ title: 'Échange', copy: 'Nous commençons par comprendre votre projet.' }],
    faq: intent === 'VACATION_RENTAL' ? [] : [{ question: 'Comment démarrer ?', answer: 'Écrivez-nous depuis cette page.' }],
  }
}

export function landingPageRow(intent: LocalLandingIntent): LocalLandingPage {
  return {
    ...landingPageInput(intent), id: `page-${intent}`, destination_id: 'destination-1',
    deleted_at: null, created_at: landingDate, updated_at: landingDate,
  }
}

export function landingDestinationRow() {
  return {
    id: 'destination-1', city_id: 'city-1', is_active: true, deleted_at: null as Date | null,
    created_at: landingDate, updated_at: landingDate,
    city: { id: 'city-1', name: 'Megève', slug: 'megeve', is_active: true, deleted_at: null as Date | null },
    pages: LOCAL_LANDING_INTENTS.map(landingPageRow),
  }
}

export function landingReviewRow() {
  return {
    id: 'review-1', destination_id: 'destination-1' as string | null, destination_slug: 'megeve',
    author: 'Marie', quote: 'Un séjour parfaitement accompagné par MyStay.',
    stay_date: null, source: 'DIRECT' as const, rating: 5, sort_order: 0,
    is_active: true, deleted_with_destination: false, deleted_at: null as Date | null, created_at: landingDate, updated_at: landingDate,
  }
}
