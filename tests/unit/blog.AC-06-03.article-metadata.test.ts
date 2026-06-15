import { blogArticleMetadata } from '@/features/blog/lib/metadata'

describe('029 blog article metadata', () => {
  it('uses the article SEO fields and canonical article path', () => {
    const metadata = blogArticleMetadata({
      slug: 'week-end-saint-gervais',
      title: 'Week-end à Saint-Gervais',
      excerpt:
        'Un guide éditorial pour préparer un séjour local avec des repères utiles et une sélection cohérente de bonnes adresses.',
      seo_title: 'Week-end à Saint-Gervais — Guide local MyStay',
      seo_description:
        'Préparez un week-end à Saint-Gervais avec les conseils MyStay, des repères pratiques, un angle local et une lecture pensée pour le séjour.',
      coverUrl: 'https://img.test/cover.jpg',
    })

    expect(metadata.title).toBe('Week-end à Saint-Gervais — Guide local MyStay')
    expect(metadata.description).toContain('Préparez un week-end')
    expect(metadata.alternates?.canonical).toBe('/blog/week-end-saint-gervais')
    expect(metadata.openGraph?.images).toEqual(['https://img.test/cover.jpg'])
  })
})
