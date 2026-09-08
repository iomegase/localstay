import { Prisma, type LocalLandingPage } from '@prisma/client'
import { prisma } from '@/shared/lib/prisma'
import {
  LandingDestinationInputSchema,
  LandingPagesUpdateSchema,
  LandingPublicationInputSchema,
  landingPageInputSchema,
} from '../schemas/landing-pages'
import { resolveLandingPublication } from '../services/landing-publication'
import {
  LOCAL_LANDING_INTENTS,
  type AdminLandingDestinationDto,
  type EligibleLandingCityDto,
  type LandingContentIssue,
  type LocalLandingIntent,
  type LocalLandingPageInput,
  type PublicLocalLandingDto,
  type PublishedLocalLandingSummaryDto,
} from '../types/landing-pages'

export class LandingDestinationError extends Error {
  constructor(
    public readonly code: 'NOT_FOUND' | 'DESTINATION_ALREADY_EXISTS' | 'INCOMPLETE_CONTENT',
    public readonly status: 400 | 404 | 409,
    public readonly details: Record<string, unknown> = {},
  ) {
    super(code)
    this.name = 'LandingDestinationError'
  }
}

const activeCity = { is_active: true, deleted_at: null } as const
const destinationInclude = {
  city: { select: { id: true, name: true, slug: true, is_active: true, deleted_at: true } },
  pages: { where: { deleted_at: null } },
} satisfies Prisma.LocalLandingDestinationInclude
type DestinationRow = Prisma.LocalLandingDestinationGetPayload<{ include: typeof destinationInclude }>
type Database = Prisma.TransactionClient

function blankPage(intent: LocalLandingIntent): LocalLandingPageInput {
  return {
    intent, seo_title: '', meta_description: '', eyebrow: '', h1: '',
    hero_title: '', hero_copy: '', reassurance: null, section_title: '',
    section_copy: '', process_title: null, local_title: '', local_copy: '',
    cta_label: '', cta_href: '', empty_copy: null, highlights: [], steps: [], faq: [],
  }
}

// Project persisted columns before passing them to the strict content schema.
function pageContent(page: LocalLandingPage) {
  return {
    intent: page.intent,
    seo_title: page.seo_title,
    meta_description: page.meta_description,
    eyebrow: page.eyebrow,
    h1: page.h1,
    hero_title: page.hero_title,
    hero_copy: page.hero_copy,
    reassurance: page.reassurance,
    section_title: page.section_title,
    section_copy: page.section_copy,
    process_title: page.process_title,
    local_title: page.local_title,
    local_copy: page.local_copy,
    cta_label: page.cta_label,
    cta_href: page.cta_href,
    empty_copy: page.empty_copy,
    highlights: page.highlights,
    steps: page.steps,
    faq: page.faq,
  }
}

function inspectPages(destination: DestinationRow) {
  const validPages = new Map<LocalLandingIntent, LocalLandingPageInput>()
  const contentIssues: LandingContentIssue[] = []
  const pages = LOCAL_LANDING_INTENTS.map(intent => {
    const row = destination.pages.find(page => page.intent === intent && page.deleted_at === null)
    const content = row ? pageContent(row) : blankPage(intent)
    const parsed = landingPageInputSchema.safeParse(content)
    if (parsed.success) {
      validPages.set(intent, parsed.data)
      return parsed.data
    }
    contentIssues.push(...parsed.error.issues.map(issue => ({
      intent, field: issue.path.join('.'), message: issue.message,
    })))
    // The Admin can repair invalid drafts, but malformed JSON is never trusted.
    const shape = landingPageInputSchema.innerType().shape
    const highlights = shape.highlights.safeParse(content.highlights)
    const steps = shape.steps.safeParse(content.steps)
    const faq = shape.faq.safeParse(content.faq)
    return {
      ...content,
      highlights: highlights.success ? highlights.data : [],
      steps: steps.success ? steps.data : [],
      faq: faq.success ? faq.data : [],
    }
  })
  return { pages, validPages, contentIssues }
}

function publicationFor(destination: DestinationRow, validPages: Map<LocalLandingIntent, LocalLandingPageInput>, publicLodgingCount: number) {
  return resolveLandingPublication({
    destinationActive: destination.is_active && destination.deleted_at === null
      && destination.city.is_active && destination.city.deleted_at === null,
    serviceContentComplete: validPages.has('CONCIERGE') && validPages.has('SEMINAR'),
    vacationContentComplete: validPages.has('VACATION_RENTAL'),
    publicLodgingCount,
  })
}

function cityDto(destination: DestinationRow): EligibleLandingCityDto {
  return { id: destination.city.id, name: destination.city.name, slug: destination.city.slug }
}

