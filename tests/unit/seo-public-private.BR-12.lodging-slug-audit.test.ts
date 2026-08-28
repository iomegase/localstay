import {
  findLodgingSlugCollisions,
  type AuditedLodgingSlug,
} from '@/features/lodging-showcase/lib/slug'

describe('042 SEO public/private architecture BR-12 lodging slug audit', () => {
  it('returns only deterministic duplicate groups and keeps soft-deleted profiles', () => {
    const rows: AuditedLodgingSlug[] = [
      {
        id: 'profile-b',
        slug: 'chalet-hygge',
        citySlug: 'chamonix',
        deletedAt: '2026-08-27T12:00:00.000Z',
      },
      {
        id: 'profile-c',
        slug: 'studio-centre',
        citySlug: 'annecy',
        deletedAt: null,
      },
      {
        id: 'profile-a',
        slug: 'chalet-hygge',
        citySlug: 'annecy',
        deletedAt: null,
      },
    ]
    const originalRows = rows.map((row) => ({ ...row }))

    expect(findLodgingSlugCollisions(rows)).toEqual([
      {
        slug: 'chalet-hygge',
        profiles: [
          {
            id: 'profile-a',
            slug: 'chalet-hygge',
            citySlug: 'annecy',
            deletedAt: null,
          },
          {
            id: 'profile-b',
            slug: 'chalet-hygge',
            citySlug: 'chamonix',
            deletedAt: '2026-08-27T12:00:00.000Z',
          },
        ],
      },
    ])
    expect(rows).toEqual(originalRows)
  })
})
