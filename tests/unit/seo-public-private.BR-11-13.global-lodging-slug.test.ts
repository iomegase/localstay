import {
  allocateLodgingSlug,
  lodgingSlugCandidates,
} from '@/features/lodging-showcase/lib/slug'
import { saveOwnerPublicProfile } from '@/features/lodging-showcase/queries/owner-public-profile'
import type { LodgingPublicProfileInput } from '@/features/lodging-showcase/schemas'

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodging: { findFirst: jest.fn() },
    lodgingPublicProfile: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
    },
    lodgingAmenity: { deleteMany: jest.fn(), createMany: jest.fn() },
    lodgingFaqItem: { deleteMany: jest.fn(), createMany: jest.fn() },
    lodgingPhoto: { updateMany: jest.fn() },
  },
}))

import { prisma } from '@/shared/lib/prisma'

type SlugConflictLookup = {
  where: {
    slug: string
    lodging_id: { not: string }
  }
  select: { id: true }
}

type TestDatabase = {
  lodging: {
    findFirst: jest.MockedFunction<() => Promise<unknown>>
  }
  lodgingPublicProfile: {
    findFirst: jest.MockedFunction<
      (args: SlugConflictLookup) => Promise<{ id: string } | null>
    >
    findUnique: jest.MockedFunction<() => Promise<unknown>>
    upsert: jest.MockedFunction<() => Promise<{ id: string }>>
  }
  lodgingAmenity: {
    deleteMany: jest.MockedFunction<() => Promise<{ count: number }>>
    createMany: jest.MockedFunction<() => Promise<{ count: number }>>
  }
  lodgingFaqItem: {
    deleteMany: jest.MockedFunction<() => Promise<{ count: number }>>
    createMany: jest.MockedFunction<() => Promise<{ count: number }>>
  }
  lodgingPhoto: {
    updateMany: jest.MockedFunction<() => Promise<{ count: number }>>
  }
}

const db = prisma as unknown as TestDatabase

const input: LodgingPublicProfileInput = {
  title: 'Chalet Hygge',
  short_description: 'x'.repeat(50),
  description: 'y'.repeat(100),
  property_type: 'Chalet',
  max_guests: 4,
  bedroom_count: 2,
  bathroom_count: 1,
  bed_count: 3,
  surface_m2: 80,
  public_area_label: 'Annecy',
  precise_location_public: false,
  public_latitude: null,
  public_longitude: null,
  external_booking_url: null,
  external_booking_platform: null,
  seo_title: null,
  seo_description: null,
  source_description_text: null,
  public_contact_enabled: true,
  amenities: [],
  photos: [],
  faq: [],
}

describe('042 SEO public/private architecture BR-11/BR-13 lodging slug allocation', () => {
  it('builds the base and City candidates in deterministic order', () => {
    expect(lodgingSlugCandidates('Chalet Hygge', 'Annecy')).toEqual([
      'chalet-hygge',
      'chalet-hygge-annecy',
    ])
  })

  it('does not return a duplicate candidate when normalization collapses the City suffix', () => {
    const eightyCharacters = 'a'.repeat(80)

    expect(lodgingSlugCandidates(eightyCharacters, 'Annecy')).toEqual([
      eightyCharacters,
    ])
  })

  it('allocates the base slug for a new draft when it is free', async () => {
    const isTaken = jest.fn<(candidate: string) => Promise<boolean>>()
      .mockResolvedValue(false)

    await expect(allocateLodgingSlug('Chalet Hygge', 'Annecy', isTaken))
      .resolves.toBe('chalet-hygge')
    expect(isTaken).toHaveBeenCalledTimes(1)
    expect(isTaken).toHaveBeenCalledWith('chalet-hygge')
  })

  it('uses the City candidate when the base slug is taken', async () => {
    const isTaken = jest.fn<(candidate: string) => Promise<boolean>>(async (candidate) =>
      candidate === 'chalet-hygge',
    )

    await expect(allocateLodgingSlug('Chalet Hygge', 'Annecy', isTaken))
      .resolves.toBe('chalet-hygge-annecy')
  })

  it('starts numeric progression at 2 when the base and City candidates are taken', async () => {
    const taken = new Set(['chalet-hygge', 'chalet-hygge-annecy'])
    const isTaken = jest.fn<(candidate: string) => Promise<boolean>>(async (candidate) =>
      taken.has(candidate),
    )

    await expect(allocateLodgingSlug('Chalet Hygge', 'Annecy', isTaken))
      .resolves.toBe('chalet-hygge-annecy-2')
  })

  it('continues numeric progression until the first free candidate', async () => {
    const taken = new Set([
      'chalet-hygge',
      'chalet-hygge-annecy',
      'chalet-hygge-annecy-2',
      'chalet-hygge-annecy-3',
    ])
    const isTaken = jest.fn<(candidate: string) => Promise<boolean>>(async (candidate) =>
      taken.has(candidate),
    )

    await expect(allocateLodgingSlug('Chalet Hygge', 'Annecy', isTaken))
      .resolves.toBe('chalet-hygge-annecy-4')
  })
})

