const mockRemove = jest.fn()
const mockPoiFindMany = jest.fn()
const mockMirrorFindMany = jest.fn()
const mockMirrorUpdateMany = jest.fn()
const mockLodgingPhotoFindMany = jest.fn()
const mockCustomizationFindMany = jest.fn()
const mockBlockFindMany = jest.fn()
const mockInstructionFindMany = jest.fn()
const mockEquipmentFindMany = jest.fn()

jest.mock('@/shared/lib/supabase', () => ({
  createSupabaseServer: () => ({ storage: { from: () => ({ remove: (...args: unknown[]) => mockRemove(...args) }) } }),
}))
jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    pointOfInterest: { findMany: (...args: unknown[]) => mockPoiFindMany(...args) },
    poiPhotoMirror: {
      findMany: (...args: unknown[]) => mockMirrorFindMany(...args),
      updateMany: (...args: unknown[]) => mockMirrorUpdateMany(...args),
    },
    lodgingPhoto: { findMany: (...args: unknown[]) => mockLodgingPhotoFindMany(...args) },
    lodgingCustomization: { findMany: (...args: unknown[]) => mockCustomizationFindMany(...args) },
    lodgingPracticalBlock: { findMany: (...args: unknown[]) => mockBlockFindMany(...args) },
    lodgingArrivalInstruction: { findMany: (...args: unknown[]) => mockInstructionFindMany(...args) },
    equipmentTemplate: { findMany: (...args: unknown[]) => mockEquipmentFindMany(...args) },
  },
}))

import { cleanablePath, removedUrls } from '@/features/storage-cleanup/lib/storage-paths'
import { loadReferencedStorageUrls } from '@/features/storage-cleanup/queries/references'
import { cleanupRemovedPoiPhotos, deleteUnreferencedFiles } from '@/features/storage-cleanup/services/delete-files'

// Spec 070 US-03 — suppression des photos retirées à l'enregistrement.
const BASE = 'https://cftqqyqfhlvobtsatxdq.supabase.co/storage/v1/object/public/guide-photos/'

function noReferences() {
  mockPoiFindMany.mockResolvedValue([])
  mockMirrorFindMany.mockResolvedValue([])
  mockLodgingPhotoFindMany.mockResolvedValue([])
  mockCustomizationFindMany.mockResolvedValue([])
  mockBlockFindMany.mockResolvedValue([])
  mockInstructionFindMany.mockResolvedValue([])
  mockEquipmentFindMany.mockResolvedValue([])
}

describe('070 — chemins du stockage', () => {
  it('ne nettoie que pois/ et lodgings/ du bucket guide-photos (BR-06 : jamais fallbacks/)', () => {
    expect(cleanablePath(`${BASE}pois/1.webp`)).toBe('pois/1.webp')
    expect(cleanablePath(`${BASE}lodgings/abc/showcase/2.webp`)).toBe('lodgings/abc/showcase/2.webp')
    expect(cleanablePath(`${BASE}fallbacks/u/3.webp`)).toBeNull()
    expect(cleanablePath(`${BASE}blog/x/4.webp`)).toBeNull()
    expect(cleanablePath('https://www.site-officiel.fr/photo.jpg')).toBeNull()
    expect(cleanablePath(`${BASE}pois/a%20b.webp`)).toBe('pois/a b.webp')
  })

  it('calcule les URL retirées entre deux versions', () => {
    expect(removedUrls(['a', 'b', 'c'], ['b', 'd'])).toEqual(['a', 'c'])
  })
})

