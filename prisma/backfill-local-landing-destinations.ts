// Spec 048, AC-06-01..03. Run after the additive migration, before required-FK enforcement.
// Importing this module never instantiates Prisma or connects to a database.
import { PrismaClient } from '@prisma/client'
import {
  localSeoDestinations,
  type LocalServiceContent,
} from '../src/features/local-seo/content/destinations'
import { getLocalConciergeLandingContent } from '../src/features/local-seo/content/concierge-landings'
import { landingPageInputSchema } from '../src/features/local-seo/schemas/landing-pages'
import type { LocalLandingPageInput } from '../src/features/local-seo/types/landing-pages'

type BackfillDestination = {
  slug: string
  is_active: boolean
  pages: LocalLandingPageInput[]
}

// Frozen from the actual public LocalConciergeLanding.tsx at 40eed0f.
// The older destination catalogue contains superseded service/process blocks.
const conciergeServices = [
  ['Valorisation du logement', 'Présentation du logement et informations nécessaires au séjour.'],
  ['Gestion des voyageurs', 'Échanges avant l’arrivée, pendant le séjour et jusqu’au départ.'],
  ['Arrivées & départs', 'Informations d’accès, préparation du logement et vérification après les séjours.'],
  ['Ménage & linge', 'Organisation des rotations, du ménage et du linge entre les locations.'],
  ['Suivi du logement', 'Contrôle, signalement des incidents et coordination des interventions nécessaires.'],
  ['Guide voyageur MyStay', 'Accès, Wi-Fi, équipements, consignes et recommandations locales sur le téléphone du voyageur.'],
] as const

const conciergeSteps = [
  ['Premier échange', 'Nous découvrons le logement et les attentes du propriétaire.'],
  ['Visite du logement', 'Nous identifions son fonctionnement, ses équipements et les particularités liées aux séjours.'],
  ['Préparation', 'Nous organisons les informations voyageurs, les rotations et le guide MyStay.'],
  ['Mise en gestion', 'MyStay accompagne les voyageurs et suit le logement au fil des séjours.'],
] as const

function servicePage(
  source: LocalServiceContent,
  intent: 'CONCIERGE' | 'SEMINAR',
): LocalLandingPageInput {
  return {
    intent,
    seo_title: source.h1,
    meta_description: source.metaDescription,
    eyebrow: source.eyebrow,
    h1: source.h1,
    hero_title: source.h1,
    hero_copy: source.intro,
    reassurance: null,
    section_title: source.sectionTitle,
    section_copy: source.sectionCopy,
    process_title: source.processTitle,
    local_title: source.localTitle,
    local_copy: source.localCopy,
    cta_label: source.ctaLabel,
    cta_href: source.ctaHref,
    empty_copy: null,
    highlights: source.highlights.map(item => ({ ...item })),
    steps: source.steps.map(item => ({ ...item })),
    faq: source.faq.map(item => ({ ...item })),
  }
}

export function buildLocalLandingBackfill(): BackfillDestination[] {
  return localSeoDestinations.map(source => {
    const detailed = getLocalConciergeLandingContent(source)
    const vacation = source.services.vacationRental
    const concierge: LocalLandingPageInput = {
      ...servicePage(source.services.concierge, 'CONCIERGE'),
      hero_title: detailed.promise,
      hero_copy: detailed.heroCopy,
      reassurance: detailed.reassurance,
      section_title: detailed.ownerTitle,
      section_copy: detailed.ownerCopy,
      local_title: detailed.localHeading,
      local_copy: detailed.localCopy,
      highlights: conciergeServices.map(([title, copy]) => ({ title, copy })),
      steps: conciergeSteps.map(([title, copy]) => ({ title, copy })),
      process_title: 'Comment se passe la mise en gestion ?',
      faq: detailed.faq.map(item => ({ ...item })),
    }
    const pages: LocalLandingPageInput[] = [
      concierge,
      servicePage(source.services.seminar, 'SEMINAR'),
      {
        intent: 'VACATION_RENTAL',
        seo_title: vacation.h1,
        meta_description: vacation.metaDescription,
        eyebrow: vacation.eyebrow,
        h1: vacation.h1,
        hero_title: vacation.h1,
        hero_copy: vacation.intro,
        reassurance: null,
        // This page previously had no separate introduction section. Reuse its
        // reviewed heading/copy; do not invent new editorial or inventory claims.
        section_title: vacation.h1,
        section_copy: vacation.intro,
        process_title: null,
        local_title: vacation.localTitle,
        local_copy: vacation.localCopy,
        cta_label: 'Nos adresses locales',
        cta_href: '/decouvrir',
        empty_copy: vacation.emptyCopy,
        highlights: [],
        steps: [],
        faq: [],
      },
    ]
    const is_active = source.services.concierge.published && source.services.seminar.published
    // Future destinations retain their intentionally incomplete drafts, but an
    // import must fail before exposing an invalid previously published page.
    if (is_active) pages.forEach(page => landingPageInputSchema.parse(page))
    return { slug: source.slug, is_active, pages }
  })
}

