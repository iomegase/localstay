import { NextResponse } from 'next/server'
import { apiError } from '@/features/merchant/lib/responses'
import { getPublishedLodgingDetail } from '@/features/lodging-showcase/queries/public-lodgings'

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string; lodgingSlug: string }> },
): Promise<NextResponse> {
  const { slug, lodgingSlug } = await params
  const result = await getPublishedLodgingDetail(slug, lodgingSlug)

  if (!result) {
    return apiError('NOT_FOUND', 'Logement introuvable', 404)
  }

  return NextResponse.json({
    id: result.id,
    slug: result.slug,
    city_slug: result.city_slug,
    title: result.title,
    cover_photo_url: result.cover_photo_url,
    short_description: result.short_description,
    property_type: result.property_type,
    max_guests: result.max_guests,
    bedroom_count: result.bedroom_count,
    public_area_label: result.public_area_label,
    amenities: result.amenities,
    href: result.href,
    description: result.description,
    photos: result.photos,
    bathroom_count: result.bathroom_count,
    bed_count: result.bed_count,
    surface_m2: result.surface_m2,
    external_booking_url: result.external_booking_url,
    external_booking_platform: result.external_booking_platform,
    public_contact_enabled: result.public_contact_enabled,
  })
}
