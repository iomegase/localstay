import { buildBlogArticleBreadcrumb } from '@/features/blog/lib/breadcrumbs'

describe('029 blog global breadcrumb', () => {
  it('builds the global breadcrumb for an article without city', () => {
    expect(
      buildBlogArticleBreadcrumb({
        articleTitle: '10 conseils pour un séjour plus fluide',
        city: null,
      }),
    ).toEqual([
      { label: 'Accueil', href: '/' },
      { label: 'Blog', href: '/blog' },
      { label: '10 conseils pour un séjour plus fluide', href: null },
    ])
  })
})
