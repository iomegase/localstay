// Spec 099 AC-01-04 / BR-01 / BR-03 : enregistrement des « Choses à savoir ».
const tx = {
  lodgingCustomization: { upsert: jest.fn() },
  lodgingFeaturedPoi: { updateMany: jest.fn(), upsert: jest.fn() },
  lodgingPracticalBlock: { findMany: jest.fn(async () => []), update: jest.fn(), updateMany: jest.fn(), create: jest.fn() },
  lodgingArrivalInstruction: { findMany: jest.fn(async () => []), update: jest.fn(), updateMany: jest.fn(), create: jest.fn() },
  lodgingThingToKnow: { findMany: jest.fn(), update: jest.fn(), updateMany: jest.fn(), create: jest.fn() },
}

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    lodging: { findFirst: jest.fn() },
    lodgingCustomization: { findFirst: jest.fn(), findUnique: jest.fn(async () => null) },
    category: { findMany: jest.fn(async () => []) },
    pointOfInterest: { findMany: jest.fn(async () => []) },
    lodgingFeaturedPoi: { findMany: jest.fn(async () => []) },
    lodgingPracticalBlock: { findMany: jest.fn(async () => []) },
    lodgingArrivalInstruction: { findMany: jest.fn(async () => []) },
    lodgingThingToKnow: { findMany: jest.fn() },
    $transaction: jest.fn(async (cb: (t: typeof tx) => unknown) => cb(tx)),
  },
}))

jest.mock('@/features/geocoding/services/mapbox-client', () => ({ geocodeAddress: jest.fn() }))

import { prisma } from '@/shared/lib/prisma'
import { saveLodgingCustomization } from '@/features/guide-customization/queries/customization'
import { normalizeThingsToKnow } from '@/features/guide-customization/lib/validation'

describe('099 AC-01-04 — normalisation', () => {
  it('retire les cartes sans titre, nettoie les textes, réindexe et limite à 5 photos', () => {
    expect(normalizeThingsToKnow([
      { id: 'tmp-1', title: '  Volets  ', body: '  ', photos: ['a', ' ', 'b', 'c', 'd', 'e', 'f'], sort_order: 9 },
      { id: 't2', title: '   ', body: 'perdu', photos: [], sort_order: 1 },
      { id: 't3', title: 'Chauffage', body: ' Relancer la chaudière. ', photos: [], sort_order: 2 },
    ])).toEqual([
      { title: 'Volets', body: null, photos: ['a', 'b', 'c', 'd', 'e'], sort_order: 0 },
      { id: 't3', title: 'Chauffage', body: 'Relancer la chaudière.', photos: [], sort_order: 1 },
    ])
  })
})

describe('099 AC-01-04 — saveLodgingCustomization', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(prisma.lodging.findFirst).mockResolvedValue({
      id: 'lodging-1', owner_id: 'owner-1', city_id: 'city-1', city: { latitude: 45, longitude: 6 },
    } as never)
    jest.mocked(prisma.lodgingCustomization.findFirst).mockResolvedValue(null)
    tx.lodgingThingToKnow.findMany.mockResolvedValue([{ id: 't1' }, { id: 't2' }])
    jest.mocked(prisma.lodgingThingToKnow.findMany).mockResolvedValue([
      { id: 't1', title: 'Volets', body: null, photos: ['a.webp'], sort_order: 0 },
    ] as never)
  })

  it('met à jour, crée et supprime en douceur, puis renvoie les cartes enregistrées', async () => {
    const result = await saveLodgingCustomization('owner-1', 'lodging-1', {
      category_order: [],
      featured_pois: [],
      things_to_know: [
        { id: 't1', title: 'Volets', body: null, photos: ['a.webp'], sort_order: 0 },
        { id: 'tmp-x', title: 'Chauffage', body: 'Relancer la chaudière.', photos: [], sort_order: 1 },
      ],
    })

    expect(tx.lodgingThingToKnow.update).toHaveBeenCalledWith({
      where: { id: 't1' },
      data: { title: 'Volets', body: null, photos: ['a.webp'], sort_order: 0 },
    })
    expect(tx.lodgingThingToKnow.create).toHaveBeenCalledWith({
      data: { lodging_id: 'lodging-1', title: 'Chauffage', body: 'Relancer la chaudière.', photos: [], sort_order: 1 },
    })
    expect(tx.lodgingThingToKnow.updateMany).toHaveBeenCalledWith({
      where: { lodging_id: 'lodging-1', deleted_at: null, id: { in: ['t2'] } },
      data: { deleted_at: expect.any(Date) },
    })
    expect(result.things_to_know).toEqual([{ id: 't1', title: 'Volets', body: null, photos: ['a.webp'], sort_order: 0 }])
  })

  it('refuse un identifiant de carte inconnu', async () => {
    await expect(saveLodgingCustomization('owner-1', 'lodging-1', {
      category_order: [],
      featured_pois: [],
      things_to_know: [{ id: 'autre-logement', title: 'Volets', body: null, photos: [], sort_order: 0 }],
    })).rejects.toMatchObject({ code: 'INVALID_CHILD_ITEM_ID' })
    expect(tx.lodgingThingToKnow.update).not.toHaveBeenCalled()
  })
})
