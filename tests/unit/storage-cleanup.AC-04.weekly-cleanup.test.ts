const mockList = jest.fn()
const mockRemove = jest.fn()
const mockReferenced = jest.fn()

jest.mock('@/shared/lib/supabase', () => ({
  createSupabaseServer: () => ({
    storage: { from: () => ({ list: (...args: unknown[]) => mockList(...args), remove: (...args: unknown[]) => mockRemove(...args) }) },
  }),
}))
jest.mock('@/features/storage-cleanup/queries/references', () => ({
  loadReferencedStorageUrls: () => mockReferenced(),
}))

import { cleanupUnusedStorageFiles } from '@/features/storage-cleanup/services/weekly-cleanup'

// Spec 070 US-04 — nettoyage hebdomadaire.
const BASE = 'https://cftqqyqfhlvobtsatxdq.supabase.co/storage/v1/object/public/guide-photos/'
const NOW = new Date('2026-10-12T03:00:00.000Z')
const OLD = '2026-10-01T00:00:00.000Z'
const RECENT = '2026-10-12T01:00:00.000Z'

function file(name: string, created_at: string, size = 1000) {
  return { id: `id-${name}`, name, created_at, metadata: { size } }
}
function folder(name: string) {
  return { id: null, name, metadata: null }
}

describe('070 US-04 — nettoyage hebdomadaire', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockRemove.mockResolvedValue({ data: [], error: null })
    mockReferenced.mockResolvedValue(new Set([`${BASE}pois/utilisee.webp`, `${BASE}lodgings/l1/showcase/utilisee.webp`]))
    mockList.mockImplementation(async (prefix: string) => {
      const tree: Record<string, unknown[]> = {
        pois: [file('utilisee.webp', OLD), file('orpheline.webp', OLD, 2048), file('recente.webp', RECENT), folder('p1')],
        'pois/p1': [file('copie-orpheline.webp', OLD, 1024)],
        lodgings: [folder('l1')],
        'lodgings/l1': [folder('showcase'), file('cover-orpheline.webp', OLD, 512)],
        'lodgings/l1/showcase': [file('utilisee.webp', OLD)],
      }
      return { data: tree[prefix] ?? [], error: null }
    })
  })

  it('AC-04-01 / AC-04-03 : supprime les orphelins de plus de 24 h dans pois/ et lodgings/', async () => {
    const report = await cleanupUnusedStorageFiles({ now: NOW })

    expect(mockList.mock.calls.map(call => call[0])).not.toContain('fallbacks')
    expect(mockRemove).toHaveBeenCalledWith(['pois/orpheline.webp', 'pois/p1/copie-orpheline.webp', 'lodgings/l1/cover-orpheline.webp'])
    expect(report).toEqual({ scanned: 6, deleted: 3, bytes_freed: 2048 + 1024 + 512, dry_run: false })
  })

  it('AC-04-04 : simulation → aucun fichier supprimé, même rapport', async () => {
    const report = await cleanupUnusedStorageFiles({ now: NOW, dryRun: true })

    expect(mockRemove).not.toHaveBeenCalled()
    expect(report).toEqual({ scanned: 6, deleted: 3, bytes_freed: 3584, dry_run: true })
  })

  it('supprime par lots de 500', async () => {
    const many = Array.from({ length: 1200 }, (_, index) => file(`f${index}.webp`, OLD))
    mockList.mockImplementation(async (prefix: string, { limit, offset }: { limit: number; offset: number }) => ({
      data: prefix === 'pois' ? many.slice(offset, offset + limit) : [],
      error: null,
    }))
    mockReferenced.mockResolvedValue(new Set())

    await cleanupUnusedStorageFiles({ now: NOW })

    expect(mockRemove.mock.calls.map(call => (call[0] as string[]).length)).toEqual([500, 500, 200])
  })
})
