const mockPoiFindFirst = jest.fn()
const mockTrailUpdate = jest.fn()
jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    pointOfInterest: { findFirst: (...args: unknown[]) => mockPoiFindFirst(...args) },
    $transaction: async (fn: (tx: unknown) => unknown) => fn({
      trailDetail: { update: (...args: unknown[]) => mockTrailUpdate(...args) },
      poiAcquisitionAuditLog: { create: jest.fn() },
    }),
  },
}))

import { updateTrailDetailFromGpx } from '@/features/admin-pois/queries/trail-detail-gpx'

/** GPX de `count` points, espacés de `stepDeg` degrés de latitude (~111 m pour 0.001). */
function gpx(count: number, stepDeg: number): string {
  const points = Array.from({ length: count }, (_, i) => `<trkpt lat="${(45.7 + i * stepDeg).toFixed(6)}" lon="6.8"></trkpt>`).join('')
  return `<?xml version="1.0"?><gpx><trk><trkseg>${points}</trkseg></trk></gpx>`
}

// 2026-10-17 — un GPX importé sur une randonnée existante recalcule la qualité du tracé.
describe('updateTrailDetailFromGpx — qualité du tracé', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockPoiFindFirst.mockResolvedValue({
      id: 'poi-1', category: { slug: 'rando' },
      trail_detail: { id: 'td-1', distance_km: 16.3, source_refs: [{ type: 'camptocamp', attribution: 'Camptocamp.org', used_for: ['geometry'] }], deleted_at: null },
    })
    mockTrailUpdate.mockResolvedValue({ id: 'td-1', distance_km: 16.3, start_latitude: 45.7, start_longitude: 6.8 })
  })

  it('un tracé dense et sans saut devient « complete »', async () => {
    await updateTrailDetailFromGpx('poi-1', 'admin-1', { name: 'propre.gpx', content: gpx(150, 0.001) })
    expect(mockTrailUpdate.mock.calls[0][0].data.data_quality_status).toBe('complete')
  })

  it('un tracé avec un saut de plus de 350 m reste « indicative »', async () => {
    const jumpy = gpx(150, 0.001).replace('</trkseg>', '<trkpt lat="45.86" lon="6.8"></trkpt></trkseg>')
    await updateTrailDetailFromGpx('poi-1', 'admin-1', { name: 'saut.gpx', content: jumpy })
    expect(mockTrailUpdate.mock.calls[0][0].data.data_quality_status).toBe('indicative')
  })
})
