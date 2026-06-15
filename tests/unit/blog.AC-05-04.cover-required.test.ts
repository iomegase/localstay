import { getBlogPublishValidationErrors } from '@/features/blog/lib/publish-validation'

describe('029 blog cover photo requirement', () => {
  it('refuses publication when the cover photo is missing', () => {
    expect(
      getBlogPublishValidationErrors({
        title: 'Les plus beaux panoramas autour de Saint-Gervais',
        excerpt:
          'Un guide éditorial complet pour préparer un séjour à la montagne avec des idées locales et des repères utiles.',
        content_markdown: 'a'.repeat(320),
        seo_title: 'Panoramas autour de Saint-Gervais — Guide local MyStay',
        seo_description:
          'Découvrez les plus beaux panoramas autour de Saint-Gervais avec des conseils pratiques, un angle local et une lecture pensée pour le séjour.',
        city: null,
        coverPhoto: null,
      }),
    ).toContain('cover_photo')
  })

  it('refuses publication when the cover alt text is too short', () => {
    expect(
      getBlogPublishValidationErrors({
        title: 'Les plus beaux panoramas autour de Saint-Gervais',
        excerpt:
          'Un guide éditorial complet pour préparer un séjour à la montagne avec des idées locales et des repères utiles.',
        content_markdown: 'a'.repeat(320),
        seo_title: 'Panoramas autour de Saint-Gervais — Guide local MyStay',
        seo_description:
          'Découvrez les plus beaux panoramas autour de Saint-Gervais avec des conseils pratiques, un angle local et une lecture pensée pour le séjour.',
        city: null,
        coverPhoto: { alt: 'ok' },
      }),
    ).toContain('cover_photo')
  })
})
