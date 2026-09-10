import { prisma } from '@/shared/lib/prisma'
import { revalidatePath } from 'next/cache'
import { confirmContentRights, saveGeneratedRewrite, saveSourceListingUrl, submitOwnerPublicProfile } from '@/features/lodging-showcase/queries/owner-public-profile'
jest.mock('next/cache', () => ({ revalidatePath: jest.fn() }))
jest.mock('@/shared/lib/prisma', () => ({ prisma: {
  lodging: { findFirst: jest.fn() },
  lodgingPublicProfile: { upsert: jest.fn(), update: jest.fn() },
} }))

describe('048 owner mutations removing lodging publication', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    jest.mocked(prisma.lodging.findFirst).mockResolvedValue({
      id: 'lodging-1', city_id: 'city-1', city: { id: 'city-1', slug: 'megeve', name: 'Megève' },
    } as never)
    jest.mocked(prisma.lodgingPublicProfile.upsert).mockResolvedValue({
      id: 'profile-1', publication_status: 'published', title: 'Le chalet de Megève',
      short_description: 'Un chalet confortable pour votre séjour à Megève.', description: 'Une description complète du chalet et de ses équipements, préparée avec soin par le propriétaire pour les voyageurs.',
      property_type: 'Chalet', max_guests: 4, content_rights_confirmed_at: new Date(),
      photos: [{ url: '/cover.jpg', alt: 'Le chalet', is_cover: true }],
      amenities: [{ code: 'wifi', label: 'Wi-Fi' }, { code: 'parking', label: 'Parking' }, { code: 'kitchen', label: 'Cuisine' }],
      faq_items: [], city: { slug: 'chamonix' },
    } as never)
    jest.mocked(prisma.lodgingPublicProfile.update).mockResolvedValue({ id: 'profile-1' } as never)
  })

  it.each([
    ['review', () => submitOwnerPublicProfile('owner-1', 'lodging-1')],
    ['source URL', () => saveSourceListingUrl('owner-1', 'lodging-1', { source_listing_url: 'https://www.airbnb.fr/rooms/123' })],
    ['rights confirmation', () => confirmContentRights('owner-1', 'lodging-1', 'v1')],
    ['rewrite draft', () => saveGeneratedRewrite('owner-1', 'lodging-1', {
      sourceDescriptionText: 'Description fournie par le propriétaire',
      rewriteSuggestion: { short_description: 'Court', description: 'Long', seo_title: 'Titre', seo_description: 'Description' },
    })],
  ] as const)('revalidates vacation eligibility after %s', async (_label, mutate) => {
    await mutate()
    expect(prisma.lodgingPublicProfile.update).toHaveBeenCalled()
    expect(prisma.lodgingPublicProfile.upsert).toHaveBeenCalledWith(expect.objectContaining({ update: {} }))
    expect(revalidatePath).toHaveBeenCalledWith('/locations-vacances/chamonix', 'page')
    expect(revalidatePath).toHaveBeenCalledWith('/locations-vacances/megeve', 'page')
    expect(revalidatePath).toHaveBeenCalledWith('/sitemap.xml')
  })
})
