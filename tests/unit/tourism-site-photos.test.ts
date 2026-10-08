import { createTourismSitePhotoFinder, listTrailPages, pageNameFromUrl } from '@/features/trails-acquisition/services/tourism-site-photos'
import { extractApidaeMultimedia, extractOfficialWebsiteTrailPhotos } from '@/features/trails-acquisition/services/official-website'
import { CityUpdateSchema, normalizeTourismSiteUrl } from '@/features/admin/schemas/city'

const SITE = 'https://www.lescontamines.com'
const TRUC = `${SITE}/ete/activites/montagne/randonnees/idees-randonnee-0/le-truc-et-les-chalets-de-miage-3110724`
const apidaePage = `<script>window.data={"multimedia":[{"type":"03.01.01","URL":"https://static.apidae-tourisme.com/a.jpg","name":{"fr":"Plateau du Truc"},"copyright":"Gilles Lansard / Les Contamines Tourisme"},{"type":"04.03.13","URL":"https://x/doc.pdf","copyright":"CD74"}]}</script><meta property="og:image" content="https://www.lescontamines.com/og.jpg">`

describe('PO 2026-10-08 — photos des galeries de l’office de tourisme', () => {
  it('fiches Apidae intégrées : images avec leur crédit, documents ignorés', () => {
    expect(extractApidaeMultimedia(apidaePage)).toHaveLength(2)
    expect(extractOfficialWebsiteTrailPhotos(apidaePage, TRUC)).toEqual([
      { url: 'https://static.apidae-tourisme.com/a.jpg', source_url: TRUC, attribution: 'Gilles Lansard / Les Contamines Tourisme', caption: 'Plateau du Truc' },
    ])
  })

  it('nom d’une page d’après son adresse', () => {
    expect(pageNameFromUrl(TRUC)).toBe('le truc et les chalets de miage')
    expect(pageNameFromUrl('https://www.saintgervais.com/je-minspire/randonnee-toutes-saisons/lalpage-de-porcherey-fr-4304123/')).toBe('lalpage de porcherey')
  })

  it('plan du site : index et sous-plans suivis ; pages hiver, anglaises et autres sites écartées', async () => {
    const fetcher = jest.fn(async (url: string) => {
      if (url === `${SITE}/sitemap.xml`) return `<sitemapindex><sitemap><loc>${SITE}/sitemap.xml/1</loc></sitemap></sitemapindex>`
      return `<urlset><loc>${TRUC}</loc><loc>${SITE}/winter/randonnees/balade-1</loc><loc>${SITE}/summer/hike/x-2</loc><loc>${SITE}/ete/hebergements/hotel</loc><loc>https://autre.site/randonnees/x</loc></urlset>`
    })
    expect(await listTrailPages(SITE, fetcher)).toEqual([TRUC])
  })

  it('correspondance par nom ; seules les photos créditées d’un auteur (pas l’image de partage du site)', async () => {
    const fetcher = jest.fn(async (url: string) => {
      if (url.endsWith('sitemap.xml')) return `<urlset><loc>${TRUC}</loc><loc>${SITE}/ete/randonnees/tour-du-mont-blanc</loc></urlset>`
      if (url === TRUC) return apidaePage
      return '<meta property="og:image" content="https://www.lescontamines.com/og.jpg">'
    })
    const find = createTourismSitePhotoFinder(SITE, fetcher)
    expect((await find({ title: 'Refuge du Truc et Chalets de Miage' })).map(photo => photo.attribution)).toEqual(['Gilles Lansard / Les Contamines Tourisme'])
    expect(await find({ title: 'Tour du Mont Blanc - Itinéraire principal' })).toEqual([])
    expect(await find({ title: 'Lac de Roselette' })).toEqual([])
    expect(fetcher.mock.calls.filter(([url]) => String(url).endsWith('sitemap.xml'))).toHaveLength(1)
  })
})

describe('Admin › Villes : site de l’office de tourisme', () => {
  it('« https:// » facultatif, ramené à l’origine ; vide → aucun site', () => {
    expect(normalizeTourismSiteUrl('www.lescontamines.com/ete')).toBe('https://www.lescontamines.com')
    expect(normalizeTourismSiteUrl('  ')).toBeNull()
    expect(CityUpdateSchema.parse({ name: 'Les Contamines-Montjoie', postal_code: '74170', tourism_site_url: 'lescontamines.com' }).tourism_site_url).toBe('https://lescontamines.com')
    expect(CityUpdateSchema.safeParse({ name: 'Les Contamines', postal_code: '74170', tourism_site_url: 'pas un site' }).success).toBe(false)
    expect(CityUpdateSchema.parse({ name: 'Les Contamines', postal_code: '74170' }).tourism_site_url).toBeUndefined()
  })
})
