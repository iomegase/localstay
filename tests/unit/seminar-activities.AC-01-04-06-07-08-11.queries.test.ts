import { revalidatePath } from 'next/cache'
import { prisma } from '@/shared/lib/prisma'
import {
  createSeminarActivity,
  deleteSeminarActivity,
  listSeminarActivitiesForAdmin,
  reorderSeminarSurface,
  searchProviderPois,
  setSeminarActivityPlacements,
  setSeminarActivityProviders,
  updateSeminarActivity,
} from '@/features/seminar-activities/queries/admin'

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))
jest.mock('@/features/local-seo/queries/landing-pages', () => ({ listPublishedLocalLandingSummaries: jest.fn().mockResolvedValue([]) }))
jest.mock('@/shared/lib/prisma', () => {
  const client = {
    seminarActivity: { findMany: jest.fn(), findFirst: jest.fn(), findUnique: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    seminarActivityProvider: { findMany: jest.fn(), upsert: jest.fn(), updateMany: jest.fn() },
    seminarActivityPlacement: { findMany: jest.fn(), aggregate: jest.fn(), create: jest.fn(), update: jest.fn(), updateMany: jest.fn() },
    pointOfInterest: { count: jest.fn(), findMany: jest.fn() },
    localLandingDestination: { count: jest.fn() },
    $transaction: jest.fn(),
  }
  return { prisma: client }
})

const db = jest.mocked(prisma, { shallow: false })
const ID = '5188960d-3b52-4b5c-b613-b7cfcf299a79'
const DEST = 'b6f3b1f0-1111-4a4a-9c9c-000000000001'
const POI = 'c7a0e2d1-2222-4b4b-8d8d-000000000002'

function row(overrides: Record<string, unknown> = {}) {
  return {
    id: ID, slug: 'rafting', title: 'Rafting', category: 'SUMMER', description: 'Eaux vives', season_label: 'Été', level_label: 'Sportif',
    is_published: false, image_url: null, price_per_person_cents: 4500, price_per_group_cents: null, internal_notes: null,
    providers: [], placements: [], ...overrides,
  }
}

beforeEach(() => {
  jest.clearAllMocks()
  ;(db.$transaction as jest.Mock).mockImplementation(async (fn: (tx: typeof prisma) => Promise<unknown>) => fn(prisma))
  ;(db.seminarActivity.findFirst as jest.Mock).mockResolvedValue(row())
})

describe('spec 097 AC-01 — catalogue', () => {
  it('trie par catégorie du menu puis par titre et aplatit les prestataires', async () => {
    ;(db.seminarActivity.findMany as jest.Mock).mockResolvedValue([
      row({ id: 'b', title: 'Yoga', category: 'WELLBEING' }),
      row({ id: 'c', title: 'Biathlon', category: 'TEAM_BUILDING', providers: [{ poi_id: POI, notes: 'Tél. Marc', poi: { name: 'ESF', deleted_at: new Date(), city: { name: 'Saint-Gervais' } } }] }),
      row({ id: 'a', title: 'Atelier', category: 'TEAM_BUILDING' }),
    ])
    const items = await listSeminarActivitiesForAdmin()
    expect(items.map(item => item.id)).toEqual(['a', 'c', 'b'])
    expect(items[1]!.providers).toEqual([{ poi_id: POI, poi_name: 'ESF', city_name: 'Saint-Gervais', poi_deleted: true, notes: 'Tél. Marc' }])
    expect(db.seminarActivity.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: { deleted_at: null } }))
  })

  it('crée une activité non publiée avec un slug stable et revalide les surfaces (AC-11)', async () => {
    ;(db.seminarActivity.findUnique as jest.Mock).mockResolvedValue(null)
    ;(db.seminarActivity.create as jest.Mock).mockResolvedValue(row({ slug: 'murder-party-au-chalet' }))
    await createSeminarActivity({ title: 'Murder Party au chalet', category: 'TEAM_BUILDING', description: 'Enquête', season_label: 'Toute l’année', level_label: 'Tous niveaux' })
    expect(db.seminarActivity.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({ slug: 'murder-party-au-chalet', price_per_person_cents: null, price_per_group_cents: null }),
    }))
    expect(db.seminarActivity.create.mock.calls[0]![0].data).not.toHaveProperty('is_published')
    expect(revalidatePath).toHaveBeenCalledWith('/seminaires', 'page')
    expect(revalidatePath).toHaveBeenCalledWith('/seminaires/[city-slug]', 'page')
  })

  it('refuse un slug déjà pris, même par une activité supprimée', async () => {
    ;(db.seminarActivity.findUnique as jest.Mock).mockResolvedValue({ id: 'old' })
    await expect(createSeminarActivity({ title: 'Rafting', category: 'SUMMER', description: 'x', season_label: 'Été', level_label: 'Sportif' }))
      .rejects.toMatchObject({ code: 'SLUG_CONFLICT', status: 409 })
    expect(db.seminarActivity.create).not.toHaveBeenCalled()
  })

  it('supprime en douceur l’activité, ses attributions et ses prestataires', async () => {
    ;(db.seminarActivity.updateMany as jest.Mock).mockResolvedValue({ count: 1 })
    await deleteSeminarActivity(ID)
    expect(db.seminarActivity.updateMany).toHaveBeenCalledWith({ where: { id: ID, deleted_at: null }, data: { deleted_at: expect.any(Date), is_published: false } })
    expect(db.seminarActivityPlacement.updateMany).toHaveBeenCalledWith({ where: { activity_id: ID, deleted_at: null }, data: { deleted_at: expect.any(Date) } })
    expect(db.seminarActivityProvider.updateMany).toHaveBeenCalledWith({ where: { activity_id: ID, deleted_at: null }, data: { deleted_at: expect.any(Date) } })
  })

  it('renvoie 404 pour une activité absente ou supprimée', async () => {
    ;(db.seminarActivity.updateMany as jest.Mock).mockResolvedValue({ count: 0 })
    await expect(deleteSeminarActivity(ID)).rejects.toMatchObject({ code: 'SEMINAR_ACTIVITY_NOT_FOUND', status: 404 })
  })
})