async function publicLodgingCounts(db: Database, cityIds: string[]) {
  if (cityIds.length === 0) return new Map<string, number>()
  const profiles = await db.lodgingPublicProfile.findMany({
    where: {
      city_id: { in: cityIds }, publication_status: 'published', deleted_at: null,
      city: activeCity,
      lodging: { ...activeCity, city: activeCity },
    },
    select: { city_id: true },
  })
  const counts = new Map<string, number>()
  for (const profile of profiles) counts.set(profile.city_id, (counts.get(profile.city_id) ?? 0) + 1)
  return counts
}

async function adminDtos(db: Database, destinations: DestinationRow[]): Promise<AdminLandingDestinationDto[]> {
  if (destinations.length === 0) return []
  const [counts, reviews] = await Promise.all([
    publicLodgingCounts(db, destinations.map(destination => destination.city_id)),
    db.localLandingReview.findMany({
      where: { destination_id: { in: destinations.map(destination => destination.id) } },
      orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
    }),
  ])
  return destinations.map(destination => {
    const { pages, validPages, contentIssues } = inspectPages(destination)
    const publicLodgingCount = counts.get(destination.city_id) ?? 0
    const destinationReviews = reviews.filter(review => review.destination_id === destination.id)
    return {
      id: destination.id,
      city: cityDto(destination),
      is_active: destination.is_active,
      pages,
      publication: publicationFor(destination, validPages, publicLodgingCount),
      contentIssues,
      publicLodgingCount,
      reviewCount: destinationReviews.filter(review => review.deleted_at === null).length,
      reviews: destinationReviews.map(review => ({
        ...review,
        deleted_at: review.deleted_at?.toISOString() ?? null,
        created_at: review.created_at.toISOString(),
        updated_at: review.updated_at.toISOString(),
      })),
      created_at: destination.created_at.toISOString(),
      updated_at: destination.updated_at.toISOString(),
    }
  })
}

async function findDestination(db: Database, id: string) {
  const destination = await db.localLandingDestination.findFirst({
    where: { id, deleted_at: null }, include: destinationInclude,
  })
  if (!destination) throw new LandingDestinationError('NOT_FOUND', 404)
  return destination
}

async function adminDto(db: Database, id: string) {
  return (await adminDtos(db, [await findDestination(db, id)]))[0]
}

export async function listAdminLandingDestinations(): Promise<AdminLandingDestinationDto[]> {
  const destinations = await prisma.localLandingDestination.findMany({
    where: { deleted_at: null }, include: destinationInclude, orderBy: { city: { name: 'asc' } },
  })
  return adminDtos(prisma, destinations)
}

export async function listEligibleLandingCities(): Promise<EligibleLandingCityDto[]> {
  return prisma.city.findMany({
    where: {
      ...activeCity,
      OR: [
        { local_landing_destination: { is: null } },
        { local_landing_destination: { is: { deleted_at: { not: null } } } },
      ],
    },
    select: { id: true, name: true, slug: true }, orderBy: { name: 'asc' },
  })
}

export async function getPublishedLocalLanding(slug: string, intent: LocalLandingIntent): Promise<PublicLocalLandingDto | null> {
  const destination = await prisma.localLandingDestination.findFirst({
    where: { is_active: true, deleted_at: null, city: { slug, ...activeCity } },
    include: destinationInclude,
  })
  if (!destination) return null
  const { validPages } = inspectPages(destination)
  const counts = await publicLodgingCounts(prisma, [destination.city_id])
  const publicLodgingCount = counts.get(destination.city_id) ?? 0
  const publication = publicationFor(destination, validPages, publicLodgingCount)
  const page = validPages.get(intent)
  const published = { CONCIERGE: publication.concierge, SEMINAR: publication.seminar, VACATION_RENTAL: publication.vacationRental }
  if (!page || !published[intent]) return null
  return { id: destination.id, city: cityDto(destination), page, publication, publicLodgingCount }
}

export async function listPublishedLocalLandingSummaries(): Promise<PublishedLocalLandingSummaryDto[]> {
  const destinations = await prisma.localLandingDestination.findMany({
    where: { is_active: true, deleted_at: null, city: activeCity },
    include: destinationInclude, orderBy: { city: { name: 'asc' } },
  })
  const counts = await publicLodgingCounts(prisma, destinations.map(destination => destination.city_id))
  return destinations.flatMap(destination => {
    const { validPages } = inspectPages(destination)
    const publicLodgingCount = counts.get(destination.city_id) ?? 0
    const publication = publicationFor(destination, validPages, publicLodgingCount)
    return publication.concierge ? [{ id: destination.id, city: cityDto(destination), publication, publicLodgingCount }] : []
  })
}

