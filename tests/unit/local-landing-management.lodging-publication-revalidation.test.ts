import { prisma } from '@/shared/lib/prisma'
import { revalidatePath } from 'next/cache'
import { publishLodgingProfile, archiveLodgingProfile, requestChangesLodgingProfile } from '@/features/lodging-showcase/queries/admin-public-profiles'

jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))
jest.mock('@/shared/lib/prisma', () => ({
  prisma: { lodgingPublicProfile: { findFirst: jest.fn(), update: jest.fn() } },
}))

describe('048 vacation eligibility after lodging moderation', () => {
  beforeEach(() => { jest.clearAllMocks() })

  it.each([
    ['publishes the first lodging', publishLodgingProfile, 'review', 'published'],
    ['archives the last lodging', archiveLodgingProfile, 'published', 'archived'],
    ['returns the last lodging to draft', (id: string) => requestChangesLodgingProfile(id, 'Contenu à compléter'), 'published', 'draft'],
  ] as const)('%s and invalidates its city landing after the successful write', async (_label, mutate, before, after) => {
    jest.mocked(prisma.lodgingPublicProfile.findFirst).mockResolvedValue({
      id: 'profile-1', publication_status: before, published_at: null, city: { slug: 'megeve' },
    } as never)
    jest.mocked(prisma.lodgingPublicProfile.update).mockImplementation(async () => {
      expect(revalidatePath).not.toHaveBeenCalled()
      return { id: 'profile-1', publication_status: after, published_at: null } as never
    })
    await mutate('profile-1')
    expect(revalidatePath).toHaveBeenCalledWith('/locations-vacances/megeve', 'page')
    expect(revalidatePath).toHaveBeenCalledWith('/sitemap.xml')
    expect(prisma.lodgingPublicProfile.findFirst).toHaveBeenCalledWith(expect.objectContaining({
      select: expect.objectContaining({ city: { select: { slug: true } } }),
    }))
  })

  it('does not invalidate when the profile is missing', async () => {
    jest.mocked(prisma.lodgingPublicProfile.findFirst).mockResolvedValue(null)
    await expect(archiveLodgingProfile('missing')).resolves.toBeNull()
    expect(revalidatePath).not.toHaveBeenCalled()
  })
})
