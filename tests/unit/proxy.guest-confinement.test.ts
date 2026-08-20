import { NextRequest } from 'next/server'
import { proxy } from '../../src/proxy'

const LODGING_ID = '11111111-1111-1111-1111-111111111111'

function guestRequest(path: string): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`, {
    headers: { cookie: `lodging_id=${LODGING_ID}` },
  })
}

function anonRequest(path: string): NextRequest {
  return new NextRequest(`http://localhost:3000${path}`)
}

function redirectPathname(res: Response): string | null {
  const location = res.headers.get('location')
  return location ? new URL(location).pathname : null
}

describe('proxy — confinement du guest en séjour', () => {
  it.each([
    '/guide/paris',
    '/guide/paris/restaurants',
    '/guide/paris/meteo',
  ])('redirige %s vers l’accueil privé pour un guest', async path => {
    const res = await proxy(guestRequest(path))
    expect(redirectPathname(res)).toBe('/sejour')
  })

  it.each([
    '/guide/paris/logements',
    '/guide/paris/logements/mon-chalet',
    '/guide/lyon/logements',
    '/guide/paris/agenda',
    '/guide/paris/mes-favoris',
    '/guide/paris/contact',
    // Fiche POI (4 segments) : accessible depuis recommandations / favoris / carte.
    '/guide/paris/restaurants/le-port',
    '/guide/chamonix/explorer/aiguille-du-midi',
  ])('laisse passer %s pour un guest', async path => {
    const res = await proxy(guestRequest(path))
    expect(redirectPathname(res)).toBeNull()
  })

  it('conserve une navigation privée profonde quand le cookie correspond au paramètre', async () => {
    const req = new NextRequest(
      `http://localhost:3000/guide/paris/restaurants?lodging=${LODGING_ID}`,
      { headers: { cookie: `lodging_id=${LODGING_ID}` } },
    )
    const res = await proxy(req)
    expect(redirectPathname(res)).toBeNull()
    expect(res.cookies.get('lodging_id')?.value).toBe(LODGING_ID)
  })

  it('ne confine pas un visiteur anonyme (sans cookie) sur la page ville', async () => {
    const res = await proxy(anonRequest('/guide/paris'))
    expect(redirectPathname(res)).toBeNull()
  })

  it.each([
    '/decouvrir/saint-gervais-les-bains',
    '/decouvrir/saint-gervais-les-bains/diner',
    '/decouvrir/saint-gervais-les-bains/diner/le-serac',
  ])('laisse la découverte publique accessible et dans le shell marketing sur %s', async path => {
    const anonymousResponse = await proxy(anonRequest(path))
    expect(anonymousResponse.headers.get('x-middleware-rewrite')).toBeNull()
    expect(
      anonymousResponse.headers.get(
        'x-middleware-request-x-staylocal-marketing-route',
      ),
    ).toBe('1')

    const guestResponse = await proxy(guestRequest(path))
    expect(redirectPathname(guestResponse)).toBeNull()
    expect(
      guestResponse.headers.get(
        'x-middleware-request-x-staylocal-marketing-route',
      ),
    ).toBe('1')
  })

  it('garde /sejour privé et marque sa requête pour le nouveau shell', async () => {
    const guestResponse = await proxy(guestRequest('/sejour'))
    expect(redirectPathname(guestResponse)).toBeNull()
    expect(
      guestResponse.headers.get(
        'x-middleware-request-x-staylocal-guide-app-route',
      ),
    ).toBe('1')

    const anonymousResponse = await proxy(anonRequest('/sejour'))
    expect(anonymousResponse.headers.get('x-middleware-rewrite')).toBe(
      'http://localhost:3000/acces-reserve',
    )
  })

  it('applique le shell privé et le contrôle d’accès à /sejour/coups-de-coeur', async () => {
    const guestResponse = await proxy(
      guestRequest('/sejour/coups-de-coeur'),
    )
    expect(redirectPathname(guestResponse)).toBeNull()
    expect(
      guestResponse.headers.get(
        'x-middleware-request-x-staylocal-guide-app-route',
      ),
    ).toBe('1')

    const anonymousResponse = await proxy(
      anonRequest('/sejour/coups-de-coeur'),
    )
    expect(anonymousResponse.headers.get('x-middleware-rewrite')).toBe(
      'http://localhost:3000/acces-reserve',
    )
  })

  it('redirige l’ancien lien recommandations vers la route canonique', async () => {
    const response = await proxy(guestRequest('/nos-recommandations'))
    expect(redirectPathname(response)).toBe('/sejour/coups-de-coeur')
  })
})
