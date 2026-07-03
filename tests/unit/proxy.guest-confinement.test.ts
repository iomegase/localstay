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
  ])('redirige %s vers / pour un guest', async path => {
    const res = await proxy(guestRequest(path))
    expect(redirectPathname(res)).toBe('/')
  })

  it.each([
    '/guide/paris/logements',
    '/guide/paris/logements/mon-chalet',
    '/guide/lyon/logements',
    '/guide/paris/agenda',
    '/guide/paris/mes-favoris',
    '/guide/paris/contact',
  ])('laisse passer %s pour un guest', async path => {
    const res = await proxy(guestRequest(path))
    expect(redirectPathname(res)).toBeNull()
  })

  it('ne confine pas une entrée QR (?lodging=) même sur une page ville profonde', async () => {
    const req = new NextRequest(
      `http://localhost:3000/guide/paris/restaurants?lodging=${LODGING_ID}`,
      { headers: { cookie: `lodging_id=${LODGING_ID}` } },
    )
    const res = await proxy(req)
    expect(redirectPathname(res)).toBeNull()
  })

  it('ne confine pas un visiteur anonyme (sans cookie) sur la page ville', async () => {
    const res = await proxy(anonRequest('/guide/paris'))
    expect(redirectPathname(res)).toBeNull()
  })
})
