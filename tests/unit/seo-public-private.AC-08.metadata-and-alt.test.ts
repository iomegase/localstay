import { singleBrandTitle, lodgingDetailMetadata, cityMetadata, categoryMetadata } from '@/features/seo/lib/metadata'
import { blogListMetadata, blogArticleMetadata } from '@/features/blog/lib/metadata'
import { lodgingPhotoAlt } from '@/features/lodging-showcase/lib/detail-view'
import { isTechnicalImageAlt } from '@/shared/lib/image-alt'
import { LodgingPhotoAltInputSchema } from '@/features/lodging-showcase/schemas'
import { BlogPhotoUploadSchema } from '@/features/blog/schemas'

it('AC-08-01 leaves one brand in the final title including persisted editorial titles', () => {
  const titles = [
    lodgingDetailMetadata({ title: 'Chalet Hygge', shortDescription: 'Un chalet', lodgingSlug: 'chalet', coverPhoto: null }).title,
    cityMetadata({ name: 'Saint-Gervais', slug: 'saint-gervais', region: null }).title,
    categoryMetadata({ categoryName: 'Restaurants', cityName: 'Saint-Gervais', citySlug: 'saint-gervais', categorySlug: 'restaurants' }).title,
    blogListMetadata({ city: null }).title,
    blogListMetadata({ city: { name: 'Saint-Gervais', slug: 'saint-gervais' } }).title,
    blogArticleMetadata({ slug: 'article', title: 'Guide', excerpt: 'Guide local', seo_title: 'Guide — MyStay | MyStay', seo_description: null, coverUrl: null }).title,
    singleBrandTitle('Les conseils MyStay'),
  ]
  for (const title of titles) {
    const finalTitle = typeof title === 'string' ? `${title} | MyStay` : title && typeof title === 'object' && 'absolute' in title ? title.absolute : ''
    expect(finalTitle.match(/MyStay/g)).toHaveLength(1)
  }
})

it.each(['45bd1b02-d2a0-42f2-ad5b-d93a2e753b9d', '45bd1b02 d2a0 42f2 ad5b d93a2e753b9d', '45bd1b02d2a042f2ad5bd93a2e753b9d', 'IMG_1234.jpg', 'terrasse.webp', 'https://example.com/photo.jpg', ''])('AC-08-03/04 replaces and rejects technical alt %s', alt => {
  expect(isTechnicalImageAlt(alt)).toBe(true)
  expect(lodgingPhotoAlt({ alt, room_type: 'bedroom', room_label: 'Chambre 2' }, 'Chalet Hygge')).toBe('Chambre 2 — Chalet Hygge')
  expect(LodgingPhotoAltInputSchema.safeParse(alt).success).toBe(false)
  expect(BlogPhotoUploadSchema.safeParse({ kind: 'cover', alt }).success).toBe(false)
})

it('AC-08-03 preserves a meaningful description and uses known room types only', () => {
  expect(lodgingPhotoAlt({ alt: 'Salon lumineux avec canapé', room_type: 'common_area' }, 'Chalet')).toBe('Salon lumineux avec canapé')
  expect(lodgingPhotoAlt({ alt: '', room_type: 'kitchen' }, 'Chalet')).toBe('Cuisine — Chalet')
  expect(lodgingPhotoAlt({ alt: '', room_type: null }, 'Chalet')).toBe('Photo du logement — Chalet')
})