describe('writePublicProfileForLodging slug stability and global lookup', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    db.lodging.findFirst.mockResolvedValue({
      id: 'lodging-1',
      name: 'Chalet',
      city_id: 'city-1',
      city: { id: 'city-1', name: 'Annecy', slug: 'annecy' },
    })
    db.lodgingPublicProfile.findUnique.mockResolvedValue(null)
    db.lodgingPublicProfile.findFirst.mockResolvedValue(null)
    db.lodgingPublicProfile.upsert.mockResolvedValue({ id: 'profile-1' })
    db.lodgingAmenity.deleteMany.mockResolvedValue({ count: 0 })
    db.lodgingAmenity.createMany.mockResolvedValue({ count: 0 })
    db.lodgingFaqItem.deleteMany.mockResolvedValue({ count: 0 })
    db.lodgingFaqItem.createMany.mockResolvedValue({ count: 0 })
    db.lodgingPhoto.updateMany.mockResolvedValue({ count: 0 })
  })

  it('checks global conflicts without excluding soft-deleted rows and excludes only this lodging', async () => {
    db.lodgingPublicProfile.findFirst.mockImplementation(async ({ where }) =>
      where.slug === 'chalet-hygge' ? { id: 'soft-deleted-profile' } : null,
    )

    await saveOwnerPublicProfile('owner-1', 'lodging-1', input)

    expect(db.lodgingPublicProfile.findFirst).toHaveBeenNthCalledWith(1, {
      where: {
        slug: 'chalet-hygge',
        lodging_id: { not: 'lodging-1' },
      },
      select: { id: true },
    })
    expect(db.lodgingPublicProfile.findFirst).toHaveBeenNthCalledWith(2, {
      where: {
        slug: 'chalet-hygge-annecy',
        lodging_id: { not: 'lodging-1' },
      },
      select: { id: true },
    })
    expect(db.lodgingPublicProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: expect.objectContaining({ slug: 'chalet-hygge-annecy' }),
        update: expect.objectContaining({ slug: 'chalet-hygge-annecy' }),
      }),
    )
  })

  it('keeps a currently published slug after a title change', async () => {
    db.lodgingPublicProfile.findUnique
      .mockResolvedValueOnce({
        slug: 'historic-public-url',
        publication_status: 'published',
        published_at: null,
      })
      .mockResolvedValueOnce(null)

    await saveOwnerPublicProfile('owner-1', 'lodging-1', input)

    expect(db.lodgingPublicProfile.findFirst).not.toHaveBeenCalled()
    expect(db.lodgingPublicProfile.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        update: expect.objectContaining({ slug: 'historic-public-url' }),
      }),
    )
  })

  it.each(['draft', 'archived'] as const)(
    'keeps a previously published slug when its current status is %s',
    async (publicationStatus) => {
      db.lodgingPublicProfile.findUnique
        .mockResolvedValueOnce({
          slug: 'permanent-public-url',
          publication_status: publicationStatus,
          published_at: new Date('2026-08-20T12:00:00.000Z'),
        })
        .mockResolvedValueOnce(null)

      await saveOwnerPublicProfile('owner-1', 'lodging-1', input)

      expect(db.lodgingPublicProfile.findFirst).not.toHaveBeenCalled()
      expect(db.lodgingPublicProfile.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          update: expect.objectContaining({ slug: 'permanent-public-url' }),
        }),
      )
    },
  )
})