export async function listPublishedLocalLandingPaths(publishedLodgingCitySlugs?: string[]): Promise<string[]> {
  const summaries = await listPublishedLocalLandingSummaries()
  const lodgingSlugs = publishedLodgingCitySlugs ? new Set(publishedLodgingCitySlugs) : null
  return [
    ...summaries.filter(item => item.publication.concierge).map(item => `/conciergerie/${encodeURIComponent(item.city.slug)}`),
    ...summaries.filter(item => item.publication.seminar).map(item => `/seminaires/${encodeURIComponent(item.city.slug)}`),
    ...summaries.filter(item => item.publication.vacationRental && (!lodgingSlugs || lodgingSlugs.has(item.city.slug)))
      .map(item => `/locations-vacances/${encodeURIComponent(item.city.slug)}`),
  ]
}

async function writePages(db: Database, id: string, pages: LocalLandingPageInput[]) {
  for (const page of pages) {
    await db.localLandingPage.upsert({
      where: { destination_id_intent: { destination_id: id, intent: page.intent } },
      create: { ...page, destination_id: id },
      update: { ...page, deleted_at: null },
    })
  }
}

export async function createLandingDestination(cityId: string): Promise<AdminLandingDestinationDto> {
  const { city_id } = LandingDestinationInputSchema.parse({ city_id: cityId })
  try {
    return await prisma.$transaction(async db => {
      const city = await db.city.findFirst({ where: { id: city_id, ...activeCity }, select: { id: true, slug: true } })
      if (!city) throw new LandingDestinationError('NOT_FOUND', 404)
      const existing = await db.localLandingDestination.findUnique({ where: { city_id } })
      if (existing && existing.deleted_at === null) throw new LandingDestinationError('DESTINATION_ALREADY_EXISTS', 409)
      const destination = existing
        ? await db.localLandingDestination.update({ where: { id: existing.id }, data: { is_active: false, deleted_at: null } })
        : await db.localLandingDestination.create({ data: { city_id, is_active: false } })
      if (existing) {
        // Also quarantine any unbackfilled legacy review before reusing the unique City configuration.
        await db.localLandingReview.updateMany({
          where: { deleted_at: null, OR: [{ destination_id: destination.id }, { destination_id: null, destination_slug: city.slug }] },
          data: { deleted_at: new Date(), is_active: false },
        })
      }
      await writePages(db, destination.id, LOCAL_LANDING_INTENTS.map(blankPage))
      return adminDto(db, destination.id)
    }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
      throw new LandingDestinationError('DESTINATION_ALREADY_EXISTS', 409)
    }
    throw error
  }
}

export async function updateLandingDestinationPages(id: string, pages: LocalLandingPageInput[]): Promise<AdminLandingDestinationDto> {
  const input = LandingPagesUpdateSchema.parse({ pages })
  return prisma.$transaction(async db => {
    await findDestination(db, id)
    await writePages(db, id, input.pages)
    return adminDto(db, id)
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

export async function setLandingDestinationActive(id: string, isActive: boolean): Promise<AdminLandingDestinationDto> {
  const { is_active } = LandingPublicationInputSchema.parse({ is_active: isActive })
  return prisma.$transaction(async db => {
    const destination = await findDestination(db, id)
    if (is_active) {
      if (!destination.city.is_active || destination.city.deleted_at !== null) throw new LandingDestinationError('NOT_FOUND', 404)
      const { contentIssues } = inspectPages(destination)
      const issues = contentIssues.filter(issue => issue.intent !== 'VACATION_RENTAL')
      if (issues.length > 0) {
        throw new LandingDestinationError('INCOMPLETE_CONTENT', 400, {
          missingFields: [...new Set(issues.map(issue => `${issue.intent}.${issue.field}`))], issues,
        })
      }
    }
    await db.localLandingDestination.updateMany({ where: { id, deleted_at: null }, data: { is_active } })
    return adminDto(db, id)
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

export async function deleteLandingDestination(id: string): Promise<{ id: string }> {
  return prisma.$transaction(async db => {
    const destination = await findDestination(db, id)
    const deleted_at = new Date()
    await db.localLandingDestination.updateMany({ where: { id, deleted_at: null }, data: { deleted_at, is_active: false } })
    await db.localLandingPage.updateMany({ where: { destination_id: id }, data: { deleted_at } })
    await db.localLandingReview.updateMany({
      where: { OR: [{ destination_id: id }, { destination_id: null, destination_slug: destination.city.slug }] },
      data: { deleted_at, is_active: false },
    })
    return { id }
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}
