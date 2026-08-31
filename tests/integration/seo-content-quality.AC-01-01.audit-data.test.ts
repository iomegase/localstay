const mockPoiFindMany = jest.fn()
const mockPoiCreate = jest.fn()
const mockPoiUpdate = jest.fn()
const mockPoiUpsert = jest.fn()
const mockPoiDelete = jest.fn()
const mockPoiDeleteMany = jest.fn()
const mockLodgingFindMany = jest.fn()

jest.mock('server-only', () => ({}), { virtual: true })

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    pointOfInterest: {
      findMany: (...args: unknown[]) => mockPoiFindMany(...args),
      create: (...args: unknown[]) => mockPoiCreate(...args),
      update: (...args: unknown[]) => mockPoiUpdate(...args),
      upsert: (...args: unknown[]) => mockPoiUpsert(...args),
      delete: (...args: unknown[]) => mockPoiDelete(...args),
      deleteMany: (...args: unknown[]) => mockPoiDeleteMany(...args),
    },
    lodgingPublicProfile: {
      findMany: (...args: unknown[]) => mockLodgingFindMany(...args),
    },
  },
}))

import {
  getPublicLodgingAuditRows,
  getPublicPoiAuditRows,
} from '@/features/seo-content-audit/queries/audit-data'

function eligiblePoi(overrides: Record<string, unknown> = {}) {
  return {
    id: 'poi-1',
    name: 'Le Sérac',
    slug: 'le-serac',
    description:
      'Une table de montagne chaleureuse qui cuisine des produits locaux et accueille les visiteurs toute l’année.',
    updated_at: new Date('2026-08-20T10:00:00.000Z'),
    address: '1 rue du Mont-Blanc',
    latitude: 45.8921,
    longitude: 6.7085,
    phone: '+33 4 50 00 00 00',
    website: null,
    photos: ['https://images.example.com/le-serac.jpg'],
    discovery_status: 'PUBLISHED',
    discovery_published_at: new Date('2026-08-18T09:00:00.000Z'),
    is_active: true,
    deleted_at: null,
    geocode_status: 'success',
    subcategory_id: null,
    city: {
      name: 'Saint-Gervais-les-Bains',
      slug: 'saint-gervais-les-bains',
      latitude: 45.8921,
      longitude: 6.7085,
      is_active: true,
      deleted_at: null,
    },
    category: {
      id: 'category-1',
      name: 'Restaurants',
      slug: 'restaurants',
      is_active: true,
      deleted_at: null,
    },
    subcategory: null,
    acquisition_candidates_published: [
      {
        source: 'google_places',
        description: 'Texte brut de provenance qui ne doit pas être recopié dans le rapport.',
        website: 'https://restaurant.example.com/source',
        run: { source: 'google_places' },
      },
    ],
    ...overrides,
  }
}

