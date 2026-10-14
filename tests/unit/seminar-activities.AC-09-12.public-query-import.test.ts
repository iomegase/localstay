import { prisma } from '@/shared/lib/prisma'
import { listPublicSeminarActivities } from '@/features/seminar-activities/queries/public'
import { importSeminarActivityCatalog } from '@/features/seminar-activities/services/import-catalog'
import { SEMINAR_ACTIVITY_CATALOG } from '@/features/seminar-activities/lib/catalog'
import { SEMINAR_ACTIVITY_CATEGORIES } from '@/features/seminar-activities/types'

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    seminarActivityPlacement: { findMany: jest.fn() },
    seminarActivity: { findMany: jest.fn(), createMany: jest.fn() },
  },
}))
const db = jest.mocked(prisma, { shallow: false })
beforeEach(() => jest.clearAllMocks())

describe('spec 097 AC-09 — lecture publique', () => {
  it.each([[null, 'hub'], ['dest-1', 'dest-1']])('surface %p : publiées, illustrées, non supprimées, triées par position', async (destination, surfaceKey) => {
    ;(db.seminarActivityPlacement.findMany as jest.Mock).mockResolvedValue([
      { activity: { id: 'a1', title: 'Rafting', category: 'SUMMER', description: 'd', season_label: 's', level_label: 'l', image_url: 'https://cdn/a.webp' } },
    ])
    expect(await listPublicSeminarActivities(destination)).toEqual([
      { id: 'a1', title: 'Rafting', category: 'SUMMER', description: 'd', season_label: 's', level_label: 'l', image_url: 'https://cdn/a.webp' },
    ])
    const args = (db.seminarActivityPlacement.findMany as jest.Mock).mock.calls[0][0]
    expect(args.where).toEqual({
      surface_key: surfaceKey,
      deleted_at: null,
      activity: { deleted_at: null, is_published: true, image_url: { not: null } },
    })
    expect(args.orderBy).toEqual([{ position: 'asc' }, { id: 'asc' }])
    // BR-02 : jamais de prix, notes ni prestataires dans la sélection publique.
    expect(Object.keys(args.select.activity.select)).toEqual(['id', 'title', 'category', 'description', 'season_label', 'level_label', 'image_url'])
  })
})

describe('spec 097 AC-12 — import du catalogue', () => {
  it('contient les 42 activités réparties dans les 6 catégories, slugs uniques', () => {
    expect(SEMINAR_ACTIVITY_CATALOG).toHaveLength(42)
    const counts = SEMINAR_ACTIVITY_CATEGORIES.map(category => SEMINAR_ACTIVITY_CATALOG.filter(item => item.category === category).length)
    expect(counts).toEqual([8, 8, 8, 5, 6, 7])
  })

  it('crée uniquement les activités absentes, non publiées et sans image, prix ni attribution', async () => {
    ;(db.seminarActivity.findMany as jest.Mock).mockResolvedValue([{ slug: 'olympiades-en-montagne' }])
    const result = await importSeminarActivityCatalog()
    expect(result.created).toHaveLength(41)
    expect(result.skipped).toEqual(['Olympiades en montagne'])
    const data = (db.seminarActivity.createMany as jest.Mock).mock.calls[0][0].data as Array<Record<string, unknown>>
    expect(data).toHaveLength(41)
    expect(data[0]).toEqual({
      category: 'TEAM_BUILDING',
      title: 'Challenge d’orientation',
      slug: 'challenge-d-orientation',
      description: expect.any(String),
      season_label: 'Printemps, été, automne',
      level_label: 'Accessible',
    })
  })

  it('est idempotent et n’écrit rien en simulation', async () => {
    ;(db.seminarActivity.findMany as jest.Mock).mockResolvedValue([])
    expect((await importSeminarActivityCatalog(undefined, { dryRun: true })).created).toHaveLength(42)
    expect(db.seminarActivity.createMany).not.toHaveBeenCalled()
    // Seconde exécution : tout existe déjà, rien n'est créé.
    const { seminarActivitySlug } = jest.requireActual('@/features/seminar-activities/lib/slug')
    ;(db.seminarActivity.findMany as jest.Mock).mockResolvedValue(SEMINAR_ACTIVITY_CATALOG.map(item => ({ slug: seminarActivitySlug(item.title) })))
    expect(await importSeminarActivityCatalog()).toMatchObject({ created: [] })
    expect(db.seminarActivity.createMany).not.toHaveBeenCalled()
  })
})
