import {
  findLodgingSlugCollisions,
  type AuditedLodgingSlug,
} from '@/features/lodging-showcase/lib/slug'
import {
  createPrismaLodgingSlugReader,
  runLodgingSlugAudit,
  type LodgingSlugAuditPrismaClient,
} from '../../scripts/audit-lodging-slugs-runner'

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
      { id: 'profile-e', slug: 'villa-alpine', citySlug: 'annecy', deletedAt: null },
      { id: 'profile-d', slug: 'villa-alpine', citySlug: 'chamonix', deletedAt: null },
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
      {
        slug: 'villa-alpine',
        profiles: [
          { id: 'profile-d', slug: 'villa-alpine', citySlug: 'chamonix', deletedAt: null },
          { id: 'profile-e', slug: 'villa-alpine', citySlug: 'annecy', deletedAt: null },
        ],
      },
    ])
    expect(rows).toEqual(originalRows)
  })

  it('prints counts, disconnects, and returns success when the audit is clear', async () => {
    const lines: string[] = []
    const disconnect = jest.fn<() => Promise<void>>().mockResolvedValue(undefined)
    const readProfiles = jest.fn<() => Promise<readonly AuditedLodgingSlug[]>>().mockResolvedValue([
      { id: 'profile-a', slug: 'chalet-hygge', citySlug: 'annecy', deletedAt: null },
    ])

    const exitCode = await runLodgingSlugAudit({ readProfiles, disconnect, writeLine: (line) => lines.push(line) })

    expect(exitCode).toBe(0)
    expect(lines).toEqual([
      'Audited lodging public profile slugs: 1',
      'Global slug collisions: 0',
    ])
    expect(disconnect).toHaveBeenCalledTimes(1)
  })

  it('prints collision details and returns failure when collisions exist', async () => {
    const lines: string[] = []
    const disconnect = jest.fn<() => Promise<void>>().mockResolvedValue(undefined)
    const readProfiles = jest.fn<() => Promise<readonly AuditedLodgingSlug[]>>().mockResolvedValue([
      { id: 'profile-b', slug: 'chalet-hygge', citySlug: 'chamonix', deletedAt: null },
      { id: 'profile-a', slug: 'chalet-hygge', citySlug: 'annecy', deletedAt: null },
    ])

    const exitCode = await runLodgingSlugAudit({ readProfiles, disconnect, writeLine: (line) => lines.push(line) })

    expect(exitCode).toBe(1)
    expect(lines).toEqual([
      'Audited lodging public profile slugs: 2',
      'Global slug collisions: 1',
      '- chalet-hygge: profile-a (annecy), profile-b (chamonix)',
    ])
    expect(disconnect).toHaveBeenCalledTimes(1)
  })

  it('fails closed on profile-read rejection without printing a false zero-collision result', async () => {
    const lines: string[] = []
    const disconnect = jest.fn<() => Promise<void>>().mockResolvedValue(undefined)
    const readProfiles = jest.fn<() => Promise<readonly AuditedLodgingSlug[]>>().mockRejectedValue(new Error('SQL details'))

    const exitCode = await runLodgingSlugAudit({ readProfiles, disconnect, writeLine: (line) => lines.push(line) })

    expect(exitCode).toBe(1)
    expect(lines).toEqual(['Lodging slug audit failed while reading profiles.'])
    expect(lines).not.toContain('Global slug collisions: 0')
    expect(disconnect).toHaveBeenCalledTimes(1)
  })

  it('fails closed on disconnect rejection with a safe diagnostic', async () => {
    const lines: string[] = []
    const disconnect = jest.fn<() => Promise<void>>().mockRejectedValue(new Error('secret SQL details'))
    const readProfiles = jest.fn<() => Promise<readonly AuditedLodgingSlug[]>>().mockResolvedValue([])

    const exitCode = await runLodgingSlugAudit({ readProfiles, disconnect, writeLine: (line) => lines.push(line) })

    expect(exitCode).toBe(1)
    expect(lines).toEqual([
      'Audited lodging public profile slugs: 0',
      'Global slug collisions: 0',
      'Lodging slug audit failed while disconnecting Prisma.',
    ])
    expect(lines.join('\n')).not.toContain('secret SQL details')
  })

  it('returns failure on an output failure while still disconnecting exactly once', async () => {
    const writeLine = jest.fn< (line: string) => void >(() => {
      throw new Error('output sink failed')
    })
    const disconnect = jest.fn<() => Promise<void>>().mockResolvedValue(undefined)
    const readProfiles = jest.fn<() => Promise<readonly AuditedLodgingSlug[]>>().mockResolvedValue([])

    const exitCode = await runLodgingSlugAudit({ readProfiles, disconnect, writeLine })

    expect(exitCode).toBe(1)
    expect(writeLine).toHaveBeenCalled()
    expect(disconnect).toHaveBeenCalledTimes(1)
  })

  it('uses an unfiltered Prisma read with only the required audit fields', async () => {
    const findMany = jest.fn().mockResolvedValue([])
    const prisma = {
      lodgingPublicProfile: { findMany },
    } as unknown as LodgingSlugAuditPrismaClient

    await createPrismaLodgingSlugReader(prisma)()

    expect(findMany).toHaveBeenCalledWith({
      select: {
        id: true,
        slug: true,
        deleted_at: true,
        city: { select: { slug: true } },
      },
    })
  })
})
