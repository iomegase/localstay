import {
  appendLodging,
  poiResultHref,
  categoryResultHref,
} from '@/features/city-guide/lib/guide-search-links'

describe('guide-search-links — liens de résultats de recherche', () => {
  it('appendLodging laisse le chemin inchangé sans logement', () => {
    expect(appendLodging('/guide/x/y', null)).toBe('/guide/x/y')
    expect(appendLodging('/guide/x/y', undefined)).toBe('/guide/x/y')
  })

  it('appendLodging ajoute le param lodging (encodé) quand présent', () => {
    expect(appendLodging('/guide/x/y', 'abc-123')).toBe('/guide/x/y?lodging=abc-123')
  })

  it('poiResultHref construit le lien vers la fiche POI', () => {
    expect(poiResultHref('saint-gervais', 'rando', 'mont-joux')).toBe(
      '/guide/saint-gervais/rando/mont-joux',
    )
    expect(poiResultHref('saint-gervais', 'rando', 'mont-joux', 'lodg-1')).toBe(
      '/guide/saint-gervais/rando/mont-joux?lodging=lodg-1',
    )
  })

  it('categoryResultHref construit le lien vers la page catégorie', () => {
    expect(categoryResultHref('saint-gervais', 'soin')).toBe('/guide/saint-gervais/soin')
    expect(categoryResultHref('saint-gervais', 'soin', 'lodg-1')).toBe(
      '/guide/saint-gervais/soin?lodging=lodg-1',
    )
  })
})
