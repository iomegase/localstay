jest.mock('@/features/seo/queries/sitemap-data', () => ({ getSitemapData: jest.fn() }))
jest.mock('@/features/local-seo/lib/sitemap', () => ({ localSeoSitemapPaths: jest.fn() }))

import { revalidate } from '@/app/sitemap'

// Audit de reprise N-1 : un slug modifié hors de l'admin (script, base) ne déclenche
// aucune revalidation ; le sitemap doit se régénérer seul au plus tard toutes les heures.
describe('sitemap — fraîcheur bornée', () => {
  it('se régénère au plus tard toutes les heures', () => {
    expect(revalidate).toBe(3600)
  })
})