describe('spec 097 AC-04 — publication', () => {
  it('refuse la publication sans image', async () => {
    await expect(updateSeminarActivity(ID, { is_published: true })).rejects.toMatchObject({ code: 'IMAGE_REQUIRED', status: 422 })
    expect(db.seminarActivity.update).not.toHaveBeenCalled()
  })

  it('publie une activité illustrée', async () => {
    ;(db.seminarActivity.findFirst as jest.Mock).mockResolvedValue({ image_url: 'https://cdn/rafting.webp' })
    ;(db.seminarActivity.update as jest.Mock).mockResolvedValue(row({ is_published: true, image_url: 'https://cdn/rafting.webp' }))
    expect((await updateSeminarActivity(ID, { is_published: true })).is_published).toBe(true)
  })
})

describe('spec 097 AC-06 — prestataires', () => {
  it('ajoute, restaure et retire des liens ; seul un nouveau POI est vérifié', async () => {
    const kept = 'd0000000-0000-4000-8000-000000000003'
    const removed = 'e0000000-0000-4000-8000-000000000004'
    ;(db.seminarActivityProvider.findMany as jest.Mock).mockResolvedValue([
      { poi_id: kept, deleted_at: null },
      { poi_id: removed, deleted_at: null },
    ])
    ;(db.pointOfInterest.count as jest.Mock).mockResolvedValue(1)
    await setSeminarActivityProviders(ID, { providers: [{ poi_id: kept, notes: 'Contact' }, { poi_id: POI }] })
    expect(db.pointOfInterest.count).toHaveBeenCalledWith({ where: { id: { in: [POI] }, deleted_at: null } })
    expect(db.seminarActivityProvider.upsert).toHaveBeenCalledWith({
      where: { activity_id_poi_id: { activity_id: ID, poi_id: POI } },
      update: { deleted_at: null, notes: null },
      create: { activity_id: ID, poi_id: POI, notes: null },
    })
    expect(db.seminarActivityProvider.updateMany).toHaveBeenCalledWith({
      where: { activity_id: ID, poi_id: { in: [removed] }, deleted_at: null }, data: { deleted_at: expect.any(Date) },
    })
  })

  it('refuse l’ajout d’un POI supprimé ou absent', async () => {
    ;(db.seminarActivityProvider.findMany as jest.Mock).mockResolvedValue([])
    ;(db.pointOfInterest.count as jest.Mock).mockResolvedValue(0)
    await expect(setSeminarActivityProviders(ID, { providers: [{ poi_id: POI }] })).rejects.toMatchObject({ code: 'POI_NOT_FOUND', status: 422 })
    expect(db.seminarActivityProvider.upsert).not.toHaveBeenCalled()
  })

  it('recherche les POI non supprimés par nom, toutes villes, 20 au plus', async () => {
    ;(db.pointOfInterest.findMany as jest.Mock).mockResolvedValue([{ id: POI, name: 'ESF Saint-Gervais', city: { name: 'Saint-Gervais' } }])
    expect(await searchProviderPois('esf')).toEqual([{ poi_id: POI, poi_name: 'ESF Saint-Gervais', city_name: 'Saint-Gervais' }])
    expect(db.pointOfInterest.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: { deleted_at: null, name: { contains: 'esf', mode: 'insensitive' } }, take: 20,
    }))
  })
})

