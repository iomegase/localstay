import { Prisma } from '@prisma/client'
import { prisma } from '@/shared/lib/prisma'
import { listAdminLandingDestinations } from './landing-pages'
import type { GuestReview } from '../content/guest-reviews'
import type { AdminLandingPageDto, LandingReviewDto } from '../types/landing-reviews'
import { LandingReviewInputSchema, type LandingReviewInput } from '../schemas/landing-reviews'

export class LandingReviewError extends Error {
  constructor(public readonly code: 'NOT_FOUND' | 'VALIDATION_ERROR', public readonly status = 404) {
    super(code)
    this.name = 'LandingReviewError'
  }
}

function toDto(review: {
  id: string
  destination_id: string
  destination_slug: string
  author: string
  quote: string
  stay_date: string | null
  source: 'AIRBNB' | 'DIRECT'
  rating: number | null
  sort_order: number
  is_active: boolean
  deleted_with_destination: boolean
  deleted_at: Date | null
  created_at: Date
  updated_at: Date
}): LandingReviewDto {
  return {
    ...review,
    deleted_at: review.deleted_at?.toISOString() ?? null,
    created_at: review.created_at.toISOString(),
    updated_at: review.updated_at.toISOString(),
  }
}

const reviewSelect = {
  id: true,
  destination_id: true,
  destination_slug: true,
  author: true,
  quote: true,
  stay_date: true,
  source: true,
  rating: true,
  sort_order: true,
  is_active: true,
  deleted_with_destination: true,
  deleted_at: true,
  created_at: true,
  updated_at: true,
} as const

export async function listPublicLandingReviews(destinationSlug: string): Promise<GuestReview[]> {
  return prisma.localLandingReview.findMany({
    where: {
      deleted_at: null,
      deleted_with_destination: false,
      is_active: true,
      destination: { is: {
        is_active: true, deleted_at: null,
        city: { slug: destinationSlug, is_active: true, deleted_at: null },
      } },
    },
    orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
    take: 3,
    select: { id: true, quote: true, author: true, stay_date: true, source: true, rating: true },
  }).then(reviews => reviews.map(review => ({
    id: review.id,
    quote: review.quote,
    author: review.author,
    stayDate: review.stay_date ?? undefined,
    source: review.source,
    rating: review.rating ?? undefined,
  })))
}

export async function listAdminLandingPages(): Promise<AdminLandingPageDto[]> {
  const destinations = await listAdminLandingDestinations()
  return destinations.map(destination => ({
    slug: destination.city.slug,
    name: destination.city.name,
    published: destination.publication.concierge,
    reviews: destination.reviews,
  }))
}

async function resolveReviewDestination(db: Prisma.TransactionClient, slug: string) {
  const destination = await db.localLandingDestination.findFirst({
    where: { is_active: true, deleted_at: null, city: { slug, is_active: true, deleted_at: null } },
    select: { id: true, city: { select: { slug: true } } },
  })
  if (!destination) throw new LandingReviewError('VALIDATION_ERROR', 400)
  return destination
}

export async function createLandingReview(input: LandingReviewInput): Promise<LandingReviewDto> {
  const parsed = LandingReviewInputSchema.parse(input)
  return prisma.$transaction(async db => {
    const destination = await resolveReviewDestination(db, parsed.destination_slug)
    return toDto(await db.localLandingReview.create({ data: {
      ...parsed,
      destination_id: destination.id,
      destination_slug: destination.city.slug,
      deleted_with_destination: false,
      stay_date: parsed.stay_date || null,
      rating: parsed.rating ?? null,
    }, select: reviewSelect }))
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

export async function updateLandingReview(id: string, input: LandingReviewInput): Promise<LandingReviewDto> {
  const parsed = LandingReviewInputSchema.parse(input)
  return prisma.$transaction(async db => {
    const existing = await db.localLandingReview.findFirst({ where: { id, deleted_at: null, deleted_with_destination: false }, select: { id: true } })
    if (!existing) throw new LandingReviewError('NOT_FOUND')
    const destination = await resolveReviewDestination(db, parsed.destination_slug)
    return toDto(await db.localLandingReview.update({ where: { id }, data: {
      ...parsed,
      destination_id: destination.id,
      destination_slug: destination.city.slug,
      stay_date: parsed.stay_date || null,
      rating: parsed.rating ?? null,
    }, select: reviewSelect }))
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}

export async function archiveLandingReview(id: string): Promise<LandingReviewDto> {
  const existing = await prisma.localLandingReview.findFirst({ where: { id, deleted_at: null, deleted_with_destination: false }, select: { id: true } })
  if (!existing) throw new LandingReviewError('NOT_FOUND')
  return toDto(await prisma.localLandingReview.update({
    where: { id }, data: { deleted_at: new Date(), is_active: false }, select: reviewSelect,
  }))
}

export async function restoreLandingReview(id: string): Promise<LandingReviewDto> {
  return prisma.$transaction(async db => {
    const existing = await db.localLandingReview.findFirst({
      where: {
        id, deleted_at: { not: null },
        deleted_with_destination: false,
        destination: { is: { is_active: true, deleted_at: null, city: { is_active: true, deleted_at: null } } },
      },
      select: { id: true },
    })
    if (!existing) throw new LandingReviewError('NOT_FOUND')
    return toDto(await db.localLandingReview.update({
      where: { id }, data: { deleted_at: null, is_active: true }, select: reviewSelect,
    }))
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable })
}
