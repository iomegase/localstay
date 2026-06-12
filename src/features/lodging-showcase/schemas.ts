import { z } from 'zod'
import { detectExternalListingSource } from './lib/source-url'

const trimmedString = (min: number, max: number) => z.string().trim().min(min).max(max)

export const ExternalBookingPlatformSchema = z.enum(['airbnb', 'booking', 'other_verified'])
export const LodgingPublicationStatusSchema = z.enum(['draft', 'review', 'published', 'archived'])
export const LodgingSourceMetadataStatusSchema = z.enum(['not_checked', 'url_only', 'unavailable', 'blocked'])
export const LodgingRewriteStatusSchema = z.enum(['not_requested', 'requested', 'generated', 'accepted', 'rejected', 'failed'])
export const LodgingPhotoRoomTypeSchema = z.enum(['bedroom', 'bathroom', 'common_area', 'exterior', 'kitchen', 'other'])

export const SourceUrlInputSchema = z.object({
  source_listing_url: z.string().trim().url().refine(value => value.startsWith('https://'), {
    message: 'EXTERNAL_URL_HTTPS_REQUIRED',
  }),
}).superRefine((value, ctx) => {
  try {
    detectExternalListingSource(value.source_listing_url)
  } catch (error) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['source_listing_url'],
      message: error instanceof Error ? error.message : 'EXTERNAL_PLATFORM_NOT_ALLOWED',
    })
  }
})

export const OwnerRightsConfirmationSchema = z.object({
  confirmed: z.literal(true),
  statement_version: z.string().trim().min(1).max(64),
})

export const LodgingAmenityItemSchema = z.object({
  code: z.string().trim().min(1).max(64),
  label: z.string().trim().min(1).max(80),
  sort_order: z.number().int().min(0).default(0),
})

export const LodgingPhotoItemSchema = z.object({
  id: z.string().uuid().optional(),
  url: z.string().trim().url().refine(value => value.startsWith('https://'), {
    message: 'PHOTO_URL_HTTPS_REQUIRED',
  }),
  alt: z.string().trim().min(1).max(160),
  room_type: LodgingPhotoRoomTypeSchema.nullish(),
  sort_order: z.number().int().min(0).default(0),
  is_cover: z.boolean(),
})

export const LodgingPublicProfileInputSchema = z.object({
  title: trimmedString(5, 90),
  short_description: trimmedString(40, 180),
  description: trimmedString(80, 4000),
  property_type: trimmedString(1, 80),
  max_guests: z.number().int().min(1).max(100),
  bedroom_count: z.number().int().min(0).max(100).nullable().optional(),
  bathroom_count: z.number().min(0).max(100).nullable().optional(),
  bed_count: z.number().int().min(0).max(100).nullable().optional(),
  surface_m2: z.number().int().min(1).max(10000).nullable().optional(),
  public_area_label: z.string().trim().min(1).max(120).nullable().optional(),
  precise_location_public: z.boolean().optional(),
  public_latitude: z.number().min(-90).max(90).nullable().optional(),
  public_longitude: z.number().min(-180).max(180).nullable().optional(),
  external_booking_url: z.string().trim().url().refine(value => value.startsWith('https://'), {
    message: 'EXTERNAL_URL_HTTPS_REQUIRED',
  }).nullable().optional(),
  external_booking_platform: ExternalBookingPlatformSchema.nullable().optional(),
  seo_title: z.string().trim().min(30).max(70).nullable().optional(),
  seo_description: z.string().trim().min(80).max(180).nullable().optional(),
  source_description_text: z.string().trim().min(80).max(6000).nullable().optional(),
  public_contact_enabled: z.boolean(),
  amenities: z.array(LodgingAmenityItemSchema).max(100),
  photos: z.array(LodgingPhotoItemSchema).max(100),
  content_rights_confirmed: z.boolean().optional(),
})

export const LodgingRewriteRequestSchema = z.object({
  source_description_text: z.string().trim().min(80).max(6000),
})

export const LodgingListFiltersSchema = z.object({
  guests: z.coerce.number().int().min(1).max(100).optional(),
  amenities: z.string().optional().transform(value => (
    value
      ?.split(',')
      .map(item => item.trim())
      .filter(item => item.length > 0)
      .slice(0, 50)
  ) ?? []),
})

export type SourceUrlInput = z.infer<typeof SourceUrlInputSchema>
export type OwnerRightsConfirmationInput = z.infer<typeof OwnerRightsConfirmationSchema>
export type LodgingAmenityItemInput = z.infer<typeof LodgingAmenityItemSchema>
export type LodgingPhotoItemInput = z.infer<typeof LodgingPhotoItemSchema>
export type LodgingPublicProfileInput = z.infer<typeof LodgingPublicProfileInputSchema>
export type LodgingRewriteRequestInput = z.infer<typeof LodgingRewriteRequestSchema>
export type LodgingListFiltersInput = z.infer<typeof LodgingListFiltersSchema>
