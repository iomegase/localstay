import { saveOwnerPublicProfile } from '@/features/lodging-showcase/queries/owner-public-profile'
import type { LodgingPublicProfileInput } from '@/features/lodging-showcase/schemas'
import { revalidatePath } from 'next/cache'
import { saveGeneratedRewrite } from '@/features/lodging-showcase/queries/owner-public-profile'
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodging: { findFirst: jest.fn() },
    lodgingPublicProfile: { upsert: jest.fn(), findUnique: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
    lodgingAmenity: { deleteMany: jest.fn(), createMany: jest.fn(), updateMany: jest.fn() },
    lodgingFaqItem: { deleteMany: jest.fn(), createMany: jest.fn(), updateMany: jest.fn() },
    lodgingPhoto: { updateMany: jest.fn() },
  },
}))

import { prisma } from '@/shared/lib/prisma'

type TestDatabase = {
  lodging: {
    findFirst: jest.MockedFunction<() => Promise<unknown>>
  }
  lodgingPublicProfile: {
    upsert: jest.MockedFunction<() => Promise<{ id: string }>>
    findUnique: jest.MockedFunction<() => Promise<unknown>>
    findFirst: jest.MockedFunction<() => Promise<unknown>>
  }
  lodgingAmenity: {
    deleteMany: jest.MockedFunction<() => Promise<{ count: number }>>
    createMany: jest.MockedFunction<() => Promise<{ count: number }>>
    updateMany: jest.MockedFunction<() => Promise<{ count: number }>>
  }
  lodgingFaqItem: {
    deleteMany: jest.MockedFunction<() => Promise<{ count: number }>>
    createMany: jest.MockedFunction<() => Promise<{ count: number }>>
    updateMany: jest.MockedFunction<() => Promise<{ count: number }>>
  }
  lodgingPhoto: {
    updateMany: jest.MockedFunction<() => Promise<{ count: number }>>
  }
}

const db = prisma as unknown as TestDatabase

const baseInput: LodgingPublicProfileInput = {
  title: 'Chalet test alpin',
  short_description: 'x'.repeat(50),
  description: 'y'.repeat(100),
  property_type: 'Chalet',
  max_guests: 4,
  bedroom_count: 2,
  bathroom_count: 1,
  bed_count: 3,
  surface_m2: 80,
  public_area_label: 'Zone',
  precise_location_public: false,
  public_latitude: null,
  public_longitude: null,
  external_booking_url: null,
  external_booking_platform: null,
  seo_title: null,
  seo_description: null,
  source_description_text: null,
  public_contact_enabled: true,
  amenities: [{ code: 'wifi', label: 'Wifi', sort_order: 0, availability: 'included' }],
  photos: [],
  faq: [],
}

describe('spec 090 — validation unique à la mise en ligne', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    db.lodging.findFirst.mockResolvedValue({
      id: 'lodging-1', name: 'Chalet', city_id: 'city-1', city: { id: 'city-1', name: 'Chamonix', slug: 'chamonix' },
    })
    db.lodgingPublicProfile.upsert.mockResolvedValue({ id: 'profile-1' })
    db.lodgingPublicProfile.findUnique.mockResolvedValue(null)
    db.lodgingPublicProfile.findFirst.mockResolvedValue(null)
  })

  it.each(['published', 'review', 'draft', 'archived'])('AC-01 / AC-02 : une sauvegarde Owner ne change pas le statut %s', async status => {
    db.lodgingPublicProfile.findUnique.mockResolvedValueOnce({ slug: 'chalet-test', publication_status: status, published_at: status === 'published' ? new Date() : null, city: { slug: 'chamonix' } })
    await saveOwnerPublicProfile('owner-1', 'lodging-1', baseInput)

    const { update } = (db.lodgingPublicProfile.upsert.mock.calls[0] as unknown as [{ update: Record<string, unknown> }])[0]
    expect(update).not.toHaveProperty('publication_status')
    if (status === 'published') expect(update.slug).toBe('chalet-test')
  })

  it('AC-01 : les pages publiques sont revalidées (modifications en ligne)', async () => {
    db.lodgingPublicProfile.findUnique.mockResolvedValueOnce({ slug: 'chalet-test', publication_status: 'published', published_at: new Date(), city: { slug: 'chamonix' } })
    await saveOwnerPublicProfile('owner-1', 'lodging-1', baseInput)
    expect(revalidatePath).toHaveBeenCalled()
  })

  it('AC-03 : une proposition de réécriture ne dépublie pas la fiche', async () => {
    const update = (prisma as unknown as { lodgingPublicProfile: { update: jest.Mock } }).lodgingPublicProfile.update
    db.lodgingPublicProfile.upsert.mockResolvedValue({ id: 'profile-1', slug: 'chalet-test', city: { slug: 'chamonix' }, photos: [], amenities: [], faq_items: [] } as never)
    update.mockResolvedValue({ rewrite_status: 'generated', rewrite_suggestion: '{}' })
    await saveGeneratedRewrite('owner-1', 'lodging-1', {
      sourceDescriptionText: 'Texte source '.repeat(10),
      rewriteSuggestion: { short_description: 'a', description: 'b', seo_title: 'c', seo_description: 'd' },
    })
    expect(update).toHaveBeenCalledWith(expect.objectContaining({ data: expect.not.objectContaining({ publication_status: expect.anything() }) }))
  })
})
