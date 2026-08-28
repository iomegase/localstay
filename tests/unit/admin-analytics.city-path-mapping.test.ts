import { resolveAnalyticsCityContext } from '@/features/admin-analytics/lib/city-path-mapping'

describe('030 admin analytics city path mapping', () => {
  it('maps only approved city-aware public routes', () => {
    expect(resolveAnalyticsCityContext('/guide/annecy')).toEqual({
      citySlug: 'annecy',
      pageType: 'city_guide',
    })

    expect(resolveAnalyticsCityContext('/guide/annecy/contact')).toEqual({
      citySlug: 'annecy',
      pageType: 'city_contact',
    })

    expect(resolveAnalyticsCityContext('/guide/annecy/logements')).toEqual({
      citySlug: 'annecy',
      pageType: 'city_lodgings',
    })

    expect(resolveAnalyticsCityContext('/guide/annecy/logements/chalet-hygge')).toEqual({
      citySlug: 'annecy',
      pageType: 'lodging_detail',
    })

    expect(resolveAnalyticsCityContext('/logements/chalet-hygge')).toEqual({
      citySlug: null,
      pageType: 'lodging_detail',
    })

    expect(resolveAnalyticsCityContext('/blog')).toEqual({
      citySlug: null,
      pageType: 'global',
    })
  })
})
