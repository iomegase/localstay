jest.mock('@/shared/lib/serializable-transaction', () => ({
  runSerializableTransaction: (callback: (tx: unknown) => unknown) => callback(mockTx),
}))

const mockFindFirst = jest.fn()
const mockUpdate = jest.fn()
const mockAuditCreate = jest.fn()
const mockTx = {
  pointOfInterest: { findFirst: mockFindFirst, update: mockUpdate },
  poiAcquisitionAuditLog: { create: mockAuditCreate },
}

import { runPoiMutationWithDiscoveryReconciliation } from '@/features/public-discovery/queries/mutation-reconciliation'

// Spec 065 AC-03-05 : la perte de la dernière photo ne dépublie plus une fiche dont
// la description fait au moins 150 caractères.
function publishedPoi(photos: string[], description: string) {
  return {
    id: 'poi-1',
    slug: 'blanc-sport',
    description,
    address: 'Adresse',
    latitude: 45.89,
    longitude: 6.71,
    phone: '+33450000000',
    website: null,
    photos,
    is_active: true,
    deleted_at: null,
    geocode_status: 'success',
    discovery_status: 'PUBLISHED',
    discovery_published_at: new Date('2026-10-01T00:00:00.000Z'),
    city: { id: 'city-1', slug: 'saint-gervais', is_active: true, deleted_at: null },
    category: { id: 'cat-1', slug: 'shopping', is_active: true, deleted_at: null },
    subcategory: null,
  }
}

const auditActor = { type: 'SYSTEM' } as const

describe('065 AC-03-05 — perte de photo', () => {
  beforeEach(() => jest.clearAllMocks())

  it('garde publiée une fiche sans photo dont la description est assez longue', async () => {
    const description = 'a'.repeat(150)
    mockFindFirst
      .mockResolvedValueOnce(publishedPoi(['https://example.com/a.jpg'], description))
      .mockResolvedValueOnce(publishedPoi([], description))

    await runPoiMutationWithDiscoveryReconciliation({
      poiWhere: { id: 'poi-1' },
      auditActor,
      cause: { source: 'photo-healer', reason: 'dead_link' },
      mutate: async () => undefined,
    })

    expect(mockUpdate).not.toHaveBeenCalled()
  })

  it('dépublie toujours une fiche sans photo à la description courte', async () => {
    const description = 'Courte description.'
    mockFindFirst
      .mockResolvedValueOnce(publishedPoi(['https://example.com/a.jpg'], description))
      .mockResolvedValueOnce(publishedPoi([], description))
    mockUpdate.mockResolvedValueOnce({ discovery_status: 'DRAFT', discovery_published_at: null })

    await runPoiMutationWithDiscoveryReconciliation({
      poiWhere: { id: 'poi-1' },
      auditActor,
      cause: { source: 'photo-healer', reason: 'dead_link' },
      mutate: async () => undefined,
    })

    expect(mockUpdate).toHaveBeenCalledWith(expect.objectContaining({
      data: { discovery_status: 'DRAFT', discovery_published_at: null },
    }))
  })
})
