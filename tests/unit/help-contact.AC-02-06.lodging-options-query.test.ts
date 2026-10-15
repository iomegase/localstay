const findMany = jest.fn()
jest.mock('@/shared/lib/prisma', () => ({ prisma: { lodgingPublicProfile: { findMany } } }))
jest.mock('react', () => ({ ...jest.requireActual('react'), cache: <T,>(fn: T) => fn }))

import { listContactLodgingOptions } from '@/features/contact-messages/queries/contact-lodgings'

describe('053 AC-02-06 — listContactLodgingOptions', () => {
  beforeEach(() => findMany.mockReset())

  it('reads published active lodgings only and labels them « Titre · Commune »', async () => {
    findMany.mockResolvedValue([
      { title: 'Le 305', city: { name: 'Saint-Gervais-les-Bains' } },
      { title: 'Le 305', city: { name: 'Saint-Gervais-les-Bains' } },
    ])
    await expect(listContactLodgingOptions()).resolves.toEqual(['Le 305 · Saint-Gervais-les-Bains'])
    expect(findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        publication_status: 'published',
        deleted_at: null,
        city: { is_active: true, deleted_at: null },
        lodging: { is_active: true, deleted_at: null },
      },
      orderBy: [{ city: { name: 'asc' } }, { title: 'asc' }],
    }))
  })

  it('returns an empty list when the read fails', async () => {
    jest.spyOn(console, 'error').mockImplementation(() => {})
    findMany.mockRejectedValue(new Error('db down'))
    await expect(listContactLodgingOptions()).resolves.toEqual([])
  })
})
