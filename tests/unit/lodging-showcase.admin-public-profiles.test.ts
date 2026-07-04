const mockFindManyLodgings = jest.fn()
const mockFindManyProfiles = jest.fn()
const mockFindFirstProfile = jest.fn()
const mockUpdateProfile = jest.fn()

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodging: {
      findMany: (...args: unknown[]) => mockFindManyLodgings(...args),
    },
    lodgingPublicProfile: {
      findMany: (...args: unknown[]) => mockFindManyProfiles(...args),
      findFirst: (...args: unknown[]) => mockFindFirstProfile(...args),
      update: (...args: unknown[]) => mockUpdateProfile(...args),
    },
  },
}))

import { listAdminLodgingProfiles } from '@/features/lodging-showcase/queries/admin-public-profiles'

describe('028 lodging showcase admin public profiles query', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockFindManyProfiles.mockResolvedValue([])
  })

  it('AC-06-01: includes active lodgings without public profile as draft rows', async () => {
    mockFindManyLodgings.mockResolvedValue([
      {
        id: 'lodging-1',
        name: 'Le 305',
        updated_at: new Date('2026-07-04T08:00:00.000Z'),
        owner: {
          id: 'owner-1',
          email: 'owner@example.test',
        },
        city: {
          id: 'city-1',
          name: 'Saint-Gervais-les-Bains',
          slug: 'saint-gervais-les-bains',
        },
        public_profile: null,
      },
    ])

    const rows = await listAdminLodgingProfiles()

    expect(mockFindManyLodgings).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        deleted_at: null,
        is_active: true,
        city: expect.objectContaining({
          deleted_at: null,
          is_active: true,
        }),
      }),
    }))
    expect(rows).toEqual([
      expect.objectContaining({
        id: 'lodging-1',
        profile_id: null,
        publication_status: 'draft',
        title: 'Le 305',
        lodging: expect.objectContaining({
          id: 'lodging-1',
          name: 'Le 305',
        }),
        city: expect.objectContaining({
          id: 'city-1',
          name: 'Saint-Gervais-les-Bains',
        }),
        photos_count: 0,
        updated_at: '2026-07-04T08:00:00.000Z',
      }),
    ])
  })
})
