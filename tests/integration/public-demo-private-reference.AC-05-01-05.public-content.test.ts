import {
  getPublishedBlogArticleBySlug,
  getPublishedBlogArticles,
} from '@/features/blog/queries/public-blog'
import {
  getPublishedLodgingDetailBySlug,
  listPublishedLodgings,
} from '@/features/lodging-showcase/queries/public-lodgings'
import { loadGuideDemoPublishedContent } from '@/features/marketing/queries/guide-demo-content'

jest.mock('@/features/blog/queries/public-blog', () => ({
  getPublishedBlogArticleBySlug: jest.fn(),
  getPublishedBlogArticles: jest.fn(),
}))

jest.mock('@/features/lodging-showcase/queries/public-lodgings', () => ({
  getPublishedLodgingDetailBySlug: jest.fn(),
  listPublishedLodgings: jest.fn(),
}))

const mockedBlogList = jest.mocked(getPublishedBlogArticles)
const mockedBlogDetail = jest.mocked(getPublishedBlogArticleBySlug)
const mockedLodgingList = jest.mocked(listPublishedLodgings)
const mockedLodgingDetail = jest.mocked(getPublishedLodgingDetailBySlug)

describe('045-public-demo-private-guide-reference published catalogs', () => {
  beforeEach(() => {
    jest.resetAllMocks()
  })

  it('maps published lodging and blog details in public ordering without Prisma UUIDs', async () => {
    mockedLodgingList.mockResolvedValue([
      {
        id: '3ee93c70-9378-4d6d-80b3-c057570d1b25',
        slug: 'chalet-alpin',
        city_slug: 'saint-gervais-les-bains',
        city_name: 'Saint-Gervais-les-Bains',
        title: 'Chalet Alpin',
        cover_photo_url: '/chalet.webp',
        short_description: 'Un vrai logement publié.',
        property_type: 'Chalet',
        max_guests: 6,
        bedroom_count: 3,
        bathroom_count: 2,
        surface_m2: 95,
        public_area_label: 'Saint-Gervais centre',
        amenities: ['Wi-Fi'],
        href: '/logements/chalet-alpin',
      },
    ])
    mockedLodgingDetail.mockResolvedValue({
      id: '3ee93c70-9378-4d6d-80b3-c057570d1b25',
      slug: 'chalet-alpin',
      city_slug: 'saint-gervais-les-bains',
      city_name: 'Saint-Gervais-les-Bains',
      city_region: 'Haute-Savoie',
      title: 'Chalet Alpin',
      cover_photo_url: '/chalet.webp',
      short_description: 'Un vrai logement publié.',
      description: 'Description publique complète.',
      property_type: 'Chalet',
      max_guests: 6,
      bedroom_count: 3,
      bathroom_count: 2,
      bed_count: 4,
      surface_m2: 95,
      public_area_label: 'Saint-Gervais centre',
      amenities: ['Wi-Fi'],
      href: '/logements/chalet-alpin',
      photos: [
        {
          id: 'photo-uuid',
          url: '/chalet.webp',
          alt: 'Chalet Alpin',
          room_type: null,
          room_label: null,
          sort_order: 0,
          is_cover: true,
        },
      ],
      external_booking_url: null,
      external_booking_platform: null,
      public_contact_enabled: false,
      owner_recommendations: [],
      precise_location_public: false,
      public_latitude: null,
      public_longitude: null,
      amenities_included: ['Wi-Fi'],
      amenities_on_request: ['Lit bébé'],
      faq: [],
    })
    mockedBlogList.mockResolvedValue({
      city: null,
      items: [
        {
          id: '2e07415f-8522-4807-b934-78d3e33e19fc',
          slug: 'ete-a-saint-gervais',
          title: 'Un été à Saint-Gervais',
          excerpt: 'Article réellement publié.',
          category: 'local_guide',
          tags: [],
          published_at: new Date('2026-08-20T10:00:00.000Z'),
          city: {
            name: 'Saint-Gervais-les-Bains',
            slug: 'saint-gervais-les-bains',
          },
          cover: { url: '/blog.webp', alt: 'Été à Saint-Gervais' },
        },
      ],
    })
    mockedBlogDetail.mockResolvedValue({
      id: '2e07415f-8522-4807-b934-78d3e33e19fc',
      slug: 'ete-a-saint-gervais',
      title: 'Un été à Saint-Gervais',
      excerpt: 'Article réellement publié.',
      content_markdown: '## Découvrir\n\nLe contenu public complet.',
      category: 'local_guide',
      tags: [],
      published_at: new Date('2026-08-20T10:00:00.000Z'),
      seo_title: null,
      seo_description: null,
      city: {
        name: 'Saint-Gervais-les-Bains',
        slug: 'saint-gervais-les-bains',
      },
      cover: { url: '/blog.webp', alt: 'Été à Saint-Gervais' },
      gallery: [],
    })

    const result = await loadGuideDemoPublishedContent()

    expect(mockedLodgingDetail).toHaveBeenCalledWith('chalet-alpin')
    expect(mockedBlogDetail).toHaveBeenCalledWith('ete-a-saint-gervais')
    expect(result.lodgingCards).toEqual([
      expect.objectContaining({
        id: 'demo-lodging-chalet-alpin',
        slug: 'demo-chalet-alpin',
        title: 'Chalet Alpin',
        description: 'Description publique complète.',
        amenitiesIncluded: ['Wi-Fi'],
        amenitiesOnRequest: ['Lit bébé'],
      }),
    ])
    expect(result.blogPosts).toEqual([
      expect.objectContaining({
        id: 'demo-blog-ete-a-saint-gervais',
        slug: 'demo-ete-a-saint-gervais',
        title: 'Un été à Saint-Gervais',
        contentMarkdown: '## Découvrir\n\nLe contenu public complet.',
      }),
    ])
    expect(JSON.stringify(result)).not.toContain(
      '3ee93c70-9378-4d6d-80b3-c057570d1b25',
    )
    expect(JSON.stringify(result)).not.toContain(
      '2e07415f-8522-4807-b934-78d3e33e19fc',
    )
  })

  it('keeps the blog catalog when the lodging database read fails', async () => {
    mockedLodgingList.mockRejectedValue(new Error('database unavailable'))
    mockedBlogList.mockResolvedValue({
      city: null,
      items: [
        {
          id: '2e07415f-8522-4807-b934-78d3e33e19fc',
          slug: 'article-public',
          title: 'Article public',
          excerpt: 'Contenu publié.',
          category: 'local_guide',
          tags: [],
          published_at: new Date('2026-08-20T10:00:00.000Z'),
          city: null,
          cover: null,
        },
      ],
    })
    mockedBlogDetail.mockResolvedValue({
      id: '2e07415f-8522-4807-b934-78d3e33e19fc',
      slug: 'article-public',
      title: 'Article public',
      excerpt: 'Contenu publié.',
      content_markdown: 'Contenu public complet.',
      category: 'local_guide',
      tags: [],
      published_at: new Date('2026-08-20T10:00:00.000Z'),
      seo_title: null,
      seo_description: null,
      city: null,
      cover: null,
      gallery: [],
    })

    await expect(loadGuideDemoPublishedContent()).resolves.toEqual({
      lodgingCards: [],
      blogPosts: [expect.objectContaining({ title: 'Article public' })],
    })
  })
})
