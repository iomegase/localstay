import { buildBlogArticleBreadcrumb } from '@/features/blog/lib/breadcrumbs'

describe('029 blog city breadcrumb', () => {
  it('builds the city-aware breadcrumb for a city article', () => {
    expect(
      buildBlogArticleBreadcrumb({
        articleTitle: 'Que faire à Saint-Gervais en été',
        city: {
          name: 'Saint-Gervais-les-Bains',
          slug: 'saint-gervais-les-bains',
        },
      }),
    ).toEqual([
      { label: 'Accueil', href: '/' },
      {
        label: 'Guide Saint-Gervais-les-Bains',
        href: '/decouvrir/saint-gervais-les-bains',
      },
      { label: 'Blog', href: '/blog?city=saint-gervais-les-bains' },
      { label: 'Que faire à Saint-Gervais en été', href: null },
    ])
  })
})
