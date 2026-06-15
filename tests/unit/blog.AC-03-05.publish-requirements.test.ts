import { getBlogPublishValidationErrors } from '@/features/blog/lib/publish-validation'

describe('029 blog publish requirements', () => {
  it('lists the missing fields that block publication', () => {
    expect(
      getBlogPublishValidationErrors({
        title: 'Guide local',
        excerpt: 'Court',
        content_markdown: 'Trop court',
        city: null,
        coverPhoto: null,
        seo_title: null,
        seo_description: null,
      }),
    ).toEqual([
      'excerpt',
      'content_markdown',
      'seo_title',
      'seo_description',
      'cover_photo',
    ])
  })

  it('refuses publication when the linked city is inactive', () => {
    expect(
      getBlogPublishValidationErrors({
        title: 'Les plus beaux panoramas autour de Saint-Gervais',
        excerpt:
          'Un guide éditorial complet pour préparer un séjour à la montagne avec des idées locales et des repères utiles.',
        content_markdown: 'a'.repeat(320),
        seo_title: 'Panoramas autour de Saint-Gervais — Guide local MyStay',
        seo_description:
          'Découvrez les plus beaux panoramas autour de Saint-Gervais avec des conseils pratiques, un angle local et une lecture pensée pour le séjour.',
        city: {
          is_active: false,
          deleted_at: null,
        },
        coverPhoto: {
          alt: 'Panorama sur les montagnes de Saint-Gervais',
        },
      }),
    ).toContain('city_id')
  })
})