describe('043 public audit data boundary', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPoiFindMany.mockResolvedValue([])
    mockLodgingFindMany.mockResolvedValue([])
  })

  it('reads only active published lodging profiles without selecting a private lodging id', async () => {
    await getPublicLodgingAuditRows()

    expect(mockLodgingFindMany).toHaveBeenCalledWith({
      where: {
        publication_status: 'published',
        deleted_at: null,
        city: { is_active: true, deleted_at: null },
        lodging: { is_active: true, deleted_at: null },
      },
      select: expect.objectContaining({
        id: true,
        slug: true,
        title: true,
        short_description: true,
        description: true,
        property_type: true,
        max_guests: true,
        bedroom_count: true,
        bathroom_count: true,
        bed_count: true,
        surface_m2: true,
        public_area_label: true,
        updated_at: true,
        city: { select: { name: true, region: true } },
        amenities: {
          where: { deleted_at: null },
          orderBy: [{ sort_order: 'asc' }, { created_at: 'asc' }],
          select: { code: true, label: true, availability: true },
        },
      }),
    })

    expect(JSON.stringify(mockLodgingFindMany.mock.calls[0][0].select)).not.toContain(
      'lodging_id',
    )
  })

  it('maps the public lodging profile id and visible facts only', async () => {
    mockLodgingFindMany.mockResolvedValue([
      {
        id: 'profile-1',
        slug: 'chalet-hygge',
        title: 'Chalet Hygge',
        short_description: 'Un chalet lumineux.',
        description: '70 m² pour 6 voyageurs.',
        property_type: 'Chalet',
        max_guests: 6,
        bedroom_count: 3,
        bathroom_count: 2,
        bed_count: 4,
        surface_m2: 70,
        public_area_label: 'Annecy-le-Vieux',
        precise_location_public: false,
        public_latitude: null,
        public_longitude: null,
        updated_at: new Date('2026-08-21T10:00:00.000Z'),
        city: { name: 'Annecy', region: 'Auvergne-Rhône-Alpes' },
        photos: [],
        amenities: [
          { code: 'wifi', label: 'Wi-Fi', availability: 'included' },
        ],
      },
    ])

    await expect(getPublicLodgingAuditRows()).resolves.toEqual([
      expect.objectContaining({
        id: 'profile-1',
        publicUrl: '/logements/chalet-hygge',
        updatedAt: '2026-08-21T10:00:00.000Z',
        amenities: [{ code: 'wifi', label: 'Wi-Fi', availability: 'included' }],
      }),
    ])
  })

  it('reads only eligible public POIs and the minimal acquisition provenance', async () => {
    await getPublicPoiAuditRows()

    expect(mockPoiFindMany).toHaveBeenCalledWith({
      where: {
        discovery_status: 'PUBLISHED',
        discovery_published_at: { not: null },
        is_active: true,
        deleted_at: null,
        geocode_status: 'success',
        city: { is_active: true, deleted_at: null },
        category: { is_active: true, deleted_at: null },
        OR: [
          { subcategory_id: null },
          { subcategory: { is: { is_active: true, deleted_at: null } } },
        ],
      },
      select: expect.objectContaining({
        id: true,
        name: true,
        slug: true,
        description: true,
        updated_at: true,
        city: { select: expect.objectContaining({ name: true, slug: true }) },
        category: { select: expect.objectContaining({ name: true, slug: true }) },
        acquisition_candidates_published: {
          where: { deleted_at: null },
          orderBy: [{ updated_at: 'desc' }, { id: 'asc' }],
          select: {
            source: true,
            description: true,
            website: true,
            run: { select: { source: true } },
          },
        },
      }),
    })

    const select = mockPoiFindMany.mock.calls[0][0].select
    const serialized = JSON.stringify(select)
    expect(serialized).not.toContain('lodging_id')
    expect(serialized).not.toContain('owner')
    expect(serialized).not.toContain('reviewed_by')
    expect(serialized).not.toContain('started_by')
  })

  it('applies the shared public visibility rules after the Prisma filter', async () => {
    mockPoiFindMany.mockResolvedValue([
      eligiblePoi(),
      eligiblePoi({
        id: 'poi-far',
        slug: 'trop-loin',
        longitude: 7.2,
      }),
    ])

    await expect(getPublicPoiAuditRows()).resolves.toEqual([
      {
        id: 'poi-1',
        name: 'Le Sérac',
        description: eligiblePoi().description,
        publicUrl: '/decouvrir/saint-gervais-les-bains/restaurants/le-serac',
        cityName: 'Saint-Gervais-les-Bains',
        categoryName: 'Restaurants',
        updatedAt: '2026-08-20T10:00:00.000Z',
        provenance: [
          {
            source: 'google_places',
            candidateDescriptionPresent: true,
            website: 'https://restaurant.example.com/source',
            runSource: 'google_places',
          },
        ],
      },
    ])
  })

  it('never calls a Prisma mutation while reading audit data', async () => {
    await getPublicPoiAuditRows()

    for (const mutation of [
      mockPoiCreate,
      mockPoiUpdate,
      mockPoiUpsert,
      mockPoiDelete,
      mockPoiDeleteMany,
    ]) {
      expect(mutation).not.toHaveBeenCalled()
    }
  })
})
