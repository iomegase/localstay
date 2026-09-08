import { prisma } from '@/shared/lib/prisma'
import { localSeoDestinations } from '../content/destinations'
import type { GuestReview } from '../content/guest-reviews'
import type { AdminLandingPageDto, LandingReviewDto } from '../types/landing-reviews'
import type { LandingReviewInput } from '../schemas/landing-reviews'

export class LandingReviewError extends Error {
  constructor(public readonly code: 'NOT_FOUND', public readonly status = 404) {
    super(code)
    this.name = 'LandingReviewError'
  }
}

function toDto(review: {
  id: string
  destination_slug: string
  author: string
  quote: string
  stay_date: string | null
  source: 'AIRBNB' | 'DIRECT'
  rating: number | null
  sort_order: number
  is_active: boolean
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
  destination_slug: true,
  author: true,
  quote: true,
  stay_date: true,
  source: true,
  rating: true,
  sort_order: true,
  is_active: true,
  deleted_at: true,
  created_at: true,
  updated_at: true,
} as const

export async function listPublicLandingReviews(destinationSlug: string): Promise<GuestReview[]> {
  return prisma.localLandingReview.findMany({
    where: { destination_slug: destinationSlug, deleted_at: null, is_active: true },
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
  const reviews = await prisma.localLandingReview.findMany({
    where: { destination_slug: { in: localSeoDestinations.map(item => item.slug) } },
    orderBy: [{ destination_slug: 'asc' }, { sort_order: 'asc' }, { created_at: 'asc' }],
    select: reviewSelect,
  })
  return localSeoDestinations.map(destination => ({
    slug: destination.slug,
    name: destination.name,
    published: destination.services.concierge.published,
    reviews: reviews.filter(review => review.destination_slug === destination.slug).map(toDto),
  }))
}

export async function createLandingReview(input: LandingReviewInput): Promise<LandingReviewDto> {
  return toDto(await prisma.localLandingReview.create({ data: {
    ...input,
    stay_date: input.stay_date || null,
    rating: input.rating ?? null,
  }, select: reviewSelect }))
}

export async function updateLandingReview(id: string, input: LandingReviewInput): Promise<LandingReviewDto> {
  const existing = await prisma.localLandingReview.findFirst({ where: { id, deleted_at: null }, select: { id: true } })
  if (!existing) throw new LandingReviewError('NOT_FOUND')
  return toDto(await prisma.localLandingReview.update({ where: { id }, data: {
    ...input,
    stay_date: input.stay_date || null,
    rating: input.rating ?? null,
  }, select: reviewSelect }))
}

export async function archiveLandingReview(id: string): Promise<LandingReviewDto> {
  const existing = await prisma.localLandingReview.findFirst({ where: { id, deleted_at: null }, select: { id: true } })
  if (!existing) throw new LandingReviewError('NOT_FOUND')
  return toDto(await prisma.localLandingReview.update({
    where: { id }, data: { deleted_at: new Date(), is_active: false }, select: reviewSelect,
  }))
}

export async function restoreLandingReview(id: string): Promise<LandingReviewDto> {
  const existing = await prisma.localLandingReview.findFirst({ where: { id, deleted_at: { not: null } }, select: { id: true } })
  if (!existing) throw new LandingReviewError('NOT_FOUND')
  return toDto(await prisma.localLandingReview.update({
    where: { id }, data: { deleted_at: null, is_active: true }, select: reviewSelect,
  }))
}