describe('070 BR-04 — références actives', () => {
  beforeEach(() => { jest.clearAllMocks(); noReferences() })

  it('rassemble les URL de toutes les sources actives', async () => {
    mockPoiFindMany.mockResolvedValue([{ photos: ['https://origine/a.jpg', `${BASE}pois/1.webp`] }])
    mockMirrorFindMany.mockResolvedValue([
      { source_url: 'https://origine/a.jpg', storage_url: `${BASE}pois/p/a.webp` },
      { source_url: 'https://origine/retiree.jpg', storage_url: `${BASE}pois/p/old.webp` },
    ])
    mockLodgingPhotoFindMany.mockResolvedValue([{ url: `${BASE}lodgings/l/showcase/1.webp` }])
    mockCustomizationFindMany.mockResolvedValue([{ cover_photo_url: `${BASE}lodgings/l/cover.webp` }])
    mockBlockFindMany.mockResolvedValue([{ photo_url: `${BASE}lodgings/l/block.webp` }])
    mockInstructionFindMany.mockResolvedValue([{ photos: [`${BASE}lodgings/l/arrivee.webp`] }])
    // Spec 096 BR-02 : photo d'un équipement de bibliothèque.
    mockEquipmentFindMany.mockResolvedValue([{ photo_url: `${BASE}lodgings/l/equipement.webp` }])

    const urls = await loadReferencedStorageUrls()

    expect([...urls].sort()).toEqual([
      'https://origine/a.jpg',
      `${BASE}lodgings/l/arrivee.webp`,
      `${BASE}lodgings/l/block.webp`,
      `${BASE}lodgings/l/cover.webp`,
      `${BASE}lodgings/l/equipement.webp`,
      `${BASE}lodgings/l/showcase/1.webp`,
      `${BASE}pois/1.webp`,
      `${BASE}pois/p/a.webp`,
    ].sort())
    expect(mockPoiFindMany.mock.calls[0]![0].where).toEqual({ deleted_at: null })
    expect(mockMirrorFindMany.mock.calls[0]![0].where).toEqual({ deleted_at: null })
    expect(mockLodgingPhotoFindMany.mock.calls[0]![0].where).toEqual({ deleted_at: null })
  })
})

describe('070 AC-03 — suppression des fichiers inutilisés', () => {
  beforeEach(() => { jest.clearAllMocks(); noReferences(); mockRemove.mockResolvedValue({ data: [], error: null }) })

  it('supprime les fichiers retirés non référencés, garde les autres', async () => {
    mockPoiFindMany.mockResolvedValue([{ photos: [`${BASE}pois/encore-utilisee.webp`] }])

    const result = await deleteUnreferencedFiles([
      `${BASE}pois/retiree.webp`,
      `${BASE}pois/encore-utilisee.webp`,
      `${BASE}fallbacks/u/jamais.webp`,
      'https://www.site-officiel.fr/externe.jpg',
    ])

    expect(mockRemove).toHaveBeenCalledWith(['pois/retiree.webp'])
    expect(result).toEqual({ deleted: 1 })
  })

  it('AC-03-03 : un échec de suppression est journalisé, jamais propagé', async () => {
    mockRemove.mockRejectedValue(new Error('storage indisponible'))
    const spy = jest.spyOn(console, 'error').mockImplementation(() => {})

    await expect(deleteUnreferencedFiles([`${BASE}pois/retiree.webp`])).resolves.toEqual({ deleted: 0 })
    expect(spy).toHaveBeenCalled()
    spy.mockRestore()
  })

  it('AC-03-01 : photos de POI retirées → copies spec 063 retirées et fichiers supprimés', async () => {
    mockMirrorFindMany
      .mockResolvedValueOnce([{ id: 'm1', storage_url: `${BASE}pois/p/copie.webp` }])
      .mockResolvedValue([])
    mockMirrorUpdateMany.mockResolvedValue({ count: 1 })

    await cleanupRemovedPoiPhotos('poi-1', ['https://origine/retiree.jpg', `${BASE}pois/envoyee.webp`])

    expect(mockMirrorFindMany.mock.calls[0]![0].where).toEqual({
      poi_id: 'poi-1', deleted_at: null, source_url: { in: ['https://origine/retiree.jpg', `${BASE}pois/envoyee.webp`] },
    })
    expect(mockMirrorUpdateMany).toHaveBeenCalledWith({ where: { id: { in: ['m1'] } }, data: { deleted_at: expect.any(Date) } })
    expect(mockRemove).toHaveBeenCalledWith(['pois/envoyee.webp', 'pois/p/copie.webp'])
  })

  it('rien à supprimer → aucun appel au stockage', async () => {
    await cleanupRemovedPoiPhotos('poi-1', [])
    expect(mockRemove).not.toHaveBeenCalled()
  })
})