// This script is deliberately executed from the nullable expand-stage checkout.
// Keep its narrow client contract independent from the final branch's generated
// required-relation Prisma types, which are used by all runtime queries.
type BackfillTransaction = {
  city: {
    findMany(args: {
      where: { slug: { in: string[] }; deleted_at: null }
      select: { id: true; slug: true }
    }): Promise<Array<{ id: string; slug: string }>>
  }
  localLandingDestination: {
    upsert(args: {
      where: { city_id: string }
      update: Record<string, never>
      create: { city_id: string; is_active: boolean }
      select: { id: true }
    }): Promise<{ id: string }>
  }
  localLandingPage: {
    upsert(args: {
      where: { destination_id_intent: { destination_id: string; intent: LocalLandingPageInput['intent'] } }
      update: Record<string, never>
      create: LocalLandingPageInput & { destination_id: string }
      select: { id: true }
    }): Promise<{ id: string }>
  }
  localLandingReview: {
    findMany(args: {
      where: { destination_id: null }
      select: { id: true; destination_slug: true; updated_at: true }
    }): Promise<Array<{ id: string; destination_slug: string; updated_at: Date }>>
    updateMany(args: {
      where: { id: string; destination_id: null }
      data: { destination_id: string; updated_at: Date }
    }): Promise<{ count: number }>
  }
}

export type BackfillClient = {
  $transaction<T>(
    callback: (transaction: BackfillTransaction) => Promise<T>,
    options?: { maxWait?: number; timeout?: number },
  ): Promise<T>
}

export async function backfillLocalLandingDestinations(client: BackfillClient) {
  const sources = buildLocalLandingBackfill()
  return client.$transaction(async tx => {
    const cities = await tx.city.findMany({
      where: { slug: { in: sources.map(source => source.slug) }, deleted_at: null },
      select: { id: true, slug: true },
    })
    const cityBySlug = new Map(cities.map(city => [city.slug, city.id]))
    for (const source of sources) {
      if (!cityBySlug.has(source.slug)) throw new Error(`Missing City for ${source.slug}`)
    }

    // Include inactive and soft-deleted reviews; their values and audit dates
    // remain untouched. The expand migration initializes deleted_with_destination
    // to false for legacy reviews; reruns must never clear a later group-deletion
    // marker. Unknown slugs block the migration before any writes.
    const reviews = await tx.localLandingReview.findMany({
      where: { destination_id: null },
      select: { id: true, destination_slug: true, updated_at: true },
    })
    for (const review of reviews) {
      if (!cityBySlug.has(review.destination_slug)) {
        throw new Error(`Unmapped LocalLandingReview destination: ${review.destination_slug}`)
      }
    }

    let attachedReviews = 0
    for (const source of sources) {
      const city_id = cityBySlug.get(source.slug)!
      const destination = await tx.localLandingDestination.upsert({
        where: { city_id },
        update: {},
        create: { city_id, is_active: source.is_active },
        select: { id: true },
      })
      for (const page of source.pages) {
        await tx.localLandingPage.upsert({
          where: { destination_id_intent: { destination_id: destination.id, intent: page.intent } },
          // An existing row belongs to the Admin, even when empty or deleted.
          update: {},
          create: { destination_id: destination.id, ...page },
          select: { id: true },
        })
      }
      for (const review of reviews.filter(item => item.destination_slug === source.slug)) {
        const result = await tx.localLandingReview.updateMany({
          where: { id: review.id, destination_id: null },
          data: { destination_id: destination.id, updated_at: review.updated_at },
        })
        attachedReviews += result.count
      }
    }
    return { processedDestinations: sources.length, processedPages: sources.length * 3, attachedReviews }
  }, { maxWait: 10_000, timeout: 60_000 })
}

if (require.main === module) {
  const prisma = new PrismaClient()
  // The command is only valid when invoked from the nullable-stage checkout
  // described in prisma/local-landing-migration.md.
  backfillLocalLandingDestinations(prisma as unknown as BackfillClient)
    .then(result => console.log('Local landing backfill complete:', result))
    .catch(error => {
      console.error(error)
      process.exitCode = 1
    })
    .finally(() => prisma.$disconnect())
}