describe('spec 097 AC-07 — attributions par surface', () => {
  it('crée le hub en dernière position, restaure une landing et retire les autres', async () => {
    const other = 'f0000000-0000-4000-8000-000000000005'
    ;(db.localLandingDestination.count as jest.Mock).mockResolvedValue(1)
    ;(db.seminarActivityPlacement.findMany as jest.Mock).mockResolvedValue([
      { id: 'restored', surface_key: DEST, deleted_at: new Date() },
      { id: 'removed', surface_key: other, deleted_at: null },
    ])
    ;(db.seminarActivityPlacement.aggregate as jest.Mock).mockResolvedValueOnce({ _max: { position: 4 } }).mockResolvedValueOnce({ _max: { position: null } })
    await setSeminarActivityPlacements(ID, { include_hub: true, destination_ids: [DEST] })
    expect(db.seminarActivityPlacement.create).toHaveBeenCalledWith({ data: { activity_id: ID, surface_key: 'hub', destination_id: null, position: 5 } })
    expect(db.seminarActivityPlacement.update).toHaveBeenCalledWith({ where: { id: 'restored' }, data: { deleted_at: null, position: 0 } })
    expect(db.seminarActivityPlacement.updateMany).toHaveBeenCalledWith({ where: { id: { in: ['removed'] } }, data: { deleted_at: expect.any(Date) } })
    expect(revalidatePath).toHaveBeenCalledWith('/seminaires/[city-slug]', 'page')
  })

  it('l’attribution au hub ne crée aucune attribution de landing', async () => {
    ;(db.seminarActivityPlacement.findMany as jest.Mock).mockResolvedValue([])
    ;(db.seminarActivityPlacement.aggregate as jest.Mock).mockResolvedValue({ _max: { position: null } })
    await setSeminarActivityPlacements(ID, { include_hub: true, destination_ids: [] })
    expect(db.seminarActivityPlacement.create).toHaveBeenCalledTimes(1)
    expect(db.localLandingDestination.count).not.toHaveBeenCalled()
  })

  it('refuse une destination absente ou supprimée', async () => {
    ;(db.localLandingDestination.count as jest.Mock).mockResolvedValue(0)
    await expect(setSeminarActivityPlacements(ID, { include_hub: false, destination_ids: [DEST] }))
      .rejects.toMatchObject({ code: 'DESTINATION_NOT_FOUND', status: 422 })
    expect(db.seminarActivityPlacement.create).not.toHaveBeenCalled()
  })
})

describe('spec 097 AC-08 — ordre par surface', () => {
  const second = 'a0000000-0000-4000-8000-000000000006'

  it('enregistre les positions dans l’ordre reçu', async () => {
    ;(db.seminarActivityPlacement.findMany as jest.Mock).mockResolvedValue([
      { id: 'p1', activity_id: ID },
      { id: 'p2', activity_id: second },
    ])
    await reorderSeminarSurface({ surface_key: 'hub', activity_ids: [second, ID] })
    expect(db.seminarActivityPlacement.update).toHaveBeenNthCalledWith(1, { where: { id: 'p2' }, data: { position: 0 } })
    expect(db.seminarActivityPlacement.update).toHaveBeenNthCalledWith(2, { where: { id: 'p1' }, data: { position: 1 } })
  })

  it.each([
    [[ID]],
    [[ID, ID]],
    [[ID, 'b0000000-0000-4000-8000-000000000007']],
  ])('refuse une liste incohérente %p', async ids => {
    ;(db.seminarActivityPlacement.findMany as jest.Mock).mockResolvedValue([
      { id: 'p1', activity_id: ID },
      { id: 'p2', activity_id: second },
    ])
    await expect(reorderSeminarSurface({ surface_key: 'hub', activity_ids: ids })).rejects.toMatchObject({ code: 'PLACEMENT_MISMATCH' })
    expect(db.seminarActivityPlacement.update).not.toHaveBeenCalled()
  })
})
