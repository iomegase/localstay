import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { NextRequest } from 'next/server'

jest.mock('@/shared/lib/supabase', () => ({
  createSupabaseMiddlewareClient: jest.fn(() => ({
    auth: { getUser: jest.fn(async () => ({ data: { user: null } })) },
  })),
}))

import { isAnonymousMarketingPath, proxy } from '../../src/proxy'
import { isPrivateGuestPath } from '@/features/seo/lib/route-policy'

const GATE = 'http://localhost:3000/acces-reserve'

function anonRequest(path: string): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`)
}

// Audit SEO/GEO 2026-10-05, C-03 : une URL inconnue doit atteindre le 404 de
// Next au lieu d'être réécrite en 200 vers l'écran « Accès par lien ».
describe('proxy — URL inconnues et routes privées sans séjour', () => {
  it.each([
    '/page-inexistante',
    '/mentions-legales',
    '/logementz',
    '/login',
    '/cities/saint-gervais-les-bains/qr-code',
  ])('laisse %s atteindre Next (404 ou garde propre à la page)', async path => {
    const response = await proxy(anonRequest(path))

    expect(response.headers.get('x-middleware-rewrite')).toBeNull()
    expect(response.headers.get('location')).toBeNull()
  })

  it.each([
    '/sejour',
    '/sejour/logement/arrivee',
    '/le-logement',
    '/map',
    '/mes-favoris',
    '/nos-recommandations',
    '/services-prives',
    '/contact',
  ])('garde l’écran d’accès sur la route privée %s', async path => {
    const response = await proxy(anonRequest(path))

    expect(response.headers.get('x-middleware-rewrite')).toBe(GATE)
  })

  it('ne confond pas une route privée avec un préfixe homonyme', () => {
    expect(isPrivateGuestPath('/contact')).toBe(true)
    expect(isPrivateGuestPath('/contact/x')).toBe(true)
    expect(isPrivateGuestPath('/contacts')).toBe(false)
    expect(isPrivateGuestPath('/mapping')).toBe(false)
  })

  it('classe chaque route de premier niveau de (public) comme marketing, privée ou guide', () => {
    const publicRoot = join(process.cwd(), 'src/app/(public)')
    const segments = readdirSync(publicRoot, { withFileTypes: true })
      .filter(entry => entry.isDirectory())
      .map(entry => `/${entry.name}`)
      .filter(path => path !== '/guide')

    // Un dossier sans page racine (ex. /conciergerie) est classé par ses sous-routes.
    const isMarketing = (path: string) => isAnonymousMarketingPath(path) || isAnonymousMarketingPath(`${path}/x`)
    const unclassified = segments.filter(path => !isMarketing(path) && !isPrivateGuestPath(path))
    expect(unclassified).toEqual([])
  })
})
