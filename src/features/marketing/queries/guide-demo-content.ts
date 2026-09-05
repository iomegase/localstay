import { cache } from 'react'
import { blogCategoryLabel } from '@/features/blog/lib/category-label'
import {
  getPublishedBlogArticleBySlug,
  getPublishedBlogArticles,
} from '@/features/blog/queries/public-blog'
import {
  getPublishedLodgingDetailBySlug,
  listPublishedLodgings,
} from '@/features/lodging-showcase/queries/public-lodgings'
import type {
  DemoBlogPost,
  DemoLodgingCard,
  DemoPublishedContent,
} from '@/features/guide-demo/types'

const LODGING_FALLBACK_IMAGE = '/marketing/demo-lodging-1.webp'

function toDemoId(prefix: 'blog' | 'lodging', slug: string): `demo-${string}` {
  return `demo-${prefix}-${slug}`
}

async function loadPublishedLodgingCards(): Promise<DemoLodgingCard[]> {
  try {
    const lodgings = await listPublishedLodgings()
    const lodgingDetails = []

    for (const lodging of lodgings) {
      try {
        lodgingDetails.push(await getPublishedLodgingDetailBySlug(lodging.slug))
      } catch {
        lodgingDetails.push(null)
      }
    }

    return lodgingDetails.flatMap<DemoLodgingCard>(lodging => {
      if (!lodging) return []

      const photos = lodging.photos.map(photo => ({
        url: photo.url,
        alt: photo.alt,
        roomType: photo.room_type,
        roomLabel: photo.room_label,
      }))

      return [{
        id: toDemoId('lodging', lodging.slug),
        slug: `demo-${lodging.slug}`,
        citySlug: lodging.city_slug,
        title: lodging.title,
        cityName: lodging.city_name,
        propertyType: lodging.property_type,
        coverPhotoUrl:
          lodging.cover_photo_url ?? photos[0]?.url ?? LODGING_FALLBACK_IMAGE,
        shortDescription: lodging.short_description,
        description: lodging.description,
        maxGuests: lodging.max_guests,
        bedroomCount: lodging.bedroom_count,
        bathroomCount: lodging.bathroom_count,
        surfaceM2: lodging.surface_m2,
        publicAreaLabel: lodging.public_area_label ?? lodging.city_name,
        photos:
          photos.length > 0
            ? photos
            : [{ url: LODGING_FALLBACK_IMAGE, alt: lodging.title }],
        amenitiesIncluded: lodging.amenities_included,
        amenitiesOnRequest: lodging.amenities_on_request,
      }]
    })
  } catch {
    return []
  }
}

async function loadPublishedBlogPosts(): Promise<DemoBlogPost[]> {
  try {
    const blog = await getPublishedBlogArticles()
    const blogDetails = []

    for (const article of blog?.items ?? []) {
      try {
        blogDetails.push(await getPublishedBlogArticleBySlug(article.slug))
      } catch {
        blogDetails.push(null)
      }
    }

    return blogDetails.flatMap<DemoBlogPost>(article => {
      if (!article) return []

      return [{
        id: toDemoId('blog', article.slug),
        slug: `demo-${article.slug}`,
        title: article.title,
        excerpt: article.excerpt,
        categoryLabel: blogCategoryLabel(article.category),
        coverUrl: article.cover?.url ?? LODGING_FALLBACK_IMAGE,
        cityName: article.city?.name ?? 'MyStay',
        contentMarkdown: article.content_markdown,
        publishedAt: article.published_at.toISOString(),
      }]
    })
  } catch {
    return []
  }
}

export async function loadGuideDemoPublishedContent(): Promise<DemoPublishedContent> {
  // Les environnements serverless peuvent limiter Prisma à une seule connexion.
  // Charger les détails séquentiellement évite de saturer ce pool très réduit.
  const lodgingCards = await loadPublishedLodgingCards()
  const blogPosts = await loadPublishedBlogPosts()

  return { lodgingCards, blogPosts }
}

export const getGuideDemoPublishedContent = cache(
  loadGuideDemoPublishedContent,
)
