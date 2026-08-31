const mockGetPublicPoiAuditRows = jest.fn()
const mockGetPublicLodgingAuditRows = jest.fn()
const mockAuditPublicPois = jest.fn()
const mockAuditPublicLodgings = jest.fn()
const mockCreate = jest.fn()
const mockUpdate = jest.fn()
const mockUpsert = jest.fn()
const mockDelete = jest.fn()
const mockDeleteMany = jest.fn()
const mockExecuteRaw = jest.fn()

jest.mock('server-only', () => ({}), { virtual: true })

jest.mock('@/features/seo-content-audit/queries/audit-data', () => ({
  getPublicPoiAuditRows: (...args: unknown[]) => mockGetPublicPoiAuditRows(...args),
  getPublicLodgingAuditRows: (...args: unknown[]) => mockGetPublicLodgingAuditRows(...args),
}))

jest.mock('@/features/seo-content-audit/lib/poi-audit', () => ({
  auditPublicPois: (...args: unknown[]) => mockAuditPublicPois(...args),
}))

jest.mock('@/features/seo-content-audit/lib/lodging-audit', () => ({
  auditPublicLodgings: (...args: unknown[]) => mockAuditPublicLodgings(...args),
}))

jest.mock('@/shared/lib/prisma', () => ({
  prisma: {
    pointOfInterest: {
      create: (...args: unknown[]) => mockCreate(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
      upsert: (...args: unknown[]) => mockUpsert(...args),
      delete: (...args: unknown[]) => mockDelete(...args),
      deleteMany: (...args: unknown[]) => mockDeleteMany(...args),
    },
    $executeRaw: (...args: unknown[]) => mockExecuteRaw(...args),
  },
}))

import {
  resolveAuditOutputPath,
  runSeoContentAudit,
} from '@/features/seo-content-audit/lib/audit'
import type { SeoContentAuditFinding } from '@/features/seo-content-audit/types'

function finding(
  code: SeoContentAuditFinding['code'],
  publicUrl: string,
): SeoContentAuditFinding {
  return {
    publicUrl,
    entityType: publicUrl.startsWith('/logements') ? 'lodging' : 'poi',
    entityId: 'public-id',
    code,
    evidence: ['preuve publique'],
    updatedAt: '2026-08-20T10:00:00.000Z',
    requiresOwnerDecision: true,
  }
}

describe('043 read-only SEO content audit runner', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockGetPublicPoiAuditRows.mockResolvedValue([{ id: 'poi-1' }, { id: 'poi-2' }])
    mockGetPublicLodgingAuditRows.mockResolvedValue([{ id: 'profile-1' }])
    mockAuditPublicPois.mockReturnValue([
      finding('PLACEHOLDER_CONTENT', '/decouvrir/z'),
      finding('CONTENT_TOO_THIN', '/decouvrir/a'),
    ])
    mockAuditPublicLodgings.mockReturnValue([
      finding('LODGING_STRUCTURED_TEXT_CONFLICT', '/logements/chalet'),
    ])
  })

  it('counts every public row, invokes pure detectors and sorts combined findings', async () => {
    const result = await runSeoContentAudit({
      now: () => new Date('2026-08-28T12:00:00.000Z'),
    })

    expect(mockGetPublicPoiAuditRows).toHaveBeenCalledTimes(1)
    expect(mockGetPublicLodgingAuditRows).toHaveBeenCalledTimes(1)
    expect(mockAuditPublicPois).toHaveBeenCalledWith([{ id: 'poi-1' }, { id: 'poi-2' }])
    expect(mockAuditPublicLodgings).toHaveBeenCalledWith([{ id: 'profile-1' }])
    expect(result).toEqual({
      generatedAt: '2026-08-28T12:00:00.000Z',
      auditedPoiCount: 2,
      auditedLodgingCount: 1,
      findings: [
        finding('CONTENT_TOO_THIN', '/decouvrir/a'),
        finding('LODGING_STRUCTURED_TEXT_CONFLICT', '/logements/chalet'),
        finding('PLACEHOLDER_CONTENT', '/decouvrir/z'),
      ],
    })
  })

  it('does not mutate Prisma, publish content or call the network', async () => {
    const fetchSpy = jest.spyOn(globalThis, 'fetch')

    await runSeoContentAudit()

    for (const mutation of [
      mockCreate,
      mockUpdate,
      mockUpsert,
      mockDelete,
      mockDeleteMany,
      mockExecuteRaw,
      fetchSpy,
    ]) {
      expect(mutation).not.toHaveBeenCalled()
    }
    fetchSpy.mockRestore()
  })

  it('resolves report files only inside docs/audits', () => {
    const root = '/workspace/staylocal'

    expect(
      resolveAuditOutputPath('docs/audits/seo-content-quality-2026-08-28.md', root),
    ).toBe('/workspace/staylocal/docs/audits/seo-content-quality-2026-08-28.md')

    for (const unsafe of [
      '../report.md',
      'docs/report.md',
      'docs/audits/../report.md',
      '/tmp/report.md',
      'docs/audits',
    ]) {
      expect(() => resolveAuditOutputPath(unsafe, root)).toThrow(/docs\/audits/u)
    }
  })
})
