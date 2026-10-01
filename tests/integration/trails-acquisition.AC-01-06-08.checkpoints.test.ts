const mockCollect = jest.fn()
const mockDb = {
  city: { findFirst: jest.fn() },
  trailImportRun: { create: jest.fn(), updateMany: jest.fn(), findFirst: jest.fn(), findMany: jest.fn() },
  trailCandidate: { create: jest.fn(), updateMany: jest.fn(), count: jest.fn() },
  trailAuditLog: { create: jest.fn() },
  $transaction: jest.fn(),
}
jest.mock('@/shared/lib/prisma', () => ({ get prisma() { return mockDb } }))
jest.mock('@/features/trails-acquisition/services/run-orchestrator', () => ({ collectTrailCandidatesFromSources: (...args: unknown[]) => mockCollect(...args) }))
import { createTrailImportRun, recoverStaleTrailImportRuns } from '@/features/trails-acquisition/queries/runs'
import type { RunSourceResult } from '@/features/trails-acquisition/services/run-orchestrator'

const candidate = { primary_source_type: 'overpass' as const, source_refs: [], raw_payload: {}, title: 'Mont Joly', description: null }
const result: RunSourceResult = { candidates: [candidate], source_errors: {} }
beforeEach(() => {
  jest.clearAllMocks()
  mockDb.$transaction.mockImplementation(fn => fn(mockDb))
  mockDb.city.findFirst.mockResolvedValue({ id: 'city', name: 'Combloux', latitude: 45, longitude: 6 })
  mockDb.trailImportRun.create.mockResolvedValue({ id: 'run' })
  mockDb.trailImportRun.updateMany.mockResolvedValue({ count: 1 })
  mockDb.trailImportRun.findMany.mockResolvedValue([])
  mockDb.trailImportRun.findFirst.mockResolvedValue({ id: 'run', status: 'completed', source_types: [], source_errors: null, city: { name: 'Combloux' }, candidates: [] })
  mockDb.trailCandidate.create.mockResolvedValue({ id: 'candidate' })
  mockDb.trailCandidate.updateMany.mockResolvedValue({ count: 1 })
  mockDb.trailCandidate.count.mockResolvedValue(1)
})
it('persists discovery before collection finishes and reuses IDs with optimistic protection', async () => {
  mockCollect.mockImplementation(async (_input: unknown, checkpoint: (snapshot: RunSourceResult) => Promise<void>) => {
    await checkpoint(result)
    expect(mockDb.trailCandidate.create).toHaveBeenCalledTimes(1)
    const enriched = { ...result, candidates: [{ ...candidate, description: 'Description enrichie' }] }
    await checkpoint(enriched)
    return enriched
  })
  await createTrailImportRun({ city_id: 'city', source_types: ['overpass'] }, 'admin')
  expect(mockDb.trailCandidate.create).toHaveBeenCalledTimes(1)
  expect(mockDb.trailCandidate.updateMany).toHaveBeenCalledWith(expect.objectContaining({
    where: { id: 'candidate', run_id: 'run', deleted_at: null, review_status: 'needs_review', updated_at: expect.any(Date) },
    data: expect.objectContaining({ description: 'Description enrichie' }),
  }))
  expect(mockDb.trailImportRun.updateMany).toHaveBeenLastCalledWith(expect.objectContaining({ data: expect.objectContaining({ status: 'completed', error: null }) }))
})
it.each([0, 1])('closes an unexpected failure and preserves %i stored candidates', async count => {
  jest.spyOn(console, 'error').mockImplementation(() => {})
  mockCollect.mockRejectedValue(new Error('DB or provider error'))
  mockDb.trailCandidate.count.mockResolvedValue(count)
  await createTrailImportRun({ city_id: 'city', source_types: ['overpass'] }, 'admin')
  expect(mockDb.trailImportRun.updateMany).toHaveBeenCalledWith(expect.objectContaining({
    data: expect.objectContaining({ status: count ? 'partial_success' : 'failed', error: expect.stringContaining('Import interrompu') }),
  }))
  jest.restoreAllMocks()
})
it.each([0, 3])('recovers a stale run with %i candidates without deleting anything', async count => {
  const updated_at = new Date(Date.now() - 11 * 60_000)
  mockDb.trailImportRun.findMany.mockResolvedValue([{ id: 'old-run', updated_at, source_errors: { ign: 'timeout' } }])
  mockDb.trailCandidate.count.mockResolvedValue(count)
  expect(await recoverStaleTrailImportRuns()).toBe(1)
  expect(mockDb.trailImportRun.findMany).toHaveBeenCalledWith(expect.objectContaining({ where: expect.objectContaining({ status: 'running', deleted_at: null, updated_at: { lt: expect.any(Date) } }) }))
  expect(mockDb.trailImportRun.updateMany).toHaveBeenCalledWith({
    where: { id: 'old-run', status: 'running', deleted_at: null, updated_at },
    data: expect.objectContaining({ status: count ? 'partial_success' : 'failed', source_errors: { ign: 'timeout', pipeline: 'IMPORT_INTERRUPTED' } }),
  })
  expect(mockDb.trailCandidate.updateMany).not.toHaveBeenCalled()
})
it('does not claim recovery if a concurrent checkpoint already advanced the timestamp', async () => {
  mockDb.trailImportRun.findMany.mockResolvedValue([{ id: 'run', updated_at: new Date(0), source_errors: null }])
  mockDb.trailImportRun.updateMany.mockResolvedValue({ count: 0 })
  expect(await recoverStaleTrailImportRuns()).toBe(0)
})
